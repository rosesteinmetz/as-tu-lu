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

-- 4. Rendre le bucket storage privé (exécuter après)
-- Va dans Supabase Dashboard → Storage → books → Configuration
-- → Public bucket: DÉSACTIVER
