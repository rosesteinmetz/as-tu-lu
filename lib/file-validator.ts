// Vercel limite le corps de requête des fonctions serveur à ~4,5 Mo : au-delà, la requête est
// rejetée par l'hébergeur avant même d'atteindre le code applicatif (413 en texte brut).
// On plafonne donc chaque envoi mixte (couverture + ePub + PDF) à 4 Mo, marge comprise.
export const MAX_EBOOK_BYTES = 4_000_000

export function totalFileSize(...files: (File | null | undefined)[]): number {
  return files.reduce((total, file) => total + (file && file.size > 0 ? file.size : 0), 0)
}

export function toMo(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} Mo`
}

const ALLOWED = {
  images: {
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    exts: ['jpg', 'jpeg', 'png', 'webp'],
  },
  epub: {
    mimes: ['application/epub+zip', 'application/octet-stream', 'application/zip'],
    exts: ['epub'],
  },
  pdf: {
    mimes: ['application/pdf', 'application/octet-stream'],
    exts: ['pdf'],
  },
  ebook: {
    mimes: ['application/epub+zip', 'application/pdf', 'application/octet-stream', 'application/zip'],
    exts: ['epub', 'pdf'],
  },
}

export function validateFile(
  file: File,
  kind: keyof typeof ALLOWED,
  maxSize: number
): string | null {
  if (file.size > maxSize) {
    const mb = Math.round(maxSize / (1024 * 1024))
    return `Le fichier dépasse ${mb} Mo`
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const mimeOk = ALLOWED[kind].mimes.includes(file.type)
  const extOk = ALLOWED[kind].exts.includes(ext)

  if (!mimeOk && !extOk) {
    return `Type de fichier non autorisé : ${file.type || ext || 'inconnu'}`
  }
  return null
}
