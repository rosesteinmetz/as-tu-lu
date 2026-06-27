/*
 * Migration pour ajouter les colonnes RGPD à la table subscribers
 *
 * Exécute cette commande dans le SQL Editor de Supabase :
 * https://supabase.com/dashboard/project/puyirglxlackdmdupved/sql/new
 */

const sql = `
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS consent_transmission BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_newsletter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS ip_address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0';
`;

console.log('Copie et exécute cette commande dans le SQL Editor de Supabase :\n');
console.log(sql);
