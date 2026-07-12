import { createServerClient } from '@supabase/ssr'
import { notFound } from 'next/navigation'
import BookPageClient from './BookPageClient'

async function getBook(id: string) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )

  const { data } = await supabase
    .from('books')
    .select('id, title, author, genre, description, cover_url, user_id, download_count, is_free, external_link')
    .eq('id', id)
    .single()

  return data
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const book = await getBook(id)

  if (!book) return notFound()

  return <BookPageClient book={book} />
}
