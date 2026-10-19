export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

/**
 * Nom de fichier lisible pour un ebook : « titre_auteur », sans accents ni
 * caractères spéciaux (ex. « L'heure de vivre » + « Rose Steinmetz » →
 * « l_heure_de_vivre_rose_steinmetz »).
 */
export function ebookBaseName(title: string, author: string): string {
  const part = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase()

  return `${part(title)}_${part(author)}`.replace(/^_+|_+$/g, '') || 'ebook'
}

import type { SupabaseClient } from '@supabase/supabase-js'

export async function ensureUniqueSlug(
  supabase: SupabaseClient,
  table: string,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug || 'untitled'
  let i = 1
  while (true) {
    let query = supabase.from(table).select('id').eq('slug', slug)
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return slug
    slug = `${baseSlug}-${i}`
    i++
  }
}