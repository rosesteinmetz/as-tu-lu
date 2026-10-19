import type { User } from '@supabase/supabase-js'
import { createAdminClient } from './supabase-admin'

export type AuthorRow = {
  id: string
  email: string
  name: string
  slug: string
  created_at: string
  email_confirmed: boolean
  consent: boolean
  consent_at: string | null
  books: number
}

/** Liste de tous les auteurs inscrits (comptes auth) avec profil, consentement et nb de livres. */
export async function listAuthors(): Promise<AuthorRow[]> {
  const admin = createAdminClient()

  const users: User[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < 1000) break
  }

  const [{ data: profiles }, { data: books }] = await Promise.all([
    admin.from('author_profiles').select('user_id, name, slug'),
    admin.from('books').select('user_id'),
  ])

  const profileByUser = new Map((profiles || []).map((p) => [p.user_id as string, p]))
  const bookCount = new Map<string, number>()
  for (const b of books || []) {
    bookCount.set(b.user_id, (bookCount.get(b.user_id) || 0) + 1)
  }

  return users
    .map((u) => {
      const profile = profileByUser.get(u.id)
      const meta = (u.user_metadata || {}) as Record<string, unknown>
      return {
        id: u.id,
        email: u.email || '',
        name: (profile?.name as string) || '',
        slug: (profile?.slug as string) || '',
        created_at: u.created_at,
        email_confirmed: !!u.email_confirmed_at,
        consent: meta.newsletter_consent === true,
        consent_at: typeof meta.newsletter_consent_at === 'string' ? meta.newsletter_consent_at : null,
        books: bookCount.get(u.id) || 0,
      }
    })
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}
