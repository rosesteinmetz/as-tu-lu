-- ============================================================
-- Migration sécurité — Appliquer dans Supabase SQL Editor
-- ============================================================

-- 1. Colonne download_token pour les abonnés
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS download_token TEXT DEFAULT '';

-- 2. Corriger RLS newsletter_settings : propriétaire seulement
DROP POLICY IF EXISTS "Lecture publique paramètres" ON newsletter_settings;
CREATE POLICY "Lecture paramètres par propriétaire" ON newsletter_settings
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Corriger RLS subscribers : propriétaire du livre seulement
DROP POLICY IF EXISTS "Lecture des abonnés par utilisateur connecté" ON subscribers;
CREATE POLICY "Lecture des abonnés par propriétaire" ON subscribers
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM books WHERE id = book_id
    )
  );

-- 4. Rendre le bucket storage privé
UPDATE storage.buckets SET public = false WHERE name = 'books';

-- 5. RLS storage.objects : lecture publique des images (couvertures, avatars, photos)
CREATE POLICY "Lecture publique images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'books' AND (
      name LIKE 'covers/%' OR
      name LIKE 'author/%' OR
      name LIKE 'cover-%' OR
      name LIKE 'avatar-%'
    )
  );

-- 6. Lecture des ebooks réservée au service_role (signed URLs)
-- Aucune politique SELECT publique pour epub/, pdf/, mobi/

-- 7. Politiques DELETE manquantes (RGPD)
CREATE POLICY "Suppression profil par propriétaire" ON author_profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Suppression paramètres par propriétaire" ON newsletter_settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Suppression abonné par propriétaire" ON subscribers
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM books WHERE id = book_id)
  );

-- 8. Table de rate limiting (cross-instance serverless)
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created ON rate_limits(key, created_at);
