import { NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-request'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createRequestClient(request)
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