/*
 * Renomme les ebooks en « titre_auteur » dans le bucket `books`.
 * Corrige les fichiers envoyés avant ce changement (ex. `epub-<uuid>-<timestamp>.epub`).
 *
 * Usage :
 *   npx tsx scripts/rename-ebooks.ts            (dry-run, aucune modification)
 *   npx tsx scripts/rename-ebooks.ts --apply    (exécution réelle)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { ebookBaseName } from '../lib/slug'

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
    // .env.local absent : variables déjà dans l'environnement
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

const BUCKET = 'books'

function storagePath(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/\/object\/(?:public|authenticated)\/books\/(.+?)(?:\?.*)?$/)
  return match ? decodeURIComponent(match[1]) : null
}

async function listNames(folder: string): Promise<Set<string>> {
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 1000 })
  if (error) throw error
  return new Set((data || []).map((o) => o.name))
}

type Book = {
  id: string
  title: string | null
  author: string | null
  epub_url: string | null
  pdf_url: string | null
}

type Job = {
  book: Book
  field: 'epub_url' | 'pdf_url'
  folder: 'epub' | 'pdf'
  source: string
  target: string
  replaceOrphan: boolean
}

async function main() {
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, author, epub_url, pdf_url')
    .order('created_at', { ascending: true })

  if (error) throw error

  const namesByFolder = new Map<string, Set<string>>()
  for (const folder of ['epub', 'pdf']) namesByFolder.set(folder, await listNames(folder))

  // Fichiers encore référencés par un livre : jamais écrasés.
  const referenced = new Set<string>()
  for (const book of (books || []) as Book[]) {
    for (const field of ['epub_url', 'pdf_url'] as const) {
      const path = storagePath(book[field])
      if (path) referenced.add(path)
    }
  }

  const jobs: Job[] = []
  const alreadyOk: string[] = []

  for (const book of (books || []) as Book[]) {
    const base = ebookBaseName(book.title || '', book.author || '')
    for (const [field, folder] of [
      ['epub_url', 'epub'],
      ['pdf_url', 'pdf'],
    ] as const) {
      const source = storagePath(book[field])
      if (!source) continue
      const ext = source.split('.').pop()?.toLowerCase() || ''
      let target = `${folder}/${base}.${ext}`
      let replaceOrphan = false

      if (source === target) {
        alreadyOk.push(`${book.title} (${folder})`)
        continue
      }

      const names = namesByFolder.get(folder)!
      const targetName = `${base}.${ext}`
      if (names.has(targetName)) {
        if (referenced.has(target)) {
          // Nom déjà pris par un autre livre : suffixe court pour ne rien écraser.
          target = `${folder}/${base}-${book.id.slice(0, 6)}.${ext}`
        } else {
          replaceOrphan = true // fichier orphelin (upload remplacé, non utilisé)
        }
      }

      jobs.push({ book, field, folder, source, target, replaceOrphan })
    }
  }

  console.log(`Déjà nommés « titre_auteur » : ${alreadyOk.length}`)
  console.log(`À renommer : ${jobs.length}`)
  jobs.forEach((j) =>
    console.log(`   ${j.source}  ->  ${j.target}${j.replaceOrphan ? '  (remplace un orphelin)' : ''}`)
  )

  if (DRY_RUN) {
    console.log('\nDRY-RUN terminé. Relance avec --apply pour exécuter.')
    return
  }

  let done = 0
  for (const job of jobs) {
    if (job.replaceOrphan) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove([job.target])
      if (removeError) {
        console.error(`   ! impossible de remplacer l'orphelin ${job.target}: ${removeError.message}`)
        continue
      }
    }

    const { error: moveError } = await supabase.storage.from(BUCKET).move(job.source, job.target)
    if (moveError) {
      console.error(`   ! ${job.source}: ${moveError.message}`)
      continue
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(job.target)
    const { error: dbError } = await supabase
      .from('books')
      .update({ [job.field]: data.publicUrl })
      .eq('id', job.book.id)

    if (dbError) {
      console.error(`   ! ${job.target} déplacé mais base non mise à jour : ${dbError.message}`)
      continue
    }

    namesByFolder.get(job.folder)!.add(job.target.split('/').pop()!)
    done += 1
    console.log(`   ✓ ${job.target}`)
  }

  console.log(`\nTerminé : ${done}/${jobs.length} fichier(s) renommé(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
