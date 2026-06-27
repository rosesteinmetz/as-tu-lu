import { createClient } from '@supabase/supabase-js'

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
      return Response.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    // Test raw fetch first
    const rawRes = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        redirect_to: `${siteUrl}/auth/update-password`,
      }),
    })
    const rawBody = await rawRes.text()

    if (rawRes.ok) {
      // Raw fetch succeeded
      return Response.json({ data: rawBody ? JSON.parse(rawBody) : {} })
    }

    // If raw fetch failed, try supabase-js
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/update-password`,
    })

    if (error) {
      return Response.json({
        error: error.message,
        _debug: { rawStatus: rawRes.status, rawBody, email, siteUrl },
      }, { status: 400 })
    }

    return Response.json({ data })
  } catch (err) {
    return Response.json({
      error: (err as Error).message,
      _debug: { exception: true },
    }, { status: 500 })
  }
}
