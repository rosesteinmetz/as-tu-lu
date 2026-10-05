import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: 'https://as-tu-lu.fr', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/auth', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/auteur', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/cgu-lecteurs', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/cgu-auteurs', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/confidentialite', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/mentions-legales', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/faq', lastModified: new Date() },
  ]

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return routes

    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: { getAll() { return [] }, setAll() {} },
    })

    const [{ data: books }, { data: profiles }] = await Promise.all([
      supabase.from('books').select('slug, id, updated_at'),
      supabase.from('author_profiles').select('slug, user_id'),
    ])

    books?.forEach((book) => {
      if (book.slug) {
        routes.push({
          url: `https://as-tu-lu.fr/livre/${book.slug}`,
          lastModified: book.updated_at ? new Date(book.updated_at) : new Date(),
        })
      }
    })

    profiles?.forEach((p: any) => {
      const slug = p.slug || p.user_id
      if (slug) {
        routes.push({
          url: `https://as-tu-lu.fr/auteur/${slug}`,
          lastModified: new Date(),
        })
      }
    })
  } catch (e) {
    console.error(e)
  }

  return routes
}
