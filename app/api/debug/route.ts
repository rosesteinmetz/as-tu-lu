export async function GET() {
  const checks = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30) + '...'
      : 'NON DEFINI',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20) + '...'
      : 'NON DEFINI',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'NON DEFINI',
  }

  // Test Supabase health
  let supabaseStatus = 'non testé'
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
    })
    supabaseStatus = `HTTP ${res.status}: ${await res.text()}`
  } catch (err) {
    supabaseStatus = `Erreur: ${(err as Error).message}`
  }

  return Response.json({ checks, supabaseStatus })
}
