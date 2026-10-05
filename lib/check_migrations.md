# Comment vérifier les migrations SQL dans Supabase

Pour vérifier que toutes les migrations ont été exécutées :

1. Va sur https://app.supabase.com/project/puyirglxlackdmdupved/sql
2. Ouvre "SQL Editor" → "History" pour voir les requêtes déjà exécutées
3. Vérifie la présence de : rate_limits table, colonnes slug, download_token, is_free...

Vérification rapide par tables :
- `books` doit avoir : slug, is_free, external_link, sort_order
- `author_profiles` doit avoir : slug
- `subscribers` doit avoir : download_token
- `rate_limits` doit exister avec RLS
- `storage.buckets` bucket `books` (public/privé selon ton choix)

Pour corriger le RLS INSERT books : exécute `migration-securite-2.sql` si besoin.
