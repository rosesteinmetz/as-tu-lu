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
    const status = (error as { status?: number }).status
    const code = (error as { code?: string }).code
    console.error('signup error:', { name: error.name, message: error.message, status, code })

    if (status && status >= 500) {
      return { error: "Le service d'envoi d'emails est momentanément indisponible. Réessaie dans quelques minutes." }
    }
    if (status === 429 || code === 'over_email_send_rate_limit') {
      return { error: 'Trop de tentatives. Réessaie dans quelques minutes.' }
    }
    if (code === 'user_already_exists' || code === 'email_exists') {
      return { error: 'Un compte existe déjà avec cet email.' }
    }
    if (code === 'weak_password') {
      return { error: 'Mot de passe trop faible : 8 caractères minimum.' }
    }
    return { error: 'Impossible de créer le compte. Vérifie ton email et réessaie.' }
  }

  await supabase.auth.signOut()

  return { success: 'Compte créé ! Vérifie tes emails pour confirmer.' }
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const code = (error as { code?: string }).code
    console.error('login error:', { name: error.name, message: error.message, code })

    if (code === 'invalid_credentials') {
      return { error: 'Email ou mot de passe incorrect.' }
    }
    if (code === 'email_not_confirmed') {
      return { error: 'Email non confirmé : vérifie ta boîte de réception.' }
    }
    return { error: 'Connexion impossible pour le moment. Réessaie dans un instant.' }
  }

  return { success: true }
}

