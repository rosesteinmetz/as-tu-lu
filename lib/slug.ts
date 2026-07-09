export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

export async function ensureUniqueSlug(
  supabase: any,
  table: string,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug || 'untitled'
  let i = 1
  while (true) {
    let query = supabase.from(table).select('id').eq('slug', slug).maybeSingle()
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query
    if (!data) return slug
    slug = `${baseSlug}-${i}`
    i++
  }
}