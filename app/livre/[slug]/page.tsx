import { createServerClient } from '@supabase/ssr'
import { notFound, redirect } from 'next/navigation'
import BookPageClient from '@/app/book/[id]/BookPageClient'

async function getBook(slug: string) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )

  // try slug first, then UUID
  let { data } = await supabase
    .from('books')
    .select('id, title, author, genre, description, cover_url, user_id, download_count, is_free, external_link, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (!data) {
    const result = await supabase
      .from('books')
      .select('id, title, author, genre, description, cover_url, user_id, download_count, is_free, external_link, slug')
      .eq('id', slug)
      .maybeSingle()
    data = result.data
  }

  return data
}

export default async function LivrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const book = await getBook(slug)

  if (!book) return notFound()

  // redirect old UUID URLs to slug URL
  if (book.slug && slug !== book.slug) {
    redirect(`/livre/${book.slug}`)
  }

  return <BookPageClient book={book} />
}