import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { unsubscribeFromNewsletter, verifyUnsubscribeToken } from '@/lib/newsletter'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const token = typeof body.token === 'string' ? body.token : ''

  const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || ''

  if (!await checkRateLimit(ip_address || 'unknown', 10, 60000)) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessaie dans une minute.' }, { status: 429 })
  }

  // Seul un jeton signé (présent dans les emails) permet un désabonnement.
  const parsed = verifyUnsubscribeToken(token)
  if (!parsed) {
    return NextResponse.json({ error: 'Lien de désabonnement invalide ou expiré.' }, { status: 400 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 500 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: subscribers, error: fetchError } = await admin
    .from('subscribers')
    .select('id, email, book_id')
    .eq('email', parsed.email)
    .eq('book_id', parsed.bookId)

  if (fetchError) {
    console.error('unsubscribe fetch error:', fetchError.message)
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 })
  }

  // Idempotent : on ne révèle pas si l'abonné existe.
  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ success: true })
  }

  // Retire l'email de la liste newsletter de l'auteur concerné.
  const { data: book } = await admin
    .from('books')
    .select('user_id')
    .eq('id', parsed.bookId)
    .maybeSingle()

  if (book?.user_id) {
    const { data: settings } = await admin
      .from('newsletter_settings')
      .select('*')
      .eq('user_id', book.user_id)
      .maybeSingle()

    if (settings) {
      const errors = await unsubscribeFromNewsletter(parsed.email, settings)
      for (const e of errors) {
        console.error(`Newsletter désabonnement (${parsed.email}): ${e}`)
      }
    }
  }

  const ids = subscribers.map((s) => s.id)
  const { error: deleteError } = await admin.from('subscribers').delete().in('id', ids)
  if (deleteError) {
    console.error('unsubscribe delete error:', deleteError.message)
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
