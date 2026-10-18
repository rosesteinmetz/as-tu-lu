import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email) {
      return Response.json({ error: 'Email requis' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Format d\'email invalide' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!await checkRateLimit(`reset:${ip}:${email}`, 3, 60000)) {
      return Response.json({ error: 'Trop de tentatives. Réessaie dans une minute.' }, { status: 429 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'implicit',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/update-password`,
    })

    if (error) {
      const status = (error as { status?: number }).status
      const code = (error as { code?: string }).code
      console.error('reset-password error:', { name: error.name, message: error.message, status, code })

      if (status && status >= 500) {
        return Response.json(
          { error: "Le service d'envoi d'emails est momentanément indisponible. Réessaie dans quelques minutes." },
          { status: 503 }
        )
      }
      if (status === 429 || code === 'over_email_send_rate_limit') {
        return Response.json(
          { error: "Trop de demandes d'email. Réessaie dans quelques minutes." },
          { status: 429 }
        )
      }
      return Response.json({ error: "Impossible d'envoyer l'email de réinitialisation." }, { status: 400 })
    }

    return Response.json({ data: {} })
  } catch (err) {
    console.error('reset-password error:', err)
    return Response.json({ error: 'Une erreur est survenue.' }, { status: 500 })
  }
}