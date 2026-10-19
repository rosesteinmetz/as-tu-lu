import { NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-request'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminEmail } from '@/lib/admin'
import { addAuthorToPlatformBrevo, platformAuthorsListId } from '@/lib/newsletter'

export const dynamic = 'force-dynamic'

type AccountRow = { email: string; deleted_at?: string | null }

/** Session lue depuis les cookies du navigateur, puis via l'en-tête Authorization. */
async function currentUser(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user
  const { data } = await createRequestClient(request).auth.getUser()
  return data.user
}

async function listConfirmedEmails(): Promise<string[]> {
  const admin = createAdminClient()
  const emails: string[] = []
  const seen = new Set<string>()
  const perPage = 200

  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(error.message)

    for (const account of data.users as unknown as AccountRow[]) {
      if (!account.email || account.deleted_at) continue
      const key = account.email.trim().toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      emails.push(key)
    }

    if (data.users.length < perPage) break
  }

  return emails
}

/**
 * Synchronise en masse tous les comptes d'auteurs confirmés avec la liste Brevo
 * de la plateforme. Idempotent : relancer ne crée pas de doublon.
 */
export async function POST(request: Request) {
  const user = await currentUser(request)
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 401 })
  }

  if (!process.env.PLATFORM_BREVO_API_KEY || !platformAuthorsListId()) {
    return NextResponse.json(
      { error: 'Liste Brevo des auteurs non configurée (PLATFORM_BREVO_API_KEY / PLATFORM_BREVO_AUTHORS_LIST_ID).' },
      { status: 500 }
    )
  }

  let emails: string[]
  try {
    emails = await listConfirmedEmails()
  } catch (err) {
    return NextResponse.json({ error: `Lecture des comptes impossible : ${(err as Error).message}` }, { status: 500 })
  }

  const results: Record<string, string> = {}
  const concurrency = 5

  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency)
    const settled = await Promise.allSettled(batch.map((email) => addAuthorToPlatformBrevo(email)))
    settled.forEach((outcome, index) => {
      const email = batch[index]
      results[email] = outcome.status === 'fulfilled' ? outcome.value : `exception: ${(outcome.reason as Error).message}`
    })
  }

  const count = (predicate: (r: string) => boolean) => Object.values(results).filter(predicate).length
  const failed = Object.entries(results).filter(([, r]) => r.startsWith('Brevo') || r.startsWith('exception'))

  return NextResponse.json({
    total: emails.length,
    added: count((r) => r === 'ok'),
    already: count((r) => r === 'duplicate'),
    skipped: count((r) => r === 'ignoré'),
    failed: failed.length,
    errors: failed.slice(0, 10),
  })
}
