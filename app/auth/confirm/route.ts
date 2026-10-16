import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

function safeNext(next: string | null): string {
  if (!next) return '/dashboard'
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return '/dashboard'
  }
  return next
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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  const errorUrl = new URL('/auth', request.url)
  errorUrl.searchParams.set('error', 'Lien de confirmation invalide ou expiré. Demande un nouveau lien.')
  return NextResponse.redirect(errorUrl)
}
