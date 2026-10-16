import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase serveur pour les routes API.
 *
 * Le jeton d'accès est transmis via `global.headers.Authorization` :
 * il est utilisé à la fois pour `auth.getUser()` et pour les requêtes
 * PostgREST/Storage (RLS appliquée en tant qu'utilisateur). Cela évite
 * le hack `setSession({ access_token, refresh_token: token })`.
 */
export function createRequestClient(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
    }
  )
}

/** Client anonyme (lecture publique uniquement). */
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export type RequestClient = ReturnType<typeof createRequestClient>
