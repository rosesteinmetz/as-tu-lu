-- 1. Activer l'extension unaccent (déjà présente sur Supabase)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Ajouter les colonnes slug si absentes
ALTER TABLE books ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';
ALTER TABLE author_profiles ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';

-- 3. Fonction slugify PostgreSQL (identique à lib/slug.ts)
CREATE OR REPLACE FUNCTION slugify(text) RETURNS text AS $$
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(unaccent($1)),
        '[^a-z0-9]+', '-', 'g'
      ),
      '^-+', '', 'g'
    ),
    '-+$', '', 'g'
  );
$$ LANGUAGE sql IMMUTABLE;

-- 4. Remplir les slugs manquants des livres
UPDATE books SET slug = slugify(title) WHERE slug = '' OR slug IS NULL;

-- 5. Remplir les slugs manquants des profils auteurs
UPDATE author_profiles SET slug = slugify(name) WHERE slug = '' OR slug IS NULL;

-- 6. Résoudre les doublons (suffixe numérique)
UPDATE books b SET slug = b.slug || '-' || sub.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY slug ORDER BY created_at) - 1 AS rn
  FROM books
  WHERE slug != ''
) sub
WHERE b.id = sub.id AND sub.rn > 0;

UPDATE author_profiles a SET slug = a.slug || '-' || sub.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY slug ORDER BY created_at) - 1 AS rn
  FROM author_profiles
  WHERE slug != ''
) sub
WHERE a.id = sub.id AND sub.rn > 0;
