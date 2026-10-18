# STATUS.md — État partagé du projet Fraul e-commerce

> **Seul fichier d'état du projet.** Lu au démarrage de chaque session, mis à jour **dans chaque PR**.
> Écrit pour des humains : phrases courtes, pas de jargon. Une ligne = un élément.

_Dernière mise à jour : 2026-10-18 par rhamon (vrais produits dans les boutiques du Walk, vitrine des sacs)_

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
| Source des données | Code : 23 vrais produits avec photos (`src/lib/catalog/supplier.ts`, généré par `scripts/import-catalogue.mjs` depuis le classement de Rhamone, coûts **fictifs**) + catalogue de démo (`src/lib/catalog/demo.ts`). Base Supabase créée mais vide et pas encore branchée | 2026-10-18 |
| Base de données | Supabase, projet `fraul` (`rqrdccsxyyufqlenmpct`, USA Est), plan gratuit, organisation « kelthenrift-prog's Org » — Serge pas encore membre | 2026-10-13 |

## ✅ En ligne (preview, pas encore en production)

- Règles de démarrage + kit NBW (CLAUDE.md, STATUS.md, LESSONS.md, briefing, modèle de PR, notifications, script photos) — rhamon
- Architecture cible — `docs/ARCHITECTURE.md`
- Site Next.js : accueil = entrée du mall, marques, catégories, fiche produit, Crée ta tenue, panier, suivi, pages légales (squelettes)
- Fraul Walk en T : 27 boutiques, version claire, toucher la vitrine pour entrer, défiler en arrière pour sortir — `docs/FRAUL-WALK-T.md`
- Schéma de base de données vide, sécurité ligne par ligne testée — `supabase/migrations/`
- Projet Supabase `fraul` créé (USA Est, gratuit) ; migrations 0001 (schéma) et 0002 (sécurité des fonctions) appliquées ; contrôle de sécurité Supabase : seul reste le suivi public par lien, voulu — rhamon
- Page Marques : grille de pastilles rectangulaires aux coins légèrement arrondis (3 par ligne sur téléphone, 6 sur ordinateur), nom de la marque en texte avec le style de son enseigne, recherche gardée, lien « Voir la boutique » (boutique dans le Walk) sous chaque marque. Composant unique `BrandTile` (variante `grid` ; l'accueil garde ses pavés) — rhamon
- Boutiques du Walk : les vrais produits s'affichent avec leur photo sur le cintre (carte produit, face / dos), en premier dans le rayon et en grand avec « Zoom » ; vitrine à accessoires rehaussée, les sacs sont bien dans le verre — rhamon
- Photos réelles (test de rendu, pas pour la mise en ligne) : 35 captures du fournisseur classées par Rhamone → 23 produits (les ensembles Tech Fleece et Polo Ralph Lauren sont séparés en veste + pantalon, la photo « ensemble » sert de détail). Fiche produit : face / dos / détail, toucher pour agrandir. En tête des Nouveautés de l'accueil. Dans le Walk, la photo s'affiche dans une carte sur le cintre (pas encore détourée) — rhamon
- 4 nouvelles marques dans l'annuaire : Travis Scott, Saint Michael, ERD, Polo Ralph Lauren (style d'enseigne, seulement leurs vrais produits). **Pas encore dans le mall** (le T est prévu pour 27 vitrines : chantier modes de mall). Une boutique 3D n'affiche que les rayons qui ont des articles — rhamon
- Catégories : 12 au lieu de 6 (ajout Vestes et manteaux, Shorts, Chaussettes, Lunettes, Montres, Bijoux ; « Chapeaux » → « Casquettes », ancien lien redirigé ; « Hoodies » → « Hoodies et sweats »). Dessins provisoires, coûts de démo. Dans le Walk, seuls les rayons qui ont un portant s'affichent (nouveaux portants : plus tard) — rhamon
- Prix par zone et par groupe, mode test, page /test/prix (PR #2) ; MVC étape 1 : modèles du Walk (PR #5)
- PR #1 mergée : fondations, Walk, bouton retour, plan MVC, stratégie de prix notée
- Walk : le bouton retour du téléphone ferme la couche ouverte (annuaire, zoom, rayon, boutique) puis quitte le mall ; focus gardé dans la fenêtre ouverte, Échap ferme, focus rendu au bouton d'origine — testé dans `npm run smoke`

## 🔄 En cours

| Quoi | Qui | Branche / PR | Depuis |
|---|---|---|---|
| MVC étape 2 : bouton retour et focus du Walk sortis du moteur (aucun changement visible) | rhamon | feat/rhamon/mvc-etape-2 | 2026-10-13 |

## 🆕 À faire (par priorité)

1. Plan MVC validé par Serge le 13 oct. (`docs/PLAN-MVC.md`) → étape 1 en ligne (PR #5), étape 2 en cours ; ensuite étapes 3 et 4 (vues 3D, contrôleurs du mall)
2. Rhamone essaie la preview et confirme les choix par défaut du mall (voir Décisions)
3. Brancher Slack : secret `SLACK_WEBHOOK_URL` dans GitHub (voir `playbook/README.md`) — rhamon
4. Plan en 6 chantiers de Rhamone (17 oct.), une PR chacun, dans cet ordre : ✅ catégories → ✅ photos du fournisseur (+ 4 marques dans l'annuaire) → modes de mall (31 boutiques ; après merge de #6) → portes vitrées d'entrée → ✅ page Marques en pastilles → Crée ta tenue en 3D (prototype puis version complète) → comptes, suivi et e-mails — rhamon
5. Docs : retirer WhatsApp de CLAUDE.md §9, ARCHITECTURE.md (texte proposé dans la conversation du 17 oct.) — rhamon
6. **Serge** : valider la migration des emplacements de tenue (`outfit_slot` : ajouter `cap`, `glasses`, `neck`, `watch`, `layer`, `socks`) proposée dans la PR des catégories ; plus tard retirer `customers.whatsapp` et le canal `whatsapp`
7. Supabase : inviter Serge dans l'organisation, puis brancher le site (variables d'environnement dans Vercel) — rhamon
8. Paiement Stripe en mode test
9. Vraies photos produit détourées (via `scripts/optimize-images.mjs`)
10. Fournisseur + commandes + WeChat : valider `docs/FOURNISSEUR-COMMANDES.md` (3 questions en fin), puis obtenir de Fraul le lien du site fournisseur — Serge

## ⏳ Bloqué — attend le client

| Élément attendu | Demandé le | Relancé le |
|---|---|---|
| Logo, textes, liste des produits et prix | — | — |
| Photos produits | — | — |
| Factures fournisseur des marques (à archiver, non bloquant) | — | — |
| Pays de l'entreprise (avant lancement ; Stripe Atlas possible) | — | — |
| Photos en meilleure qualité (originaux) : Trapstar hoodie noir, hoodie logo rouge, polo noir/or, short gris, doudoune longue ; Polo Ralph Lauren (les deux ensembles). Vues manquantes : Tech Fleece marron (ensemble, dos), Polo Inter (4 vues). Saint Michael : mention © à recadrer avant mise en ligne. Short Travis Scott : vue de dos à confirmer | 2026-10-18 | — |
| Lien du site du fournisseur (ou plateforme : Yupoo, 1688…), son accord pour reprendre fiches et photos, fichier Excel s'il en a un | 2026-10-13 | — |
| Ligne de livraison DDP (droits payés) chez le livreur/transitaire ; IOSS (UE) et TVA UK avec un comptable — avant lancement | 2026-10-13 | — |
| Prix : liste des groupes et leurs %, % de bienvenue/parrainage, crédit du parrain, marges par zone, marge minimale (R5) | 2026-10-12 | — |

## 🧭 Décisions (ne pas revenir dessus sans accord)

| Date | Décision | Source |
|---|---|---|
| 2026-10-18 | Page Marques : pastilles **rectangulaires**, coins légèrement arrondis (pas de cercles) ; le lien sous chaque marque s'appelle **« Voir la boutique »** (au lieu de « Dans le mall »). | Rhamone |
| 2026-10-17 | **Plus de WhatsApp sur le site** (connexion, vérification, relances) : tout passe par e-mail. Bienvenue limitée par e-mail, adresse et carte. Les liens d'invitation de Fraul partent par e-mail depuis son tableau de bord. **Remplace R3, validé par Serge le 13 oct. : discussion ouverte**, Serge peut répondre. | Rhamone |
| 2026-10-17 | **Connexion : e-mail + mot de passe, avec code par e-mail** (vérification de l'e-mail, mot de passe oublié). Sécurité partout : RLS, captcha (Turnstile) et limitation des essais, protection contre l'injection de prompt si un assistant IA est ajouté (ARCHITECTURE §4-5). | Rhamone |
| 2026-10-17 | Pas de logos de marques : nom en texte avec le style d'enseigne (inchangé). | Rhamone |
| 2026-10-17 | **Crée ta tenue en 3D**, avec une liste 2D toujours utilisable (3D chargée à la demande). Zoom automatique sur la pièce choisie (montre → poignet, lunettes → visage, collier → cou…), puis le client choisit : « Vue d'ensemble », pincer, tourner. | Rhamone |
| 2026-10-17 | Catégorie **Bijoux** ajoutée (emplacement cou dans la tenue). | Rhamone |
| 2026-10-17 | Le mall devra accueillir **plusieurs modes** (formes) ; le T est le premier. Le nombre de boutiques vient de la liste des marques. | Rhamone |
| 2026-10-17 | **Entrée du mall : portes en verre qui coulissent en deux**, avec « Welcome to Fraul Center » gravé sur les portes (le texte s'ouvre avec elles). | Rhamone |
| 2026-10-13 | **Supabase en plan gratuit** (2 projets actifs max) : le projet `kelthen-social-publishing` est **mis en pause** pour faire place à `fraul`. Le relancer obligera à en mettre un autre en pause. | Rhamone |
| 2026-10-13 | **Plan MVC validé** : on garde Next.js, rangement MVC, Walk = cœur du site avec liste en repli, `/marques/:slug`, on démarre par l'étape 1. | Serge |
| 2026-10-13 | **Droits de douane payés par le client mais inclus dans le prix affiché (DDP)** : « Droits et taxes inclus », rien à payer à la livraison. | Serge |
| 2026-10-13 | **WeChat : lien portail maintenant** (lien personnel épinglé dans WeChat, interface en chinois, bouton « Copier pour WeChat »), **robot WeCom plus tard**. Détail : `docs/FOURNISSEUR-COMMANDES.md`. | Serge |
| 2026-10-13 | **Lancement sur USA, Canada, Royaume-Uni, France, Belgique seulement.** L'Afrique (dont l'Afrique de l'Ouest) est mise de côté pour le moment, à revoir plus tard. | Serge |
| 2026-10-13 | **Serge valide R1 à R6.** Précisions : devise affichée en code (USD/CAD/GBP/EUR) car « $ » est ambigu ; marge minimale de test 20 %. **À corriger dans la PR #2 avant merge :** l'arrondi toujours vers le bas fausse les remises sur les petits prix (VIP = Fidèle à 29 sur un article à 39) → arrondi au plus proche. Détail dans CLAUDE.md §9. ✅ Corrigé dans la PR #2 (mergée le 13 oct.) : arrondi au plus proche, code de devise, « Droits et taxes inclus ». | Serge |
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
