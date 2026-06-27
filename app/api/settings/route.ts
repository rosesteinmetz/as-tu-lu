import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

async function createClient(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').map(c => {
    const [name, ...rest] = c.trim().split('=')
    return { name, value: rest.join('=') }
  }).filter(c => c.name)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookies }, setAll() {} } }
  )

  if (token) {
    await supabase.auth.setSession({ access_token: token, refresh_token: '' })
  }

  return supabase
}

export async function GET(request: Request) {
  const supabase = await createClient(request)

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
  const supabase = await createClient(request)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()
  const { provider, api_key, list_id, webhook_url, notify_email } = body

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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
