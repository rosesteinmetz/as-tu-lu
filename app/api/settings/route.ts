import { NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-request'
import { isSafePublicUrl } from '@/lib/url-guard'

export async function GET(request: Request) {
  const supabase = createRequestClient(request)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data } = await supabase
    .from('newsletter_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json(data || { provider: 'brevo', api_key: '', list_id: '', webhook_url: '', notify_email: '' })
}

export async function POST(request: Request) {
  const supabase = createRequestClient(request)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()
  const { api_key, list_id, webhook_url, notify_email } = body

  const ALLOWED_PROVIDERS = ['brevo', 'mailerlite', 'webhook', 'notify']
  const provider = ALLOWED_PROVIDERS.includes(body.provider) ? body.provider : 'notify'

  if (webhook_url) {
    if (typeof webhook_url !== 'string' || !(await isSafePublicUrl(webhook_url))) {
      return NextResponse.json(
        { error: "L'URL du webhook doit être une adresse https publique." },
        { status: 400 }
      )
    }
  }

  const { data: existing } = await supabase
    .from('newsletter_settings')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  let error
  if (existing) {
    const result = await supabase
      .from('newsletter_settings')
      .update({ provider, api_key, list_id, webhook_url, notify_email })
      .eq('id', existing.id)
    error = result.error
  } else {
    const result = await supabase
      .from('newsletter_settings')
      .insert({ provider, api_key, list_id, webhook_url, notify_email, user_id: user.id })
    error = result.error
  }

  if (error) {
    console.error('settings POST error:', error.message)
    return NextResponse.json({ error: "Impossible d'enregistrer les paramètres." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
