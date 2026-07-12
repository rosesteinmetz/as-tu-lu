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

  const since = new Date(Date.now() - windowMs).toISOString()

  // nettoie les entrées expirées
  await supabase.from('rate_limits').delete().lt('created_at', since)

  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', since)

  if (count && count >= maxRequests) return false

  await supabase.from('rate_limits').insert({ key })
  return true
}