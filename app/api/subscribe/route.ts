import { createServerClient } from '@supabase/ssr'
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

  const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || ''

  const downloadToken = crypto.randomUUID()

  if (!checkRateLimit(ip_address || 'unknown', 5, 60000)) {
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

  // email de récupération
  if (settings?.api_key && settings?.provider === 'brevo') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://as-tu-lu.fr'
    const downloadUrl = `${siteUrl}/dl/${downloadToken}`
    try {
      await sendDownloadEmail(email, book?.title || '', book?.author || '', downloadUrl, settings)
    } catch (err) {
      console.error('Download email error:', err)
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
