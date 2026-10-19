import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse, after } from 'next/server'
import { createRequestClient, createAnonClient } from '@/lib/supabase-request'
import { removeAuthorFromPlatformBrevo } from '@/lib/newsletter'

const extractStoragePath = (url: string | null | undefined) => {
  if (!url) return null
  const match = url.match(/\/object\/(?:public|authenticated)\/([^/]+)\/(.+)/)
  return match ? { bucket: match[1], path: match[2] } : null
}

/**
 * Suppression définitive du compte de l'auteur connecté et de toutes ses
 * données (profil, livres, abonnés, paramètres newsletter, fichiers Storage,
 * puis le compte lui-même). Exigé par le RGPD (droit à l'effacement).
 */
export async function DELETE(request: Request) {
  const supabase = createRequestClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const confirmation = String(body.confirmation || '').trim().toUpperCase()
  const password = String(body.password || '')

  if (confirmation !== 'SUPPRIMER') {
    return NextResponse.json({ error: 'Saisis « SUPPRIMER » pour confirmer.' }, { status: 400 })
  }

  const anon = createAnonClient()
  const { error: authError } = await anon.auth.signInWithPassword({
    email: user.email!,
    password,
  })
  if (authError) {
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 400 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Suppression momentanément indisponible.' }, { status: 500 })
  }
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  try {
    const [{ data: books }, { data: profile }] = await Promise.all([
      admin.from('books').select('cover_url, epub_url, pdf_url').eq('user_id', user.id),
      admin.from('author_profiles').select('avatar_url, photo_urls').eq('user_id', user.id).maybeSingle(),
    ])

    const urls: (string | null)[] = []
    for (const book of books || []) {
      urls.push(book.cover_url, book.epub_url, book.pdf_url)
    }
    if (profile) {
      urls.push(profile.avatar_url)
      for (const photo of profile.photo_urls || []) urls.push(photo)
    }

    // Données de lecteur liées à cet email (abonnements aux newsletters).
    if (user.email) {
      await admin.from('subscribers').delete().eq('email', user.email)
    }

    // Supprime le compte : books, author_profiles et newsletter_settings
    // disparaissent en cascade (ON DELETE CASCADE).
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('account DELETE error:', deleteError.message)
      return NextResponse.json({ error: 'Impossible de supprimer le compte. Réessaie.' }, { status: 500 })
    }

    // Fichiers Storage (best effort : le compte est déjà supprimé).
    const byBucket: Record<string, string[]> = {}
    for (const url of urls) {
      const parsed = extractStoragePath(url)
      if (parsed) (byBucket[parsed.bucket] ??= []).push(parsed.path)
    }
    await Promise.all(
      Object.entries(byBucket).map(async ([bucket, files]) => {
        const { error } = await admin.storage.from(bucket).remove(files)
        if (error) console.error(`Storage cleanup (${bucket}) échoué:`, error.message)
      })
    )

    // Retire l'auteur de la liste Brevo de la plateforme (best effort).
    if (user.email) {
      const email = user.email
      after(async () => {
        try {
          const result = await removeAuthorFromPlatformBrevo(email)
          if (result.startsWith('Brevo')) console.error('account DELETE Brevo:', result)
        } catch (err) {
          console.error('account DELETE Brevo exception:', (err as Error).message)
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('account DELETE exception:', err)
    return NextResponse.json({ error: 'Impossible de supprimer le compte. Réessaie.' }, { status: 500 })
  }
}
