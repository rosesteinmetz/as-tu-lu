/*
 * Exécute la migration unique et idempotente lib/migrations.sql.
 *
 * Nécessite une variable DATABASE_URL dans .env.local (connection string
 * Postgres de Supabase, onglet "Connect" > "Session pooler" ou "Direct").
 *   ex: postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
 *
 * Usage :
 *   npm run db:migrate
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Client } from 'pg'

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // pas de .env.local : variables possiblement déjà dans l'environnement
  }
}

loadEnvLocal()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error(
    '\nDATABASE_URL manquant.\n' +
      'Ajoute la connection string Postgres de Supabase dans .env.local :\n' +
      '  DATABASE_URL=postgresql://postgres.<ref>:<password>@...:5432/postgres\n\n' +
      'Sinon, copie lib/migrations.sql dans le SQL Editor de Supabase.\n'
  )
  process.exit(1)
}

async function main() {
  const sqlPath = resolve(process.cwd(), 'lib/migrations.sql')
  const sql = readFileSync(sqlPath, 'utf8')

  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    console.log('✓ Migration appliquée : lib/migrations.sql')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('✗ Migration échouée :', (err as Error).message)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Erreur inattendue :', err)
  process.exit(1)
})
