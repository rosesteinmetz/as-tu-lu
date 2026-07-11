import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(_request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token requis' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )

  const { data: sub } = await supabase
    .from('subscribers')
    .select('id')
    .eq('book_id', id)
    .eq('download_token', token)
    .maybeSingle()

  if (!sub) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  const { data: book } = await supabase
    .from('books')
    .select('epub_url, pdf_url')
    .eq('id', id)
    .single()

  if (!book) {
    return NextResponse.json({ error: 'Livre introuvable' }, { status: 404 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({
      epub_url: book.epub_url,
      pdf_url: book.pdf_url,
      _warning: 'bucket public',
    })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/books/`

  const toSigned = async (fileUrl: string | null) => {
    if (!fileUrl) return null
    const filePath = fileUrl.replace(storageUrl, '')
    const { data } = await admin.storage
      .from('books')
      .createSignedUrl(filePath, 300)
    return data?.signedUrl || null
  }

  const [epub_url, pdf_url] = await Promise.all([
    toSigned(book.epub_url),
    toSigned(book.pdf_url),
  ])

  return NextResponse.json({ epub_url, pdf_url })
}