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
