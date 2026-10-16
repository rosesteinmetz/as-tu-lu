import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://as-tu-lu.fr'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${SITE_URL}/auteur`, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${SITE_URL}/cgu-lecteurs`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${SITE_URL}/cgu-auteurs`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${SITE_URL}/confidentialite`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${SITE_URL}/mentions-legales`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly' as const, priority: 0.5 },
  ]

  const [{ data: books }, { data: authors }] = await Promise.all([
    supabase.from('books').select('slug, id, created_at'),
    supabase.from('author_profiles').select('slug, user_id, created_at'),
  ])

  const bookRoutes: MetadataRoute.Sitemap = (books || []).map((b) => ({
    url: `${SITE_URL}/livre/${b.slug || b.id}`,
    lastModified: b.created_at ? new Date(b.created_at) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const authorRoutes: MetadataRoute.Sitemap = (authors || []).map((a) => ({
    url: `${SITE_URL}/auteur/${a.slug || a.user_id}`,
    lastModified: a.created_at ? new Date(a.created_at) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...bookRoutes, ...authorRoutes]
}
