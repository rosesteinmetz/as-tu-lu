import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isAdminEmail } from '@/lib/admin'
import { listAuthors } from '@/lib/author-directory'

export const dynamic = 'force-dynamic'

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const authors = await listAuthors()

  const header = ['email', 'nom', 'profil', 'inscription', 'email_confirme', 'consentement', 'date_consentement', 'livres']
  const lines = [header.map(csvCell).join(',')]
  for (const a of authors) {
    lines.push(
      [
        a.email,
        a.name,
        a.slug ? `/auteur/${a.slug}` : '',
        a.created_at,
        a.email_confirmed ? 'oui' : 'non',
        a.consent ? 'oui' : 'non',
        a.consent_at || '',
        String(a.books),
      ].map(csvCell).join(',')
    )
  }

  return new NextResponse('\ufeff' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="auteurs-as-tu-lu.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
