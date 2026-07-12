const ALLOWED = {
  images: ['image/jpeg', 'image/png', 'image/webp'],
  epub: ['application/epub+zip'],
  pdf: ['application/pdf'],
  ebook: ['application/epub+zip', 'application/pdf'],
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
  if (!ALLOWED[kind].includes(file.type)) {
    return `Type de fichier non autorisé : ${file.type || 'inconnu'}`
  }
  return null
}