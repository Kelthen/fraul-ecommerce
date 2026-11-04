# Admin : articles, tableau de bord, accès de Jean Paul — passation pour Serge

> Écrit le 4 nov. 2026 (heure de Toronto) par le Claude de Rhamone. Rhamone n'a plus de temps : **Serge reprend.**
> Demande de Rhamone : Jean Paul doit pouvoir **ajouter, modifier et retirer des articles**, voir **ses ventes et ses stats**. « Paul va ajouter les prix. »

## Le plan (validé par Rhamone le 4 nov. : « oui vas-y »)

| PR | Quoi | État |
|---|---|---|
| 1 | **Les vrais articles passent dans la base** ; le site les lit de là (rien ne change à l'écran) | 🟡 code prêt, branche `feat/rhamon/catalogue-base` ; **import à lancer** (voir plus bas) |
| 2 | `/admin/articles` : liste, ajouter (photos face/dos/détails depuis le téléphone, marque, catégorie, nom, couleurs, tailles, coût ¥, poids, fournisseur + réf + lien), modifier, **retirer = masquer** (jamais effacer) ; prix calculé par devise + marge ; alerte marge < 10 % (décision Serge du 3 nov.) | 🆕 |
| 3 | `/admin` tableau de bord : ventes jour/semaine/mois par devise, nb de commandes, panier moyen, marge estimée, top articles et marques, commandes en retard (tes piles), demandes Finds | 🆕 |
| 4 | Connexion de Jean Paul : vrai compte admin (Supabase Auth, déjà branché par toi) + 2FA ; rôles admin / équipe | 🆕 |

## PR 1 : où on en est

- **Base** : migration `0010_catalogue_en_base.sql` **appliquée** le 4 nov. (colonnes `cost` en fen, `weight_g`, `colors`, `sizes`, `on_site`, `position` sur `products`).
- **Code** (branche `feat/rhamon/catalogue-base`, poussée) :
  - `src/lib/catalog/db.ts` lit les articles `status = active` et `on_site = true`, avec la clé publique, en cache (étiquette `catalogue`). Si la base ne répond pas, on renvoie `null`.
  - `src/lib/catalog/index.ts` : vrais articles de la base, sinon la **copie de secours** `REAL_SNAPSHOT` (code), puis les articles de démo (restent dans le code).
  - `scripts/catalogue-sql.mjs` écrit le SQL d'import (31 marques, 12 catégories, 23 vrais articles + photos).
- ⚠️ **À faire AVANT de merger** : lancer l'import. Sinon la base répond « 0 article » et les 23 vrais articles disparaissent du site.
  ```bash
  node scripts/catalogue-sql.mjs > /tmp/catalogue.sql   # puis coller dans Supabase → SQL Editor → Run
  ```
  Vérifier ensuite : `select count(*) from products where on_site;` → 23.
- Si la #46 (21 articles de Rhamone) est mergée avant : relancer le script après, il les prendra aussi.
- Checks faits : lint, typecheck, build. **Pas encore** : `npm run smoke` avec la base, preview vue par Rhamone.

## Choix déjà faits (à garder)

- Seuls les **vrais articles** vont dans la base ; les **articles de démo restent dans le code**, visibles comme aujourd'hui (Rhamone n'a pas encore tranché s'il faut les retirer ou les masquer : décidé par l'équipe, à confirmer).
- **Marques et catégories restent dans le code** pour la PR 1 (la base en a une copie). Ajouter une nouvelle marque depuis l'admin = plus tard.
- Les produits créés par une commande (`src/lib/server/catalog-db.ts`) ont `on_site = false` : ils n'apparaissent jamais tout seuls sur le site.
- Pour l'admin (PR 2) : après chaque modification, appeler `updateTag("catalogue")` (action serveur) pour que le site se mette à jour tout de suite.
- Photos ajoutées depuis l'admin : stockage Supabase (bucket public), compressées avant l'envoi ; les photos actuelles restent dans `public/images/library/`.

## ✅ Prix : réponse de Rhamone (4 nov.)

> 🗣️ **Rhamone, 4 nov. 2026** : « Directement il peut mettre en dollars mais les prix se convertissent en fonction du pays. »

- Jean Paul tape **le prix de vente en USD**, article par article.
- Le site **convertit** ce prix dans la devise du visiteur (CAD, GBP, EUR), avec un taux par zone et l'arrondi « propre » (`roundNice`). Le code de devise reste affiché.
- ⚠️ Ça **remplace le prix calculé depuis le coût** (CLAUDE.md §9, stratégie de Serge). C'est une **contre-proposition** de Rhamone, et la discussion reste ouverte (L-33) : Serge peut répondre en « 🗣️ Serge ».
- Proposition à garder : le **coût en ¥ reste demandé** (facultatif), pour la marge estimée, l'alerte à 10 % et le **prix plancher** (R5).
- Points à trancher par Serge :
  - les droits et la livraison sont-ils compris dans le prix USD tapé ?
  - taux de conversion fixe, ou mis à jour chaque jour ?
  - les remises de groupe s'appliquent-elles sur ce prix ?
- Base : il faudra une colonne `price_usd` (en cents) sur `products`, migration à écrire dans la PR 2.

## Autres points laissés en route (4 nov.)

- `RESEND_API_KEY` et `EMAIL_FROM` absents de Vercel : les e-mails de commande ne partent pas. Il faut d'abord le domaine `takeurclothes.com` vérifié dans Resend. Guide complet donné à Rhamone : domaine → Resend « Add Domain » → DNS dans Vercel → clé API → SMTP Supabase (`smtp.resend.com`, port 465, utilisateur `resend`).
- Migration `0008` (numéros **TUC-**) **appliquée le 4 nov.** avec l'accord de Rhamone.
- `STATUS.md` a des lignes en double dans « À faire » (9, 10, 12) après les fusions du 3 nov. : à nettoyer.
- PR #17 (ancienne Caisse, remplacée par #43) et #10 (Crée ta tenue 3D) ouvertes depuis plus de 7 jours : finir ou fermer (Rhamone).
