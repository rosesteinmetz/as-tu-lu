# Migrations Supabase

Toutes les migrations sont désormais regroupées dans **un seul fichier idempotent** :
`lib/migrations.sql` (tables, colonnes, index, fonctions, RLS, Storage).

## Exécuter les migrations

Deux méthodes :

1. **Automatique** (recommandé) — nécessite `DATABASE_URL` dans `.env.local`
   (Supabase → Connect → connection string Postgres) :

   ```sh
   npm run db:migrate
   ```

2. **Manuelle** — copier le contenu de `lib/migrations.sql` dans le
   [SQL Editor](https://app.supabase.com/project/puyirglxlackdmdupved/sql/new).

Le fichier est idempotent : il peut être ré-exécuté sans risque.

## Migration Storage (buckets images / books)

Le schéma/policies Storage sont dans `lib/migrations.sql`. Le déplacement des
objets et la réécriture des URLs se font via :

- `npm run storage:dry-run` (aperçu, ne modifie rien)
- `npm run storage:migrate` (déplace les images vers `images`, met à jour les URLs, passe `books` en privé)

## Vérification rapide

- `books` : slug, is_free, external_link, sort_order
- `author_profiles` : slug
- `subscribers` : download_token, colonnes de consentement RGPD
- `rate_limits` : existe avec RLS
- `storage.buckets` : `images` = **public**, `books` = **privé** (eBooks uniquement)
