/*
 * Migration Storage : déplace les images (couvertures, avatars, photos)
 * du bucket `books` vers le bucket public `images`, met à jour les URLs en base,
 * puis passe le bucket `books` en privé (ebooks ePub/PDF uniquement).
 *
 * Usage :
 *   npx tsx scripts/migrate-storage-to-images.ts --dry-run   (défaut, aucune modification)
 *   npx tsx scripts/migrate-storage-to-images.ts --apply     (exécution réelle)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!match) continue
      const [, key, value] = match
      if (!process.env[key]) process.env[key] = value.replace(/^["']|["']$/g, '')
    }
  } catch {
    // .env.local absent : on suppose que les variables sont déjà dans l'environnement
  }
}

loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APPLY = process.argv.includes('--apply')
const DRY_RUN = !APPLY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Variables manquantes : NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const SOURCE_BUCKET = 'books'
const DEST_BUCKET = 'images'
const IMAGE_PREFIXES = ['covers/', 'author/', 'cover-', 'avatar-']
const isImage = (path: string) => IMAGE_PREFIXES.some((p) => path.startsWith(p))

async function listAll(bucket: string, prefix = ''): Promise<{ path: string; id: string | null }[]> {
  const out: { path: string; id: string | null }[] = []
  let offset = 0
  const limit = 1000
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit, offset })
    if (error) throw error
    if (!data || data.length === 0) break
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id === null) {
        // dossier
        const nested = await listAll(bucket, full)
        out.push(...nested)
      } else {
        out.push({ path: full, id: item.id })
      }
    }
    if (data.length < limit) break
    offset += limit
  }
  return out
}

async function existsInBucket(bucket: string, path: string): Promise<boolean> {
  const idx = path.lastIndexOf('/')
  const dir = idx === -1 ? '' : path.slice(0, idx)
  const name = idx === -1 ? path : path.slice(idx + 1)
  const { data, error } = await supabase.storage.from(bucket).list(dir, { limit: 1000 })
  if (error) return false
  return (data || []).some((f) => f.name === name && f.id !== null)
}

async function main() {
  console.log(`\n=== Migration Storage ${DRY_RUN ? '(DRY-RUN, aucune modification)' : '(APPLY)'} ===\n`)

  const allObjects = await listAll(SOURCE_BUCKET)
  const imageObjects = allObjects.filter((o) => isImage(o.path))
  const protectedObjects = allObjects.filter((o) => !isImage(o.path))

  console.log(`Objets dans "${SOURCE_BUCKET}" : ${allObjects.length}`)
  console.log(`  - images (à déplacer) : ${imageObjects.length}`)
  console.log(`  - ebooks (à conserver) : ${protectedObjects.length}`)

  const toMove: string[] = []
  const alreadyInImages: string[] = []
  for (const obj of imageObjects) {
    if (await existsInBucket(DEST_BUCKET, obj.path)) alreadyInImages.push(obj.path)
    else toMove.push(obj.path)
  }

  console.log(`\nÀ copier vers "${DEST_BUCKET}" : ${toMove.length}`)
  console.log(`Déjà présents dans "${DEST_BUCKET}" : ${alreadyInImages.length}`)
  if (toMove.length > 0) toMove.forEach((p) => console.log(`   + ${p}`))
  if (alreadyInImages.length > 0) alreadyInImages.forEach((p) => console.log(`   = ${p} (déjà OK)`))

  console.log(`\nEbooks conservés dans "${SOURCE_BUCKET}" (resteront privés) :`)
  protectedObjects.forEach((o) => console.log(`   * ${o.path}`))

  if (DRY_RUN) {
    console.log('\nDRY-RUN terminé. Relance avec --apply pour exécuter.')
    return
  }

  // 1. S'assurer que le bucket images est public
  console.log(`\n[1/4] Bucket "${DEST_BUCKET}" -> public`)
  const pub = await supabase.storage.updateBucket(DEST_BUCKET, { public: true })
  if (pub.error) throw pub.error

  // 2. Copier puis supprimer
  console.log(`[2/4] Copie de ${toMove.length} objet(s)`)
  for (const path of toMove) {
    const { data: blob, error: dlErr } = await supabase.storage.from(SOURCE_BUCKET).download(path)
    if (dlErr || !blob) {
      console.error(`   ! échec téléchargement ${path}: ${dlErr?.message}`)
      continue
    }
    const { error: upErr } = await supabase.storage
      .from(DEST_BUCKET)
      .upload(path, blob, { contentType: blob.type || 'application/octet-stream', upsert: true })
    if (upErr) {
      console.error(`   ! échec upload ${path}: ${upErr.message}`)
      continue
    }
    const { error: rmErr } = await supabase.storage.from(SOURCE_BUCKET).remove([path])
    if (rmErr) {
      console.error(`   ! fichier copié mais non supprimé de books: ${path}: ${rmErr.message}`)
    } else {
      console.log(`   ✓ ${path}`)
    }
  }

  // 3. Mettre à jour les URLs en base
  console.log('[3/4] Mise à jour des URLs en base')
  const rewrite = (url: string | null) =>
    url && url.includes(`/object/public/${SOURCE_BUCKET}/`)
      ? url.replace(`/object/public/${SOURCE_BUCKET}/`, `/object/public/${DEST_BUCKET}/`)
      : url

  const { data: books, error: booksErr } = await supabase
    .from('books')
    .select('id, cover_url')
  if (booksErr) throw booksErr
  let coversUpdated = 0
  for (const b of books || []) {
    const next = rewrite(b.cover_url)
    if (next !== b.cover_url) {
      const { error } = await supabase.from('books').update({ cover_url: next }).eq('id', b.id)
      if (error) console.error(`   ! book ${b.id}: ${error.message}`)
      else coversUpdated++
    }
  }
  console.log(`   ✓ ${coversUpdated} couverture(s) mise(s) à jour`)

  const { data: profiles, error: profErr } = await supabase
    .from('author_profiles')
    .select('id, avatar_url, photo_urls')
  if (profErr) throw profErr
  let avatarsUpdated = 0
  let photosUpdated = 0
  for (const p of profiles || []) {
    const nextAvatar = rewrite(p.avatar_url)
    const nextPhotos = Array.isArray(p.photo_urls) ? p.photo_urls.map(rewrite) : p.photo_urls
    const avatarChanged = nextAvatar !== p.avatar_url
    const photosChanged = JSON.stringify(nextPhotos) !== JSON.stringify(p.photo_urls)
    if (avatarChanged || photosChanged) {
      const { error } = await supabase
        .from('author_profiles')
        .update({ avatar_url: nextAvatar, photo_urls: nextPhotos })
        .eq('id', p.id)
      if (error) console.error(`   ! profil ${p.id}: ${error.message}`)
      else {
        if (avatarChanged) avatarsUpdated++
        if (photosChanged) photosUpdated++
      }
    }
  }
  console.log(`   ✓ ${avatarsUpdated} avatar(s) et ${photosUpdated} liste(s) de photos mise(s) à jour`)

  // 4. books -> privé
  console.log(`[4/4] Bucket "${SOURCE_BUCKET}" -> privé`)
  const priv = await supabase.storage.updateBucket(SOURCE_BUCKET, { public: false })
  if (priv.error) throw priv.error
  console.log('   ✓ books est désormais privé')

  console.log('\nMigration terminée.\n')
}

main().catch((err) => {
  console.error('\nErreur migration :', err)
  process.exit(1)
})
