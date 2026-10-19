import { NextResponse } from 'next/server'
import { slugify, ensureUniqueSlug } from '@/lib/slug'
import { validateFile } from '@/lib/file-validator'
import { createRequestClient } from '@/lib/supabase-request'

export async function GET(request: Request) {
  const supabase = createRequestClient(request)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data } = await supabase
    .from('author_profiles')
    .select('id, name, tagline, avatar_url, bio, photo_urls, slug, user_id, created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json(data || { name: '', tagline: '', avatar_url: '', bio: '', photo_urls: [] })
}

export async function POST(request: Request) {
  const supabase = createRequestClient(request)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const formData = await request.formData()
  const name = formData.get('name') as string || user.email?.split('@')[0] || 'Autrice'
  const tagline = formData.get('tagline') as string || ''
  const bio = formData.get('bio') as string || ''
  const keepAvatar = formData.get('keep_avatar') as string || ''
  const avatarFile = formData.get('avatar') as File | null
  const photos = formData.getAll('photos') as File[]
  const keepPhotos = formData.get('keep_photos') as string || '[]'

  let existingPhotos: string[] = []
  try { existingPhotos = JSON.parse(keepPhotos) } catch {}

  const uploadedUrls: string[] = []
  let avatar_url = keepAvatar

  try {
    for (const photo of photos) {
      if (photo.size === 0) continue
      const err = validateFile(photo, 'images', 10 * 1024 * 1024)
      if (err) return NextResponse.json({ error: `Photo : ${err}` }, { status: 400 })
      const ext = photo.name.split('.').pop()
      const fileName = `author/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('images').upload(fileName, photo)
      if (error) throw new Error(error.message)
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName)
      uploadedUrls.push(publicUrl)
    }

    if (avatarFile && avatarFile.size > 0) {
      const err = validateFile(avatarFile, 'images', 5 * 1024 * 1024)
      if (err) return NextResponse.json({ error: `Avatar : ${err}` }, { status: 400 })
      const ext = avatarFile.name.split('.').pop()
      const fileName = `author/avatar-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, avatarFile)
      if (uploadError) throw new Error(uploadError.message)
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName)
      avatar_url = publicUrl
    }
  } catch (uploadErr) {
    console.error('profile upload error:', uploadErr)
    return NextResponse.json(
      { error: "Échec de l'envoi de l'image. Réessaie." },
      { status: 500 }
    )
  }

  const allPhotos = [...existingPhotos, ...uploadedUrls].slice(0, 5)

  const { data: existing } = await supabase
    .from('author_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const payload: Record<string, unknown> = { user_id: user.id, name, tagline, avatar_url, bio, photo_urls: allPhotos }

  const baseSlug = slugify(name || 'auteur')
  payload.slug = await ensureUniqueSlug(supabase, 'author_profiles', baseSlug, existing?.id)

  let error
  if (existing) {
    const result = await supabase.from('author_profiles').update(payload).eq('id', existing.id)
    error = result.error
  } else {
    const result = await supabase.from('author_profiles').insert(payload)
    error = result.error
  }

  if (error) {
    console.error('profile POST error:', error.message)
    return NextResponse.json({ error: "Impossible d'enregistrer le profil." }, { status: 500 })
  }
  return NextResponse.json({ success: true, photo_urls: allPhotos, avatar_url })
}
