import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { forwardToNewsletter, sendDownloadEmail, signUnsubscribeToken } from '@/lib/newsletter'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAnonClient } from '@/lib/supabase-request'
import crypto from 'crypto'

export async function POST(request: Request) {
  const supabase = createAnonClient()

  const body = await request.json().catch(() => ({}))
  const { book_id, consent_transmission, consent_newsletter, terms_version } = body
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email || !book_id) {
    return NextResponse.json({ error: 'Email et book_id requis' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Format d\'email invalide' }, { status: 400 })
  }

  const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || ''

  const downloadToken = crypto.randomUUID()

  if (!await checkRateLimit(ip_address || 'unknown', 5, 60000)) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessaie dans une minute.' }, { status: 429 })
  }

  const { error: insertError } = await supabase
    .from('subscribers')
    .insert({
      email,
      book_id,
      consent_transmission: consent_transmission || false,
      consent_newsletter: consent_newsletter || false,
      consent_date: new Date().toISOString(),
      ip_address,
      terms_version: terms_version || '1.0',
      download_token: downloadToken,
    })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Cet email est déjà inscrit pour ce livre' }, { status: 409 })
    }
    console.error('subscribe insert error:', insertError.message)
    return NextResponse.json({ error: 'Inscription impossible pour le moment.' }, { status: 500 })
  }

  // Lecture des données de l'auteur via admin (RLS : newsletter_settings est privé au propriétaire)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const admin = serviceRoleKey
    ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null
  const db = admin ?? supabase

  const { data: book } = await db
    .from('books')
    .select('title, author, user_id')
    .eq('id', book_id)
    .single()

  let settings = null
  if (book?.user_id) {
    const { data: s } = await db
      .from('newsletter_settings')
      .select('*')
      .eq('user_id', book.user_id)
      .maybeSingle()
    settings = s
  }

  const newsletterConfig = settings ?? {
    provider: '', api_key: '', list_id: '', webhook_url: '', notify_email: '',
  }

  let newsletterErrors: string[] = []

  // Intégration newsletter (selon le provider choisi) + notification à l'auteur.
  if (settings) {
    try {
      const errors = await forwardToNewsletter(email, book?.title || '', settings, {
        transmission: !!consent_transmission,
        newsletter: !!consent_newsletter,
      })
      if (errors.length > 0) {
        newsletterErrors = errors
        console.error('Newsletter forward errors:', errors)
      }
    } catch (err) {
      console.error('Newsletter forward error:', err)
    }
  }

  // Email de récupération au lecteur, avec liens directs (indépendant du provider).
  if (book) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://as-tu-lu.fr'
    const recoveryUrl = `${siteUrl}/dl/${downloadToken}`
    const unsubscribeUrl = `${siteUrl}/desabonnement?token=${encodeURIComponent(
      signUnsubscribeToken(email, book_id)
    )}`

    // générer les liens directs signés (1 semaine)
    let downloadLinks: { url: string; label: string }[] = []
    if (admin) {
      const { data: bookFiles } = await admin
        .from('books')
        .select('epub_url, pdf_url')
        .eq('id', book_id)
        .single()

      const toSigned = async (fileUrl: string | null, label: string) => {
        if (!fileUrl) return null
        const match = fileUrl.match(/\/object\/public\/([^/]+)\/(.+)/)
        if (!match) return null
        const { data } = await admin.storage
          .from(match[1])
          .createSignedUrl(match[2], 604800)
        return data?.signedUrl ? { url: data.signedUrl, label } : null
      }

      const results = await Promise.all([
        toSigned(bookFiles?.epub_url || null, 'Télécharger ePub'),
        toSigned(bookFiles?.pdf_url || null, 'Télécharger PDF'),
      ])
      downloadLinks = results.filter(Boolean) as { url: string; label: string }[]
    }

    try {
      await sendDownloadEmail(email, book.title || '', book.author || '', downloadLinks, recoveryUrl, unsubscribeUrl, newsletterConfig)
    } catch (err) {
      const msg = `Email récupération: ${(err as Error).message}`
      console.error(msg)
      if (!newsletterErrors.includes(msg)) newsletterErrors.push(msg)
    }
  }

  try {
    const { error: rpcError } = await supabase.rpc('increment_download_count', { book_id })
    if (rpcError) console.error('Failed to update download count:', rpcError)
  } catch (err) {
    console.error('Failed to update download count:', err)
  }

  if (newsletterErrors.length > 0) {
    console.error('subscribe notifications:', newsletterErrors)
  }

  return NextResponse.json({
    success: true,
    download_token: downloadToken,
  }, { status: 201 })
}
