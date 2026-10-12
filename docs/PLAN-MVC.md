# Plan MVC : un site où chaque changement se fait dans un seul fichier

> **Statut : plan seulement, rien n'est codé.** On attend l'OK de Rhamone (et de Serge) avant la première étape.
> Rédigé le 2026-10-12 (fuseau du client à confirmer, voir STATUS.md).

---

## 1. La question posée, et ma recommandation

Le cahier des charges demande une réécriture en **Vite + TypeScript sans framework**. Il a été écrit pour l'ancienne démo (`index.html`, un seul fichier de 1 500 lignes). Depuis, le site a été refait en **Next.js**, avec 1 053 pages générées à l'avance.

| | Réécrire en Vite (demandé) | **Garder Next.js et ranger en MVC (recommandé)** |
|---|---|---|
| Google voit chaque produit | ✗ Une seule page HTML : il faudrait refaire le pré-rendu à la main | ✓ Déjà fait : chaque marque et chaque produit a sa vraie page |
| Travail déjà fait | Repart de zéro (routes, panier, fiches, Walk) | Gardé ; on déplace et on découpe |
| « Je change X → un fichier » | ✓ Si on range bien | ✓ Pareil, c'est le rangement qui compte, pas l'outil |
| Paiement, comptes, base plus tard | À ajouter à côté (un serveur en plus) | Prévu dans le même projet (Supabase, Stripe) |
| Poids sur téléphone | Léger | Léger aussi : three.js n'est chargé qu'à l'ouverture du Walk |

**Recommandation : on garde Next.js et on applique le rangement MVC demandé.** Ce qui rend le site « facile à modifier en deux clics », c'est que chaque chose ait un seul fichier, au nom clair. Changer d'outil n'apporte rien de plus ici. Le vrai désordre aujourd'hui, c'est `src/walk/engine.js` (931 lignes qui font tout). C'est lui qu'on découpe en priorité.

> ⛔ **Contradiction à trancher.** Le cahier dit « Walk toujours optionnel ». La décision du 2026-10-12 (STATUS.md) dit : « Le Fraul Walk est le cœur du site, pas une option. »
> Ce plan garde la décision : le Walk reste l'entrée principale. La **liste classique** ne sert que de **repli** : téléphone sans 3D, mode économie de données, mouvement réduit. Si tu veux autre chose, dis-le et je change le plan.

---

## 2. Les règles du rangement (MVC)

| Couche | Rôle | Interdit |
|---|---|---|
| **Modèle** (`models/`) | Les données et les calculs : catalogue, panier, plan du mall, parcours, tailles | Toucher la page (DOM), dessiner, lire la souris ou le doigt |
| **Vue** (`views/`, composants) | Dessiner ce qu'on lui donne : page, scène 3D, panneau | Aller chercher des données, décider quoi faire |
| **Contrôleur** (`controllers/`, hooks) | Écouter (clic, défilement, bouton retour), demander au modèle, dire à la vue de se mettre à jour | Dessiner lui-même |
| **Styles** (`styles/`) | Un fichier CSS par zone (accueil, produit, Walk, boutique) | Couleurs en dur : tout passe par les variables de la charte |

- **Environ 200 lignes maximum par fichier.** Au-delà, on découpe.
- **Un fichier = un sujet**, nommé par ce qu'il fait (`store-zones.ts`, pas `utils2.ts`).
- Les **textes visibles** sont rassemblés dans `src/content/` (un fichier par page). Changer une phrase ne demande jamais d'ouvrir du code.

---

## 3. Arborescence cible

```
src/
  app/                         ← les routes (Next.js) : une page = un dossier, juste de l'assemblage
    page.tsx                   /            accueil
    walk/page.tsx              /walk        le mall
    walk/[marque]/page.tsx     /walk/:slug  le mall, devant une boutique
    marques/[slug]/page.tsx    /marques/:slug
    produit/[slug]/page.tsx    /produit/:slug
    panier, suivi, tenue, légal…
  content/                     ← TOUS les textes visibles, un fichier par page
    home.ts  walk.ts  store.ts  product.ts  cart.ts  legal.ts
  models/
    catalog/                   (= src/lib/catalog actuel) marques, catégories, produits de démo
    cart.ts                    panier : ajouter, retirer, total ; sauvegarde localStorage
    sizes.ts                   tailles et guide des tailles par catégorie
  components/                  ← vues React du site (aucune donnée en dur, aucun fetch)
    product/  ProductGallery.tsx  SizeGuide.tsx  StickyAddBar.tsx
    cart/     CartDrawer.tsx  CartLine.tsx
    …
  hooks/                       ← contrôleurs React
    useCart.ts  useCartDrawer.ts  useFallbackMode.ts
  walk/
    models/
      mall-layout.ts           plan du T : emplacements des 27 vitrines (SLOTS), dimensions
      walk-path.ts             parcours caméra : arrêts, pauses, entrée et sortie
      store-layout.ts          plan de la boutique : zones, rayons (ZONES, CAR), contournement de l'îlot
      layers.ts                pile des couches ouvertes (annuaire, boutique, rayon, zoom)
    views/
      textures.ts              enseignes, étiquettes, lumières peintes
      mannequin.ts             mannequin
      mall-scene.ts            construction du mall (murs, vitrines, pièce centrale)
      shopfront.ts             une vitrine et son intérieur visible
      store-scene.ts           construction de la boutique (murs, îlot, portants)
      rack.ts                  un portant d'articles (disposition, zoom)
      hud.ts                   nom de la boutique, compteur, barre de progression
      directory.ts             annuaire des marques
      store-panel.ts           panneau article (nom, prix, couleurs, tailles)
    controllers/
      walk-controller.ts       défilement → position dans le mall, toucher une vitrine → entrer
      store-controller.ts      choix de rayon, retour au centre, sortie
      history.ts               bouton retour du téléphone ↔ couches (déjà écrit, partie 1)
      focus.ts                 focus piégé, fond inerte, Échap (déjà écrit, partie 1)
      input.ts                 molette, glisser, clavier
    WalkExperience.tsx         monte le tout (inchangé pour le reste du site)
  styles/
    tokens.css                 couleurs, polices, espacements de la charte
    base.css  home.css  product.css  cart.css  walk.css  store.css
```

---

## 4. Ancien code → nouveau fichier

| Aujourd'hui | Lignes | Demain |
|---|---|---|
| `walk/engine.js` · annuaire (`renderDir`, ouverture, recherche) | ~60 | `walk/views/directory.ts` + `walk/controllers/walk-controller.ts` |
| `walk/engine.js` · couches, historique, focus (partie 1) | ~55 | `walk/models/layers.ts`, `walk/controllers/history.ts`, `walk/controllers/focus.ts` |
| `walk/engine.js` · `G()` : textures, étiquettes, mannequin | ~140 | `walk/views/textures.ts`, `walk/views/mannequin.ts` |
| `walk/engine.js` · `SLOTS`, constantes du T | ~40 | `walk/models/mall-layout.ts` |
| `walk/engine.js` · `pathAt`, `setHud`, `onWalkScroll`, `jumpToShop` | ~50 | `walk/models/walk-path.ts`, `walk/views/hud.ts`, `walk/controllers/walk-controller.ts` |
| `walk/engine.js` · `initMall` (scène, vitrines, détails, toucher) | ~200 | `walk/views/mall-scene.ts`, `walk/views/shopfront.ts`, toucher → `walk-controller.ts` |
| `walk/engine.js` · `ZONES`, `CAR`, `route` | ~30 | `walk/models/store-layout.ts` |
| `walk/engine.js` · `openStore`, `goZone`, `storeBack`, gestes | ~90 | `walk/controllers/store-controller.ts`, `walk/controllers/input.ts` |
| `walk/engine.js` · `showInfo`, puces de rayon | ~30 | `walk/views/store-panel.ts` |
| `walk/engine.js` · `buildStore` (scène, portants, zoom) | ~240 | `walk/views/store-scene.ts`, `walk/views/rack.ts` |
| `walk/walk.css` | 97 | `styles/walk.css` + `styles/store.css` |
| `app/globals.css` | 305 | `styles/tokens.css`, `base.css`, `home.css`, `product.css`, `cart.css` |
| `components/CartProvider.tsx` (logique + stockage) | 106 | `models/cart.ts` (logique) + `hooks/useCart.ts` (React) |
| `lib/catalog/*` | — | `models/catalog/*` (simple déplacement) |
| Textes en dur dans `app/page.tsx`, `ProductDetail.tsx`, `WalkExperience.tsx`… | — | `content/*.ts` |

---

## 5. « Je veux changer X » → quel fichier

| Je veux changer… | J'ouvre |
|---|---|
| Une phrase de l'accueil | `src/content/home.ts` |
| Le texte « Touche la vitrine pour entrer » | `src/content/walk.ts` |
| Une couleur de la charte | `src/styles/tokens.css` |
| L'ordre ou le nombre de boutiques du mall | `src/models/catalog/brands.ts` (`WALK_BRANDS`) |
| La forme du T, l'écart entre vitrines | `src/walk/models/mall-layout.ts` |
| La vitesse ou les pauses de la promenade | `src/walk/models/walk-path.ts` |
| L'allure d'une vitrine | `src/walk/views/shopfront.ts` |
| Le mannequin | `src/walk/views/mannequin.ts` |
| La place des rayons dans la boutique | `src/walk/models/store-layout.ts` |
| Le panneau article (prix, tailles) dans la boutique | `src/walk/views/store-panel.ts` |
| Ce que fait le bouton retour | `src/walk/controllers/history.ts` |
| Le guide des tailles | `src/models/sizes.ts` (données) · `components/product/SizeGuide.tsx` (affichage) |
| Le tiroir du panier | `components/cart/CartDrawer.tsx` |
| Le calcul du panier | `src/models/cart.ts` |
| Les produits de démo | `src/models/catalog/demo.ts` |

Ce tableau sera recopié dans le `README.md` et tenu à jour dans chaque PR.

---

## 6. Étapes, testables une par une

Chaque étape = **une PR**, sans changement visible. Pour chacune : `npm run check`, `npm run smoke` (tests retour compris), et des captures avant/après comparées pixel par pixel.

| # | Étape | Test qui prouve que rien n'a cassé |
|---|---|---|
| 1 | Sortir les **modèles purs** du Walk (`mall-layout`, `walk-path`, `store-layout`, `layers`) | Petits tests unitaires sur le parcours (position à 0 %, 50 %, 100 %) ; captures du mall identiques |
| 2 | Sortir les **contrôleurs** `history.ts` et `focus.ts` | Tests `goBack` actuels (annuaire, zoom → rayon → boutique → mall → page précédente) |
| 3 | Sortir les **vues 3D** (textures, mannequin, vitrine, scènes) | Captures du mall et de la boutique identiques |
| 4 | Sortir les **contrôleurs** du mall et de la boutique, puis `engine.js` disparaît | Test complet du Walk ; aucun fichier au-dessus de 200 lignes |
| 5 | **Textes** dans `src/content/` | Captures de toutes les pages identiques ; test « aucun pays affiché » |
| 6 | **CSS** découpé en `styles/` avec les jetons de la charte | Captures identiques |
| 7 | **Panier** : `models/cart.ts` + **tiroir** (voir §9) | Ajouter, changer la taille, retirer, recharger la page : le panier reste |
| 8 | **Fiche produit** : galerie, guide des tailles, bouton collant (voir §9) | Captures téléphone ; bouton toujours visible en bas |
| 9 | **Repli en liste** (voir §8) | Test avec WebGL coupé, avec « économie de données » et avec « mouvement réduit » |

Les étapes 1 à 6 ne changent **rien** à l'écran : c'est du rangement. Les étapes 7 à 9 ajoutent des choses, et tu valides chacune sur la preview.

---

## 7. Budget de performance (téléphone d'abord)

| Poste | Budget | Où on en est |
|---|---|---|
| JavaScript de l'accueil (compressé) | ≤ 120 Ko | À mesurer à l'étape 1, puis surveillé à chaque PR |
| three.js | **Chunk séparé, chargé seulement à l'ouverture du Walk** | ✓ Déjà le cas (`import("three")`) |
| Version de three.js | **Épinglée à r128** | 🟡 `^0.128.0` (accepte 0.128.x) : on passe à `0.128.0` exact |
| Polices | **woff2 auto-hébergées**, sous-ensemble latin, `font-display: swap` | ✓ Déjà le cas avec `next/font` (Bodoni Moda, Montserrat) |
| Premier affichage (LCP) sur 4G | ≤ 2,5 s | À mesurer sur la preview (Lighthouse mobile) |
| Images produit | WebP/AVIF, tailles adaptées | ✓ Prévu via `scripts/optimize-images.mjs` |
| Rendu 3D | Pixel ratio ≤ 1,75, rendu seulement quand ça bouge | ✓ Déjà le cas |

---

## 8. Routes et repli en liste

| Route | Contenu |
|---|---|
| `/` | Accueil (entrée du mall) |
| `/walk` | Le mall, depuis l'entrée |
| `/walk/:slug` | Le mall, devant la boutique `:slug` (ou directement dans la boutique si la marque n'est pas dans le T) |
| `/marques/:slug` | La boutique de la marque en liste (page vue par Google) |
| `/produit/:slug` | La fiche produit |

> Le cahier écrit `/marque/:slug`. Le site utilise déjà `/marques/:slug`, au pluriel comme `/marques`. Je propose de le garder. Une redirection `/marque/:slug` → `/marques/:slug` coûte une ligne si tu y tiens.

**Repli en liste.** Dans ces trois cas, le Walk ouvre la liste de la boutique (`/marques/:slug`) au lieu de la 3D :
1. **Pas de WebGL** : déjà en place (`onFallback`).
2. **Économie de données** (`navigator.connection.saveData` ou `prefers-reduced-data`) : à faire. Un bouton « Voir en 3D quand même » reste proposé.
3. **Mouvement réduit** (`prefers-reduced-motion`) : aujourd'hui, la 3D reste mais sans animation. Proposé : on garde la 3D sans animation et on ajoute un lien « Voir en liste » bien visible. Pas de bascule automatique, puisque le Walk est le cœur du site.

Le choix se fait à un seul endroit : `hooks/useFallbackMode.ts`.

---

## 9. Panier en tiroir et fiche produit

**Panier en tiroir** (sans paiement) :
- Il glisse depuis la droite (depuis le bas sur téléphone) quand on ajoute un article, ou quand on touche l'icône panier.
- Contenu : lignes avec photo, taille, quantité ; total ; bouton « Voir le panier » vers `/panier` (la page reste).
- Stockage : `localStorage` (`fraul.cart.v1`, déjà utilisé), via `models/cart.ts`.
- C'est une couche comme les autres : **le bouton retour le ferme**, focus piégé, Échap (même code que la partie 1).

**Fiche produit** :
- **Galerie** : face, dos, détails, en balayant sur téléphone ou avec des miniatures sur ordinateur. Aujourd'hui, il n'y a que face/dos.
- **Guide des tailles** : un tableau par catégorie dans `models/sizes.ts`, ouvert dans un panneau. Aujourd'hui : `[À FOURNIR]`, à demander au client.
- **Bouton « Ajouter au panier » collant** en bas de l'écran sur téléphone, avec la taille choisie et le prix.

---

## 10. Ce que je te demande de valider

1. **Garder Next.js** et ranger en MVC (recommandé), ou réécrire en Vite comme dans le cahier ?
2. **Walk = cœur du site**, avec la liste seulement en repli (décision du 2026-10-12) ? Ou le Walk devient optionnel ?
3. Garder `/marques/:slug` (avec redirection depuis `/marque/:slug`) ?
4. On démarre par l'**étape 1** ?
