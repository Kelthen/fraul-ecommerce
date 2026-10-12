# Fraul — e-commerce

Site Next.js (App Router, TypeScript). Le **Fraul Walk** (mall en 3D, une boutique par marque) est l'expérience principale.

- Règles de l'équipe : `CLAUDE.md` · état : `STATUS.md` · leçons : `LESSONS.md` · architecture : `docs/ARCHITECTURE.md`
- Kit de démarrage Kelthen (repris de NBW) : `playbook/` — briefing `.claude/hooks/session-start.sh`, modèle de PR, notifications `.github/workflows/notify-team.yml`, photos `scripts/optimize-images.mjs`
- Démo d'origine (une seule page) : `demo/fraul-demo-v2.html`

## Commandes

```bash
npm install
npm run dev          # http://localhost:3000
npm run check        # lint + types + build (avant chaque merge)
npm start & npm run smoke -- http://localhost:3000   # test sur écran de téléphone, 3D comprise
```

## Où est quoi

| Dossier | Contenu |
|---|---|
| `src/app/` | Pages : accueil, `walk`, `marques`, `categorie`, `produit`, `tenue`, `panier`, `suivi`, pages légales |
| `src/walk/` | Moteur 3D du Fraul Walk (three.js, chargé seulement à l'ouverture du mall) |
| `src/lib/catalog/` | Accès au catalogue. **Données de démonstration** aujourd'hui, base de données demain |
| `src/components/` | Composants partagés (cartes, panier, en-tête…) |
| `supabase/migrations/` | Schéma de la base de données |

Variables d'environnement : `NEXT_PUBLIC_SITE_URL` (domaine), `NEXT_PUBLIC_SITE_LIVE=true` pour autoriser l'indexation au lancement.
