# Panier

Notre liste de courses partagée, à Damien et Laeti. Web app installable (PWA), synchronisée en temps réel via Supabase, hébergée sur GitHub Pages.

La spécification complète est dans [docs/specs.md](docs/specs.md). Ce dépôt contient la **V0** : liste temps réel, ajout rapide, favoris automatiques, doublons fusionnés, « Courses terminées », historique, sauvegarde et journal d'usage.

## Installer sur le téléphone

Ouvrir le lien de l'app, puis :
- **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil ».
- **Android (Chrome)** : menu ⋮ → « Installer l'application ».

À la première ouverture, choisir « Damien » ou « Laeti ».

## Base de données

Le schéma est dans `supabase/setup.sql` (schéma + pack de démarrage), à exécuter dans Supabase → SQL Editor. Le script peut être relancé sans risque.
`supabase/setup.sql` et `supabase/seed.sql` sont générés : modifier `supabase/schema.sql` ou `src/lib/pack.ts`, puis `npm run gen:setup`.

La connexion (URL + clé publique `anon`) est dans `src/config.ts`. L'accès se fait par le lien, sans compte : choix assumé, voir la spec §10.

## Développer

```bash
npm install
npm run dev            # contre la vraie base
VITE_MOCK=1 npm run dev  # base factice en mémoire, sans réseau
npm test               # tests de l'ajout rapide
npm run build
```

Chaque push sur `main` est testé, construit et déployé sur GitHub Pages par `.github/workflows/deploy.yml`.
