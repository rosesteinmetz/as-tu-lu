-- Ajout des colonnes pour livres payants
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true;
ALTER TABLE books ADD COLUMN IF NOT EXISTS external_link TEXT DEFAULT '';
ALTER TABLE books ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
