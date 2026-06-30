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

export async function GET(request: Request) {
  const supabase = await createClient(request)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data } = await supabase
    .from('author_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json(data || { name: 'Céline Autrice', tagline: '', avatar_url: '', bio: '', photo_urls: [] })
}

export async function POST(request: Request) {
  const supabase = await createClient(request)

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

  for (const photo of photos) {
    if (photo.size === 0) continue
    const ext = photo.name.split('.').pop()
    const fileName = `author/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('books').upload(fileName, photo)
    if (error) throw new Error(error.message)
    const { data: { publicUrl } } = supabase.storage.from('books').getPublicUrl(fileName)
    uploadedUrls.push(publicUrl)
  }

  const allPhotos = [...existingPhotos, ...uploadedUrls].slice(0, 5)

  let avatar_url = keepAvatar
  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split('.').pop()
    const fileName = `author/avatar-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('books').upload(fileName, avatarFile)
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('books').getPublicUrl(fileName)
      avatar_url = publicUrl
    }
  }

  const { data: existing } = await supabase
    .from('author_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const payload = { user_id: user.id, name, tagline, avatar_url, bio, photo_urls: allPhotos }

  let error
  if (existing) {
    const result = await supabase.from('author_profiles').update(payload).eq('id', existing.id)
    error = result.error
  } else {
    const result = await supabase.from('author_profiles').insert(payload)
    error = result.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, photo_urls: allPhotos })
}
