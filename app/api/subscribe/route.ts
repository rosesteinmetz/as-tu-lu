import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { forwardToNewsletter, sendDownloadEmail } from '@/lib/newsletter'
import { checkRateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

export async function POST(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )

  const { email, book_id, consent_transmission, consent_newsletter, terms_version } = await request.json()

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
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const { data: book } = await supabase
    .from('books')
    .select('title, author, user_id')
    .eq('id', book_id)
    .single()

  let settings = null
  if (book?.user_id) {
    const { data: s } = await supabase
      .from('newsletter_settings')
      .select('*')
      .eq('user_id', book.user_id)
      .maybeSingle()
    settings = s
  }

  let newsletterErrors: string[] = []

  if (consent_newsletter && (settings?.api_key || settings?.provider === 'webhook')) {
    try {
      const errors = await forwardToNewsletter(email, book?.title || '', settings)
      if (errors && errors.length > 0) {
        newsletterErrors = errors
        console.error('Newsletter forward errors:', errors)
      }
    } catch (err) {
      console.error('Newsletter forward error:', err)
    }
  }

  // email de récupération avec liens directs
  if (settings?.api_key && settings?.provider === 'brevo') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://as-tu-lu.fr'
    const recoveryUrl = `${siteUrl}/dl/${downloadToken}`

    // générer les liens directs signés (1 semaine)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let downloadLinks: { url: string; label: string }[] = []
    if (serviceRoleKey && book) {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      )
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
      await sendDownloadEmail(email, book?.title || '', book?.author || '', downloadLinks, recoveryUrl, settings)
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

  return NextResponse.json({
    success: true,
    download_token: downloadToken,
    newsletter_errors: newsletterErrors.length > 0 ? newsletterErrors : undefined,
  }, { status: 201 })
}
