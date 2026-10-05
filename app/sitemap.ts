import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://as-tu-lu.fr', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/auth', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/auteur', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/cgu-lecteurs', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/cgu-auteurs', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/confidentialite', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/mentions-legales', lastModified: new Date() },
    { url: 'https://as-tu-lu.fr/faq', lastModified: new Date() },
  ]
}
