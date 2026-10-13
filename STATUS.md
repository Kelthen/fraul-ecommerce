# STATUS.md — État partagé du projet Fraul e-commerce

> **Seul fichier d'état du projet.** Lu au démarrage de chaque session, mis à jour **dans chaque PR**.
> Écrit pour des humains : phrases courtes, pas de jargon. Une ligne = un élément.

_Dernière mise à jour : 2026-10-13 par serge (R1 à R6 validés)_

**Preview :** https://fraul-ecommerce.vercel.app (Vercel, équipe Kelthen ; Google bloqué tant que le site n'est pas lancé)

---

## Infos client (confirmées au kickoff)

| Clé | Valeur | Confirmé le |
|---|---|---|
| Client | Fraul (commerçant, vêtements et chaussures achetés en Chine) | 2026-10-12 |
| Localisation affichée | **Aucune** : aucun pays affiché sur le site | 2026-10-12 (Rhamone) |
| Pays de livraison (logistique, non affiché) | USA, Canada, Royaume-Uni, France, Belgique | 2026-10-12 (Rhamone) |
| Fuseau horaire | [À FOURNIR] | |
| Langue du site | Français (anglais prévu) | 2026-10-12 |
| Email / téléphone publics | [À FOURNIR] | |
| Domaine | [À FOURNIR] | |
| Source des données | Catalogue de démo dans `src/lib/catalog/` ; base Supabase prête mais vide | 2026-10-12 |

## ✅ En ligne (preview, pas encore en production)

- Règles de démarrage + kit NBW (CLAUDE.md, STATUS.md, LESSONS.md, briefing, modèle de PR, notifications, script photos) — rhamon
- Architecture cible — `docs/ARCHITECTURE.md`
- Site Next.js : accueil = entrée du mall, marques, catégories, fiche produit, Crée ta tenue, panier, suivi, pages légales (squelettes)
- Fraul Walk en T : 27 boutiques, version claire, toucher la vitrine pour entrer, défiler en arrière pour sortir — `docs/FRAUL-WALK-T.md`
- Schéma de base de données vide, sécurité ligne par ligne testée — `supabase/migrations/`
- Walk : le bouton retour du téléphone ferme la couche ouverte (annuaire, zoom, rayon, boutique) puis quitte le mall ; focus gardé dans la fenêtre ouverte, Échap ferme, focus rendu au bouton d'origine — testé dans `npm run smoke`

## 🔄 En cours

| Quoi | Qui | Branche / PR | Depuis |
|---|---|---|---|
| PR de fondation (tout le travail ci-dessus) | rhamon | PR #1 | 2026-10-12 |

## 🆕 À faire (par priorité)

1. Rhamone et Serge valident `docs/PLAN-MVC.md` (rangement MVC, 4 questions en fin de document) ; rien n'est codé avant
2. Rhamone essaie la preview et confirme les choix par défaut du mall (voir Décisions)
3. Brancher Slack : secret `SLACK_WEBHOOK_URL` dans GitHub (voir `playbook/README.md`) — rhamon
4. Créer le projet Supabase et appliquer le schéma — rhamon
5. Paiement Stripe en mode test
6. Vraies photos produit détourées (via `scripts/optimize-images.mjs`)
7. WeChat : lien portail ou robot WeCom — Serge

## ⏳ Bloqué — attend le client

| Élément attendu | Demandé le | Relancé le |
|---|---|---|
| Logo, textes, liste des produits et prix | — | — |
| Photos produits | — | — |
| Factures fournisseur des marques (à archiver, non bloquant) | — | — |
| Pays de l'entreprise (avant lancement ; Stripe Atlas possible) | — | — |
| Qui paie les droits de douane (DDP ou client) — avant lancement | — | — |
| Prix : liste des groupes et leurs %, % de bienvenue/parrainage, crédit du parrain, marges par zone, marge minimale (R5) | 2026-10-12 | — |

## 🧭 Décisions (ne pas revenir dessus sans accord)

| Date | Décision | Source |
|---|---|---|
| 2026-10-13 | **Serge valide R1 à R6.** Précisions : devise affichée en code (USD/CAD/GBP/EUR) car « $ » est ambigu ; marge minimale de test 20 %. **À corriger dans la PR #2 avant merge :** l'arrondi toujours vers le bas fausse les remises sur les petits prix (VIP = Fidèle à 29 sur un article à 39) → arrondi au plus proche. Détail dans CLAUDE.md §9. | Serge |
| 2026-10-12 | **Stratégie de prix de Serge : accord de Rhamone sur l'ensemble** (CLAUDE.md §9). Ses points R1 à R6 sont des **contre-propositions ouvertes** : Serge peut répondre ; Rhamone commence à construire sur cette base en attendant. | Serge + Rhamone, discussion ouverte |
| 2026-10-12 | Contre-propositions de Rhamone (détail et raisons dans CLAUDE.md §9) : ⛔ R1 pas de sélecteur « Livrer en » (aucun pays affiché) · ➕ R2 ligne « Prix final confirmé selon l'adresse de livraison » · ➕ R3 code WhatsApp d'abord, bienvenue limitée par numéro/adresse/carte · ⛔ R4 connecté = seulement son prix · ➕ R5 prix plancher · ➕ R6 lancement zones + 2-3 groupes + invitations. | Rhamone |
| 2026-10-12 | Réécriture de `main` pour retirer les anciens « Co-Authored-By » : **mise de côté** (compliquée, Serge devrait resynchroniser). Les nouveaux commits sont nettoyés automatiquement par `.githooks/commit-msg`. | Rhamone |
| 2026-10-12 | **Aucune trace d'IA** dans Git et GitHub : pas de « Co-Authored-By », « Generated with… », lien de session ; auteur des commits = Kelthen. | Rhamone |
| 2026-10-12 | Pas de vocabulaire « 3D / shopping immersif » ni de chiffres (« 27 marques ») en accueil : on parle vente (authenticité, drops, suivi, paiement sécurisé). | Rhamone |
| 2026-10-12 | Kit de démarrage = celui de NBW (`playbook/`), branches `feat/<dev>/<sujet>`, modèle de PR avec résumé pour l'équipe. | Rhamone |
| 2026-10-12 | Pas de mini-plan du T affiché dans le mall. | Rhamone |
| 2026-10-12 | Site **en clair** (blanc ivoire dominant, autres couleurs en accent) : le sombre ne met pas les vêtements en valeur. | Rhamone |
| 2026-10-12 | Walk : **toucher la vitrine = entrer** ; **défiler en arrière = sortir** (rayon → centre → sortie) ; le défilement en avant n'entre jamais. | Rhamone |
| 2026-10-12 | Mall en T : vitrines à droite, « F » sculpté + arbres au centre, marques phares en premier. | équipe, à confirmer |
| 2026-10-12 | **Le Fraul Walk est le cœur du site** (shopping immersif), pas une option. | Rhamone |
| 2026-10-12 | **Aucun pays affiché** sur le site (jugé discriminatoire). | Rhamone |
| 2026-10-12 | Mall en forme de **T** : entrée/sortie en bas, une boutique à la fois, on fait le tour ; élément central au milieu. | Rhamone |
| 2026-10-12 | On démarre en sur mesure (option A) ; base vide, données de démo. | Rhamone |
| 2026-10-12 | On construit tout d'abord en **mode test** (Stripe test, éventuelle boutique de dev Shopify) ; les démarches administratives (entreprise, compte Stripe réel, taxes, juridique) passent dans la checklist **avant lancement**, non bloquantes. | Rhamone |
| 2026-10-12 | Produits authentiques, confirmé par Rhamone. Garder les factures fournisseur (Stripe peut les demander). | Rhamone |
| 2026-10-12 | Afrique de l'Ouest retirée du projet : pays servis = USA, Canada, UK, France, Belgique. Plus de mobile money. | Rhamone |
| 2026-10-12 | Les deux CLAUDE.md (règles d'équipe + contexte client) fusionnés en un seul. | équipe, à confirmer |
| 2026-10-12 | On ne bloque pas le démarrage sur le client (voyage souvent) ; placeholders marqués et questions regroupées. | équipe |
