export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return Response.json({ error: 'Email requis' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase env vars')
      return Response.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    const res = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        redirect_to: `${siteUrl}/auth/update-password`,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('Supabase auth error:', res.status, body)
      return Response.json({ error: body || `Erreur ${res.status}` }, { status: 400 })
    }

    const data = await res.json()
    return Response.json({ data })
  } catch (err) {
    console.error('reset-password exception:', err)
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
