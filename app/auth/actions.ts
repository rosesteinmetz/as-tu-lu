'use server'

import { createClient } from '@/lib/supabase-server'

export async function signup(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = formData.get('password') as string
  const supabase = await createClient()

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm` },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Compte créé ! Vérifie tes emails pour confirmer.' }
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

