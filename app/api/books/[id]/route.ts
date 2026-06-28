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

const anonClient = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies: { getAll() { return [] }, setAll() {} } }
)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: book, error } = await anonClient
    .from('books')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Livre introuvable' }, { status: 404 })
  }

  return NextResponse.json(book)
}

async function uploadFile(
  supabase: any,
  file: File,
  prefix: string
): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'bin'
  const fileName = `${prefix}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('books')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) return null

  const { data: urlData } = supabase.storage
    .from('books')
    .getPublicUrl(fileName)

  return urlData?.publicUrl || null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const formData = await request.formData()

  const title = formData.get('title') as string
  const author = formData.get('author') as string
  const genre = formData.get('genre') as string
  const description = formData.get('description') as string
  const isFree = formData.get('is_free') === 'true'
  const externalLink = formData.get('external_link') as string

  const updates: Record<string, any> = {
    title, author, genre, description,
    is_free: isFree,
    external_link: isFree ? '' : (externalLink || ''),
  }

  const coverFile = formData.get('cover') as File | null
  if (coverFile && coverFile.size > 0 && coverFile.name) {
    const url = await uploadFile(supabase, coverFile, `cover-${id}`)
    if (url) updates.cover_url = url
  }

  const epubFile = formData.get('epub') as File | null
  if (epubFile && epubFile.size > 0 && epubFile.name) {
    const url = await uploadFile(supabase, epubFile, `epub-${id}`)
    if (url) updates.epub_url = url
  }

  const pdfFile = formData.get('pdf') as File | null
  if (pdfFile && pdfFile.size > 0 && pdfFile.name) {
    const url = await uploadFile(supabase, pdfFile, `pdf-${id}`)
    if (url) updates.pdf_url = url
  }

  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Introuvable ou accès refusé.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { data, error } = await supabase
    .from('books')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Introuvable ou accès refusé.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}