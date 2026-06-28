import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_FILE_SIZE = 50 * 1024 * 1024

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
    {
      cookies: {
        getAll() { return cookies },
        setAll() {},
      },
    }
  )

  if (token) {
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    })
  }

  return supabase
}

const publicClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  let query = publicClient
    .from('books')
    .select('id, title, author, genre, cover_url, user_id, download_count, is_free, external_link')

  if (userId) query = query.eq('user_id', userId)

  const { data: books, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(books)
}

export async function POST(request: Request) {
  const supabase = await createClient(request)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const formData = await request.formData()
  const title = formData.get('title') as string
  const author = formData.get('author') as string
  const genre = formData.get('genre') as string
  const description = formData.get('description') as string
  const isFree = formData.get('is_free') === 'true'
  const externalLink = formData.get('external_link') as string

  const coverFile = formData.get('cover') as File | null
  const epubFile = formData.get('epub') as File | null
  const pdfFile = formData.get('pdf') as File | null

  if (coverFile && coverFile.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: `L'image de couverture dépasse 5 Mo.` }, { status: 400 })
  }
  for (const f of [epubFile, pdfFile]) {
    if (f && f.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `Un des fichiers dépasse 50 Mo.` }, { status: 400 })
    }
  }

  let cover_url = null
  let epub_url = null
  let pdf_url = null

  const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase()
  const baseName = `${slug(title)}_${slug(author)}`

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop()
    const fileName = `${folder}/${baseName}.${ext}`
    const { error } = await supabase.storage
      .from('books')
      .upload(fileName, file)

    if (error) throw new Error(error.message)

    const { data: { publicUrl } } = supabase.storage
      .from('books')
      .getPublicUrl(fileName)

    return publicUrl
  }

  try {
    if (coverFile && coverFile.size > 0) {
      cover_url = await uploadFile(coverFile, 'covers')
    }
    if (epubFile && epubFile.size > 0) {
      epub_url = await uploadFile(epubFile, 'epub')
    }
    if (pdfFile && pdfFile.size > 0) {
      pdf_url = await uploadFile(pdfFile, 'pdf')
    }

    const { data: book, error } = await supabase
      .from('books')
      .insert({
        title, author, genre, description,
        cover_url, epub_url, pdf_url,
        is_free: isFree,
        external_link: isFree ? '' : (externalLink || ''),
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json(book, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
