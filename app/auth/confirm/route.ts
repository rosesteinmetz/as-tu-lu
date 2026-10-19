import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { addAuthorToPlatformBrevo } from '@/lib/newsletter'

function safeNext(next: string | null): string {
  if (!next) return '/dashboard'
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return '/dashboard'
  }
  return next
}

/**
 * Ajoute l'auteur à la liste Brevo de la plateforme, après la réponse pour ne
 * pas ralentir la redirection. Idempotent : un auteur déjà présent est ignoré.
 */
function scheduleAuthorSync(email: string | undefined) {
  if (!email) return
  after(async () => {
    try {
      const result = await addAuthorToPlatformBrevo(email)
      if (result.startsWith('Brevo')) console.error('sync auteurs Brevo:', email, result)
    } catch (err) {
      console.error('sync auteurs Brevo exception:', email, (err as Error).message)
    }
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  const destination = type === 'recovery' ? '/auth/update-password' : next

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (data.user?.email_confirmed_at) scheduleAuthorSync(data.user.email)
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  if (token_hash && type) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      if (type === 'signup') scheduleAuthorSync(data.user?.email)
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  const errorUrl = new URL('/auth', request.url)
  errorUrl.searchParams.set('error', 'Lien de confirmation invalide ou expiré. Demande un nouveau lien.')
  return NextResponse.redirect(errorUrl)
}
