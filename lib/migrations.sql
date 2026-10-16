-- ============================================================================
-- Bookface — migration unique et idempotente
--
-- Peut être ré-exécutée sans risque (IF NOT EXISTS / OR REPLACE / DROP+CREATE).
-- Exécution :
--   - Automatique : npm run db:migrate   (nécessite DATABASE_URL dans .env.local)
--   - Manuelle    : copier ce fichier dans le SQL Editor Supabase
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  genre TEXT NOT NULL DEFAULT 'Romance',
  description TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  epub_url TEXT,
  pdf_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  download_count INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  external_link TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  slug TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Colonnes potentiellement manquantes sur une base existante
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true;
ALTER TABLE books ADD COLUMN IF NOT EXISTS external_link TEXT DEFAULT '';
ALTER TABLE books ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';
-- Nettoyage : la colonne mobi_url (Kindle) n'est plus utilisée.
ALTER TABLE books DROP COLUMN IF EXISTS mobi_url;

CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  consent_transmission BOOLEAN DEFAULT false,
  consent_newsletter BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT DEFAULT '',
  terms_version TEXT DEFAULT '1.0',
  download_token TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent_transmission BOOLEAN DEFAULT false;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent_newsletter BOOLEAN DEFAULT false;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ DEFAULT now();
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS ip_address TEXT DEFAULT '';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS download_token TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS author_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  photo_urls TEXT[] DEFAULT '{}',
  slug TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE author_profiles ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS newsletter_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'brevo',
  api_key TEXT NOT NULL DEFAULT '',
  list_id TEXT DEFAULT '',
  webhook_url TEXT DEFAULT '',
  notify_email TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Index
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email_book ON subscribers(email, book_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created ON rate_limits(key, created_at);

-- ---------------------------------------------------------------------------
-- 3. Fonctions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION slugify(text) RETURNS text AS $$
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(lower(unaccent($1)), '[^a-z0-9]+', '-', 'g'),
      '^-+', '', 'g'
    ),
    '-+$', '', 'g'
  );
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION increment_download_count(book_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE books SET download_count = COALESCE(download_count, 0) + 1 WHERE id = book_id;
END;
$$;
GRANT EXECUTE ON FUNCTION increment_download_count TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Backfill des slugs (idempotent : ne remplit que les vides)
-- ---------------------------------------------------------------------------
UPDATE books SET slug = slugify(title) WHERE slug = '' OR slug IS NULL;
UPDATE author_profiles SET slug = slugify(name) WHERE slug = '' OR slug IS NULL;

UPDATE books b SET slug = b.slug || '-' || sub.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY slug ORDER BY created_at) - 1 AS rn
  FROM books WHERE slug != ''
) sub
WHERE b.id = sub.id AND sub.rn > 0;

UPDATE author_profiles a SET slug = a.slug || '-' || sub.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY slug ORDER BY created_at) - 1 AS rn
  FROM author_profiles WHERE slug != ''
) sub
WHERE a.id = sub.id AND sub.rn > 0;

-- Index uniques créés APRÈS le backfill/dédoublonnage (sinon échec sur doublons)
CREATE UNIQUE INDEX IF NOT EXISTS books_slug_idx ON books (slug) WHERE slug <> '';
CREATE UNIQUE INDEX IF NOT EXISTS author_profiles_slug_idx ON author_profiles (slug) WHERE slug <> '';

-- ---------------------------------------------------------------------------
-- 5. RLS + politiques (public)
-- ---------------------------------------------------------------------------
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique livres" ON books;
CREATE POLICY "Lecture publique livres" ON books FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insertion livre par propriétaire" ON books;
CREATE POLICY "Insertion livre par propriétaire" ON books FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Modification livre par propriétaire" ON books;
CREATE POLICY "Modification livre par propriétaire" ON books FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Suppression livre par propriétaire" ON books;
CREATE POLICY "Suppression livre par propriétaire" ON books FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE author_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique profil auteur" ON author_profiles;
CREATE POLICY "Lecture publique profil auteur" ON author_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insertion profil par propriétaire" ON author_profiles;
CREATE POLICY "Insertion profil par propriétaire" ON author_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Modification profil par propriétaire" ON author_profiles;
CREATE POLICY "Modification profil par propriétaire" ON author_profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Suppression profil par propriétaire" ON author_profiles;
CREATE POLICY "Suppression profil par propriétaire" ON author_profiles FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE newsletter_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique paramètres" ON newsletter_settings;
DROP POLICY IF EXISTS "Lecture paramètres par propriétaire" ON newsletter_settings;
CREATE POLICY "Lecture paramètres par propriétaire" ON newsletter_settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Insertion paramètres par propriétaire" ON newsletter_settings;
CREATE POLICY "Insertion paramètres par propriétaire" ON newsletter_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Modification paramètres par propriétaire" ON newsletter_settings;
CREATE POLICY "Modification paramètres par propriétaire" ON newsletter_settings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Suppression paramètres par propriétaire" ON newsletter_settings;
CREATE POLICY "Suppression paramètres par propriétaire" ON newsletter_settings FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tout le monde peut s'inscrire" ON subscribers;
CREATE POLICY "Tout le monde peut s'inscrire" ON subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Lecture des abonnés par utilisateur connecté" ON subscribers;
DROP POLICY IF EXISTS "Lecture des abonnés par propriétaire" ON subscribers;
CREATE POLICY "Lecture des abonnés par propriétaire" ON subscribers FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM books WHERE id = book_id)
);
DROP POLICY IF EXISTS "Suppression abonné par propriétaire" ON subscribers;
CREATE POLICY "Suppression abonné par propriétaire" ON subscribers FOR DELETE USING (
  auth.uid() IN (SELECT user_id FROM books WHERE id = book_id)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rate limits: anon peut insérer" ON rate_limits;
CREATE POLICY "Rate limits: anon peut insérer" ON rate_limits FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Rate limits: anon peut lire" ON rate_limits;
CREATE POLICY "Rate limits: anon peut lire" ON rate_limits FOR SELECT USING (true);
DROP POLICY IF EXISTS "Rate limits: anon peut supprimer" ON rate_limits;
CREATE POLICY "Rate limits: anon peut supprimer" ON rate_limits FOR DELETE USING (true);

-- ---------------------------------------------------------------------------
-- 6. Storage : images (public) / books (privé, eBooks uniquement)
--    Les objets et les URLs sont migrés par : npm run storage:migrate
-- ---------------------------------------------------------------------------
-- Crée les buckets s'ils n'existent pas, sinon ajuste leur visibilité.
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('books', 'books', false)
  ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Lecture publique images" ON storage.objects;
CREATE POLICY "Lecture publique images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'images');

DROP POLICY IF EXISTS "auth insert images" ON storage.objects;
DROP POLICY IF EXISTS "auth insert books" ON storage.objects;
DROP POLICY IF EXISTS "auth insert storage" ON storage.objects;
CREATE POLICY "auth insert storage" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('images', 'books'));

DROP POLICY IF EXISTS "owner update storage" ON storage.objects;
CREATE POLICY "owner update storage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('images', 'books') AND owner = auth.uid())
  WITH CHECK (bucket_id IN ('images', 'books') AND owner = auth.uid());

DROP POLICY IF EXISTS "owner delete storage" ON storage.objects;
CREATE POLICY "owner delete storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('images', 'books') AND owner = auth.uid());

-- ---------------------------------------------------------------------------
-- 7. Correctifs de sécurité (idempotent)
-- ---------------------------------------------------------------------------

-- 7.1 newsletter_settings : la clé API était lisible publiquement.
--     On supprime TOUTE policy résiduelle (anciennes versions / créations
--     manuelles) puis on ne laisse que le propriétaire.
ALTER TABLE newsletter_settings ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'newsletter_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.newsletter_settings', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Lecture paramètres par propriétaire" ON newsletter_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insertion paramètres par propriétaire" ON newsletter_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modification paramètres par propriétaire" ON newsletter_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppression paramètres par propriétaire" ON newsletter_settings
  FOR DELETE USING (auth.uid() = user_id);

-- 7.2 Une seule config newsletter par compte
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_settings_user ON newsletter_settings(user_id);

-- 7.3 Index pour la résolution des liens de téléchargement
CREATE INDEX IF NOT EXISTS idx_subscribers_download_token ON subscribers(download_token);

-- 7.4 Rate limiting : plus d'accès direct de l'anon à rate_limits (il pouvait
--     supprimer les lignes pour contourner la limite). On passe par une
--     fonction SECURITY DEFINER atomique.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rate limits: anon peut insérer" ON rate_limits;
DROP POLICY IF EXISTS "Rate limits: anon peut lire" ON rate_limits;
DROP POLICY IF EXISTS "Rate limits: anon peut supprimer" ON rate_limits;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM public.rate_limits
   WHERE created_at < now() - make_interval(secs => p_window_seconds::double precision);

  SELECT count(*) INTO v_count
    FROM public.rate_limits
   WHERE key = p_key
     AND created_at >= now() - make_interval(secs => p_window_seconds::double precision);

  IF v_count >= p_max THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (key) VALUES (p_key);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO anon, authenticated;

-- 7.5 Genre par défaut explicite (plus de "Roman" fantôme)
ALTER TABLE books ALTER COLUMN genre SET DEFAULT 'Romance';
UPDATE books SET genre = 'Romance' WHERE genre IS NULL OR btrim(genre) = '';

-- 7.6 Index de performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_book_id ON subscribers(book_id);

-- 7.7 Défauts neutres (plus de "Céline Autrice").
ALTER TABLE books ALTER COLUMN author SET DEFAULT '';
ALTER TABLE author_profiles ALTER COLUMN name SET DEFAULT '';
