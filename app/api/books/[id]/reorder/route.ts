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

  // get all books for this user sorted
  const { data: allBooks } = await supabase
    .from('books')
    .select('id')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (!allBooks || allBooks.length < 2) {
    return NextResponse.json({ error: 'Pas assez de livres' }, { status: 400 })
  }

  const idx = allBooks.findIndex((b) => b.id === id)
  if (idx === -1) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }

  const neighborIdx = direction === 'up' ? idx - 1 : idx + 1
  if (neighborIdx < 0 || neighborIdx >= allBooks.length) {
    return NextResponse.json({ error: 'Déjà en limite' }, { status: 400 })
  }

  // swap positions in the array
  const reordered = [...allBooks]
  ;[reordered[idx], reordered[neighborIdx]] = [reordered[neighborIdx], reordered[idx]]

  // reassign sequential sort_order values
  const updates = reordered.map((book, i) =>
    supabase.from('books').update({ sort_order: i + 1 }).eq('id', book.id)
  )

  await Promise.all(updates)

  return NextResponse.json({ success: true })
}