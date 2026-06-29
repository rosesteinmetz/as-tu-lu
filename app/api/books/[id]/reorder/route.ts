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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { direction } = await request.json()
  if (!['up', 'down'].includes(direction)) {
    return NextResponse.json({ error: 'Direction invalide' }, { status: 400 })
  }

  // get current book
  const { data: current } = await supabase
    .from('books')
    .select('id, user_id, sort_order')
    .eq('id', id)
    .single()

  if (!current || current.user_id !== user.id) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }

  // find the neighbor
  const operator = direction === 'up' ? 'lt' : 'gt'
  const orderDir = direction === 'up' ? 'desc' : 'asc'

  const { data: neighbor } = await supabase
    .from('books')
    .select('id, sort_order')
    .eq('user_id', user.id)
    .filter('sort_order', operator, current.sort_order)
    .order('sort_order', { ascending: orderDir === 'asc' })
    .limit(1)
    .maybeSingle()

  if (!neighbor) {
    return NextResponse.json({ error: 'Déjà en limite' }, { status: 400 })
  }

  // swap sort_order
  const { error: err1 } = await supabase
    .from('books')
    .update({ sort_order: neighbor.sort_order })
    .eq('id', current.id)

  const { error: err2 } = await supabase
    .from('books')
    .update({ sort_order: current.sort_order })
    .eq('id', neighbor.id)

  if (err1 || err2) {
    return NextResponse.json({ error: 'Erreur lors du réordonnancement' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}