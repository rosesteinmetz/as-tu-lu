import { NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-request'

export async function GET(request: Request) {
  const supabase = createRequestClient(request)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: userBooks } = await supabase
    .from('books')
    .select('id')
    .eq('user_id', user.id)

  const bookIds = userBooks?.map((b: { id: string }) => b.id) || []

  if (bookIds.length === 0) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from('subscribers')
    .select('*, books(title)')
    .in('book_id', bookIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('subscribers GET error:', error.message)
    return NextResponse.json({ error: 'Impossible de charger les abonnés.' }, { status: 500 })
  }

  return NextResponse.json(data)
}
