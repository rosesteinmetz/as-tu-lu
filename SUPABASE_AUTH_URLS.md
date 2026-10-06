# Configuration Supabase Authentication - Redirect URLs

## Où configurer ?
Dans Supabase : 
`Authentication → URL Configuration` (ou `Settings → Auth → URL Configuration` selon version)

## Site URL (URL du site)
Mettre :
```
https://as-tu-lu.fr
```

## Additional Redirect URLs (URLs de redirection autorisées)
Ajouter ces 2 URLs :
```
https://as-tu-lu.fr/auth/confirm
https://as-tu-lu.fr/auth/update-password
```

Éventuellement aussi pour les previews Vercel si tu veux tester :
```
https://*.vercel.app/auth/confirm
https://*.vercel.app/auth/update-password
```

## Explication
- `/auth/confirm` : utilisé après inscription pour confirmer l'email (magic link / OTP)
- `/auth/update-password` : utilisé après reset password pour définir un nouveau mot de passe

Sans ces URLs, Supabase refusera de rediriger vers ton domaine et l'authentification ne fonctionnera pas correctement.
