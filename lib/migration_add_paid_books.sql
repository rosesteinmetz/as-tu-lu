-- Ajout des colonnes pour livres payants
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true;
ALTER TABLE books ADD COLUMN IF NOT EXISTS external_link TEXT DEFAULT '';
ALTER TABLE books ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';
ALTER TABLE author_profiles ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS books_slug_idx ON books (slug) WHERE slug <> '';
CREATE UNIQUE INDEX IF NOT EXISTS author_profiles_slug_idx ON author_profiles (slug) WHERE slug <> '';
