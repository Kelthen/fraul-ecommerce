# Admin : articles, tableau de bord, accès de Jean Paul — passation pour Serge

> Écrit le 4 nov. 2026 (heure de Toronto) par le Claude de Rhamone. Rhamone n'a plus de temps : **Serge reprend.**
> Demande de Rhamone : Jean Paul doit pouvoir **ajouter, modifier et retirer des articles**, voir **ses ventes et ses stats**. « Paul va ajouter les prix. »

## Le plan (validé par Rhamone le 4 nov. : « oui vas-y »)

| PR | Quoi | État |
|---|---|---|
| 1 | **Les vrais articles passent dans la base** ; le site les lit de là (rien ne change à l'écran) | 🟡 code prêt, branche `feat/rhamon/catalogue-base` ; **import fait le 3 nov.**, merge à venir |
| 2 | `/admin/articles` : liste, ajouter (photos face/dos/détails depuis le téléphone, marque, catégorie, nom, couleurs, tailles, coût ¥, poids, fournisseur + réf + lien), modifier, **retirer = masquer** (jamais effacer) ; prix calculé par devise + marge ; alerte marge < 10 % (décision Serge du 3 nov.) | 🆕 |
| 3 | `/admin` tableau de bord : ventes jour/semaine/mois par devise, nb de commandes, panier moyen, marge estimée, top articles et marques, commandes en retard (tes piles), demandes Finds | 🆕 |
| 4 | Connexion de Jean Paul : vrai compte admin (Supabase Auth, déjà branché par toi) + 2FA ; rôles admin / équipe | 🆕 |

## PR 1 : où on en est

- **Base** : migration `0010_catalogue_en_base.sql` **appliquée** le 4 nov. (colonnes `cost` en fen, `weight_g`, `colors`, `sizes`, `on_site`, `position` sur `products`).
- **Code** (branche `feat/rhamon/catalogue-base`, poussée) :
  - `src/lib/catalog/db.ts` lit les articles `status = active` et `on_site = true`, avec la clé publique, en cache (étiquette `catalogue`). Si la base ne répond pas, on renvoie `null`.
  - `src/lib/catalog/index.ts` : vrais articles de la base, sinon la **copie de secours** `REAL_SNAPSHOT` (code), puis les articles de démo (restent dans le code).
  - `scripts/catalogue-sql.mjs` écrit le SQL d'import (31 marques, 12 catégories, 23 vrais articles + photos).
- ✅ **Import fait le 3 nov. par Serge** : 23 articles sur le site, 31 marques, 12 catégories, 37 photos. À refaire seulement pour un import neuf. Commande utilisée :
  ```bash
  node scripts/catalogue-sql.mjs > /tmp/catalogue.sql   # puis coller dans Supabase → SQL Editor → Run
  ```
  Vérifier ensuite : `select count(*) from products where on_site;` → 23. Supabase signale la table `src` sans RLS : elle est temporaire et disparaît à la fin, choisir « Run without RLS ».
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

> 🗣️ **Serge, 3 nov. 2026 : ✅ d'accord pour le prix tapé en USD.** Mes réponses :
> - **Droits, taxes et livraison : compris** dans le prix USD, puisque le site affiche « Droits et taxes inclus ».
> - **Taux de conversion : fixes par zone, changés à la main**, pour que les prix ne bougent pas chaque jour.
> - **Remises de groupe : oui**, sur ce prix.
> - ⛔ **Coût en ¥ obligatoire**, pas facultatif : sans lui, ni prix plancher (R5) ni alerte à 10 %, donc rien n'empêche de vendre à perte.
> Discussion close pour la PR 2 ; à adapter : formule de prix (`src/models/pricing/`), CLAUDE.md §9.

## Autres points laissés en route (4 nov.)

- `RESEND_API_KEY` et `EMAIL_FROM` absents de Vercel : les e-mails de commande ne partent pas. Il faut d'abord le domaine `takeurclothes.com` vérifié dans Resend. Guide complet donné à Rhamone : domaine → Resend « Add Domain » → DNS dans Vercel → clé API → SMTP Supabase (`smtp.resend.com`, port 465, utilisateur `resend`).
- Migration `0008` (numéros **TUC-**) **appliquée le 4 nov.** avec l'accord de Rhamone.
- PR #17 (ancienne Caisse, remplacée par #43) et #10 (Crée ta tenue 3D) ouvertes depuis plus de 7 jours : finir ou fermer (Rhamone).

## Boutiques (`/admin/boutiques`, Serge, 4 nov. 2026)

- **Ajouter ou modifier :** nom, logo (facultatif), couleur tirée du logo et modifiable, place dans le mall.
- **Place :** 1 = première boutique du parcours. Les flèches de la liste déplacent d'un cran.
- **Masquer :** la boutique et ses articles disparaissent du site, sans rien effacer.
- **Retirer :** possible seulement sans article, car les commandes passées gardent leurs fiches.
- **Dans le mall :** une boutique apparaît dès son premier article visible.
- **Logos :** seulement ceux que TakeUrClothes a le droit d'afficher. Ils partent en PNG de 512 px au plus, dans le dossier « produits ».

---

## Suite validée par Rhamone le 4 nov. 2026 (soir) — **pour Serge**

> Rhamone n'a plus de temps : **Serge finit ces 3 PR, dans cet ordre.** Le tableau de bord des ventes est la PR #68 (ouverte, à regarder puis merger).
> Déjà en place : modifier le prix d'un article existant (`/admin/articles` → Modifier) ; prix en **USD**, coût en ¥ obligatoire ; une marque = une boutique (la liste « Marque » de la fiche article lit les boutiques de `/admin/boutiques`).

### 1. « + Nouvelle marque » depuis la fiche article (le plus urgent : Jean Paul ajoute ses articles aujourd'hui)
- En bas de la liste « Marque » de `/admin/articles/fiche` : **« + Nouvelle marque… »**.
- Petit panneau : **nom de la marque** (obligatoire), puis **au choix** :
  - **déposer le logo** (même envoi que `uploadLogoAction` de `/admin/boutiques`) ;
  - **ou, sans logo : choisir 2 couleurs** (fond et texte de l'enseigne) pour rester dans l'esprit de la marque. Le nom s'affiche alors en texte avec ces couleurs.
- **Si un logo est déposé : couleurs reprises du logo, toutes seules.** Dans le navigateur, on dessine le logo sur un canvas, on garde les 2 teintes dominantes (sans le blanc ou le transparent du fond) et on les propose en couleurs de l'enseigne, modifiables avant d'enregistrer. Pas d'IA ni de service extérieur nécessaire.
- Enregistrer = la boutique est créée (via `saveBoutique`), elle est **sélectionnée dans la fiche article**, et l'article continue d'être rempli. Logo, couleurs et place dans le mall restent modifiables ensuite dans `/admin/boutiques`.
- **À quoi ressemble une nouvelle boutique** : même gabarit que les autres (une des 3 architectures de #65), enseigne = logo s'il existe, sinon le nom en texte aux couleurs choisies ; placée **à la fin du parcours** du mall ; visible dès qu'elle a au moins un article en ligne (une boutique vide ne s'affiche pas, L-35).
- Refuser un doublon : « Gucci » et « gucci » = la même boutique (comparer les slugs).

### 2. Connexion admin par e-mail (les e-mails marchent depuis le 4 nov. : Resend vérifié, SMTP Supabase réglé)
- **Liste d'admins** dans Vercel (`ADMIN_EMAILS`, séparés par des virgules) : Rhamone (`rhamonkota@gmail.com`), Serge, Jean Paul (**e-mail de Jean Paul : à demander à Rhamone**).
- `/admin` : on tape son e-mail, on reçoit un **code à 6 chiffres valable 10 min** (par Resend) ; si l'e-mail n'est pas dans la liste, **rien n'est envoyé**, et le message reste le même pour ne rien révéler. 5 essais au plus.
- **Séparé des comptes clients** : un compte client ne donne jamais accès à l'admin, même avec la même adresse.
- Le **code Telegram reste en secours** (`isAdmin()` accepte l'un ou l'autre).
- En attendant : Jean Paul se connecte avec le code Telegram, après avoir été ajouté au groupe de l'équipe.

### 3. Page compte client, style Nike (retour de Rhamone, capture du 4 nov.)
- **Inscription** : case « Recevoir les nouveautés et les drops », **décochée par défaut** (opt-in, loi européenne). Elle remplace la case de la page compte.
- **Accueil du compte** : « Bonjour [prénom] » en petit, l'e-mail dessous ; puis une **grille de cases** : **Mes commandes** (nombre + état de la dernière), **Mes envies** (nombre), **Mon panier** (nombre), **Suivre un colis**, **Réglages**. Tout tient sur un écran de téléphone.
- **Réglages** : e-mail, nouveautés et drops (oui ou non), mot de passe ; **« Se déconnecter » = petit lien discret tout en bas de Réglages** (plus de gros bouton au milieu).
