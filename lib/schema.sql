-- Table des livres
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Céline Autrice',
  genre TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_url TEXT,
  epub_url TEXT,
  pdf_url TEXT,
  mobi_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  download_count INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  external_link TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des inscriptions email
CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  consent_transmission BOOLEAN DEFAULT false,
  consent_newsletter BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT DEFAULT '',
  terms_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour éviter les doublons (même email pour un même livre)
CREATE UNIQUE INDEX idx_subscribers_email_book ON subscribers(email, book_id);

-- Fonction pour incrémenter le compteur de téléchargements (bypass RLS)
CREATE OR REPLACE FUNCTION increment_download_count(book_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE books SET download_count = COALESCE(download_count, 0) + 1 WHERE id = book_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_download_count TO anon;

-- Politique de sécurité : tout le monde peut lire les livres
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique livres" ON books
  FOR SELECT USING (true);

-- Seul le propriétaire peut créer/modifier/supprimer ses livres
CREATE POLICY "Insertion livre par propriétaire" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modification livre par propriétaire" ON books
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppression livre par propriétaire" ON books
  FOR DELETE USING (auth.uid() = user_id);

-- Table du profil auteur
CREATE TABLE author_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT DEFAULT 'Céline Autrice',
  tagline TEXT DEFAULT 'Écrivaine de Science-Fiction & Thriller',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  photo_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE author_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique profil auteur" ON author_profiles
  FOR SELECT USING (true);
CREATE POLICY "Insertion profil par propriétaire" ON author_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modification profil par propriétaire" ON author_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Table des paramètres newsletter
CREATE TABLE newsletter_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'brevo',
  api_key TEXT NOT NULL DEFAULT '',
  list_id TEXT DEFAULT '',
  webhook_url TEXT DEFAULT '',
  notify_email TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE newsletter_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique paramètres" ON newsletter_settings
  FOR SELECT USING (true);
CREATE POLICY "Insertion paramètres par propriétaire" ON newsletter_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modification paramètres par propriétaire" ON newsletter_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Politique de sécurité : tout le monde peut inscrire un email
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tout le monde peut s'inscrire" ON subscribers
  FOR INSERT WITH CHECK (true);

-- Politique de sécurité : lecture par utilisateur connecté
CREATE POLICY "Lecture des abonnés par utilisateur connecté" ON subscribers
  FOR SELECT USING (auth.role() = 'authenticated');
