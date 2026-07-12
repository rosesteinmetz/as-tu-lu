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

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Service non configuré' }, { status: 500 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  const { data: sub } = await admin
    .from('subscribers')
    .select('id, created_at')
    .eq('book_id', id)
    .eq('download_token', token)
    .maybeSingle()

  if (!sub) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  const MAX_AGE = 30 * 24 * 60 * 60 * 1000
  if (Date.now() - new Date(sub.created_at).getTime() > MAX_AGE) {
    return NextResponse.json({ error: 'Token expiré' }, { status: 410 })
  }

  const { data: book } = await admin
    .from('books')
    .select('epub_url, pdf_url')
    .eq('id', id)
    .single()

  if (!book) {
    return NextResponse.json({ error: 'Livre introuvable' }, { status: 404 })
  }

  const toSigned = async (fileUrl: string | null) => {
    if (!fileUrl) return null
    const match = fileUrl.match(/\/object\/public\/([^/]+)\/(.+)/)
    if (!match) return null
    const { data } = await admin.storage
      .from(match[1])
      .createSignedUrl(match[2], 300)
    return data?.signedUrl || null
  }

  const [epub_url, pdf_url] = await Promise.all([
    toSigned(book.epub_url),
    toSigned(book.pdf_url),
  ])

  return NextResponse.json({ epub_url, pdf_url })
}