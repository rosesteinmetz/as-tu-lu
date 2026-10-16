import { createClient } from '@supabase/supabase-js'

export async function checkRateLimit(
  key: string,
  maxRequests = 5,
  windowMs = 60000
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_max: maxRequests,
    p_window_seconds: Math.ceil(windowMs / 1000),
  })

  if (error) {
    // En cas d'erreur infra on ne bloque pas l'utilisateur (fail open).
    console.error('check_rate_limit error:', error.message)
    return true
  }

  return data === true
}
