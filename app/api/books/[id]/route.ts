import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { slugify, ensureUniqueSlug } from '@/lib/slug'
import { validateFile, MAX_EBOOK_BYTES, totalFileSize, toMo } from '@/lib/file-validator'
import { createRequestClient, createAnonClient, type RequestClient } from '@/lib/supabase-request'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const anonClient = createAnonClient()

  const { data: book, error } = await anonClient
    .from('books')
    .select('id, title, author, genre, description, cover_url, user_id, download_count, is_free, external_link, slug, epub_url, pdf_url')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Livre introuvable' }, { status: 404 })
  }

  // Les URLs des fichiers ne sont exposées qu'au propriétaire.
  const supabase = createRequestClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== book.user_id) {
    const publicBook = { ...book }
    delete publicBook.epub_url
    delete publicBook.pdf_url
    return NextResponse.json(publicBook)
  }

  return NextResponse.json(book)
}

async function uploadFile(
  supabase: RequestClient,
  file: File,
  bucket: string,
  prefix: string
): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'bin'
  const fileName = `${prefix}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error(error.message)

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return urlData?.publicUrl || null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createRequestClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  // Vérifier la propriété AVANT tout upload de fichier.
  const { data: owned } = await supabase
    .from('books')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!owned) {
    return NextResponse.json({ error: 'Introuvable ou accès refusé.' }, { status: 404 })
  }

  const formData = await request.formData()

  const title = formData.get('title') as string
  const author = formData.get('author') as string
  const genre = formData.get('genre') as string
  const description = formData.get('description') as string
  const isFree = formData.get('is_free') === 'true'
  const externalLink = formData.get('external_link') as string

  if (!title?.trim() || !author?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'Titre, auteur et description sont requis.' }, { status: 400 })
  }

  if (!genre?.trim()) {
    return NextResponse.json({ error: 'Le genre littéraire est requis.' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    title, author, genre, description,
    is_free: isFree,
    external_link: isFree ? '' : (externalLink || ''),
  }

  const coverFile = formData.get('cover') as File | null
  const epubFile = formData.get('epub') as File | null
  const pdfFile = formData.get('pdf') as File | null

  const totalBytes = totalFileSize(coverFile, epubFile, pdfFile)
  if (totalBytes > MAX_EBOOK_BYTES) {
    return NextResponse.json({ error: `Couverture et fichiers font ${toMo(totalBytes)} au total, au-delà de la limite de ${toMo(MAX_EBOOK_BYTES)} par envoi. Retire la couverture ou réduis les fichiers.` }, { status: 400 })
  }

  try {
    if (coverFile && coverFile.size > 0 && coverFile.name) {
      const err = validateFile(coverFile, 'images', MAX_EBOOK_BYTES)
      if (err) return NextResponse.json({ error: `Couverture : ${err}` }, { status: 400 })
      const url = await uploadFile(supabase, coverFile, 'images', `covers/${id}`)
      if (url) updates.cover_url = url
    }

    if (epubFile && epubFile.size > 0 && epubFile.name) {
      const err = validateFile(epubFile, 'epub', MAX_EBOOK_BYTES)
      if (err) return NextResponse.json({ error: `ePub : ${err}` }, { status: 400 })
      const url = await uploadFile(supabase, epubFile, 'books', `epub-${id}`)
      if (url) updates.epub_url = url
    }

    if (pdfFile && pdfFile.size > 0 && pdfFile.name) {
      const err = validateFile(pdfFile, 'pdf', MAX_EBOOK_BYTES)
      if (err) return NextResponse.json({ error: `PDF : ${err}` }, { status: 400 })
      const url = await uploadFile(supabase, pdfFile, 'books', `pdf-${id}`)
      if (url) updates.pdf_url = url
    }
  } catch (uploadErr) {
    console.error('book file upload error:', uploadErr)
    return NextResponse.json(
      { error: "Échec de l'envoi du fichier. Réessaie." },
      { status: 500 }
    )
  }

  // regen slug if title changed
  if (title) {
    const baseSlug = slugify(title)
    updates.slug = await ensureUniqueSlug(supabase, 'books', baseSlug, id)
  }

  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    console.error('book PUT error:', error.message)
    return NextResponse.json({ error: 'Impossible de mettre à jour le livre.' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Introuvable ou accès refusé.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

const extractStoragePath = (url: string | null) => {
  if (!url) return null
  const match = url.match(/\/object\/(?:public|authenticated)\/([^/]+)\/(.+)/)
  return match ? { bucket: match[1], path: match[2] } : null
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createRequestClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  // fetch book files before deleting
  const { data: book } = await supabase
    .from('books')
    .select('cover_url, epub_url, pdf_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!book) {
    return NextResponse.json({ error: 'Introuvable ou accès refusé.' }, { status: 404 })
  }

  // Supprimer d'abord la ligne en base, puis les fichiers (évite les données orphelines).
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('book DELETE error:', error.message)
    return NextResponse.json({ error: 'Impossible de supprimer le livre.' }, { status: 500 })
  }

  // Suppression des fichiers via admin (best effort, ne bloque pas la réponse).
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey) {
    try {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      )
      const paths = [book.cover_url, book.epub_url, book.pdf_url]
        .map(extractStoragePath)
        .filter(Boolean) as { bucket: string; path: string }[]
      const byBucket: Record<string, string[]> = {}
      for (const { bucket, path } of paths) {
        (byBucket[bucket] ??= []).push(path)
      }
      await Promise.all(
        Object.entries(byBucket).map(([bucket, files]) =>
          admin.storage.from(bucket).remove(files)
        )
      )
    } catch (err) {
      console.error('Suppression des fichiers échouée:', err)
    }
  }

  return NextResponse.json({ success: true })
}