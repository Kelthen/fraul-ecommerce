# Fraul — Architecture cible (plan à valider)

> Statut : **PROPOSITION** — à valider par Rhamone puis Serge avant toute ligne
> de code. Rédigé le 2026-10-12. Les points marqués ⚠️ sont des risques ou des
> décisions à prendre ; `[À FOURNIR]` = info attendue du client.

## 0. En une page

| Sujet | Choix proposé | Pourquoi |
|---|---|---|
| Site (front + back) | **Next.js** (App Router, TypeScript) | Pages produits rendues côté serveur → SEO parfait ; un seul projet pour site + API + admin. |
| Base de données | **PostgreSQL via Supabase** | Auth, stockage photos, sauvegardes, et sécurité ligne par ligne (RLS) inclus. |
| Hébergement | **Vercel** | Preview automatique **par PR** (= notre règle « vrai lien »), CDN mondial. |
| Paiement | **Stripe** (carte, Apple Pay, Google Pay, PayPal possible) | Couvre les 5 pays servis : USA, Canada, UK, France, Belgique. |
| Anti-robots | **Cloudflare Turnstile** (captcha invisible) + limitation de débit | Pas de puzzle pénible pour les vrais clients. |
| Emails | **Resend** (transactionnel) | Confirmation, expédition, livraison. |
| Suivi colis | Saisie du code par le livreur + **API 17TRACK** | 17TRACK suit les transporteurs chinois et internationaux. |
| Fraul Walk 3D | Garde la démo actuelle, branchée sur le vrai catalogue | Optionnel, chargé à la demande, **jamais** sur le chemin d'achat. |

**Pays servis** : USA, Canada, Royaume-Uni, France, Belgique.

⚠️ **Option à trancher : hybride Shopify.** Si l'entreprise est immatriculée
aux USA, au Canada ou au Royaume-Uni, Shopify Managed Markets (Global-e) gère
taxes, TVA/IOSS et douane payée d'avance (DDP). On garderait alors Shopify
comme moteur (panier, paiement, taxes, commandes) et notre site Next.js comme
vitrine (Fraul Walk, design, SEO). Le prix par client reste chez nous (Shopify
ne le fait qu'en Plus). Le schéma ci-dessous s'adapte : `orders`/`payments`
deviennent une copie des commandes Shopify.

**Pourquoi pas Shopify / WooCommerce seuls ?** Le cœur du projet, c'est le **prix
personnalisé par client** + le **flux fournisseur** + le **Fraul Walk**. Shopify
ne fait les prix par client qu'avec Shopify Plus (très cher) et contraint le
3D ; WooCommerce empile des plugins (lent, failles fréquentes). Un projet sur
mesure bien découpé est ici plus simple *et* plus solide.

## 1. Vue d'ensemble

```
 Clients (mobile d'abord)                Équipe / partenaires
   │  fr / en                              │ Admin (Rhamone, Serge)
   ▼                                       │ Ops logistique (sur place)
┌──────────────────────────┐               │ Fournisseur, Livreur (lien WeChat)
│  Next.js sur Vercel      │◄──────────────┘
│  - pages publiques (SEO) │
│  - compte / panier       │──► Stripe             (paiement, webhooks signés)
│  - admin + portails      │──► Resend (emails)
│  - API + tâches planif.  │──► 17TRACK (suivi colis)
└──────────┬───────────────┘──► WeChat (notif. fournisseur/livreur) ⚠️
           ▼
┌──────────────────────────┐      ┌─────────────────────────┐
│ Supabase                 │◄─────│ Synchro fournisseur     │
│ Postgres + RLS + Auth    │      │ (tâche planifiée)       │
│ Storage (photos)         │      └─────────────────────────┘
└──────────────────────────┘
```

Règle d'or : **le prix est toujours calculé côté serveur**. Le navigateur
n'envoie jamais un prix, seulement des identifiants de produits et des
quantités.

## 2. Base de données

Argent : toujours en **entiers** (centimes) + code devise. Toutes les tables ont `id` (uuid),
`created_at`, `updated_at`.

### 2.1 Catalogue

| Table | Champs principaux | Notes |
|---|---|---|
| `brands` | slug, name, style (jsonb = le `PRESET` de la démo), active | Une ligne = une boutique Fraul Walk générée. |
| `categories` | slug, parent_id, name (jsonb fr/en), position | T-shirts, Hoodies, Pantalons, Sneakers, Chapeaux, Accessoires. |
| `products` | brand_id, category_id, supplier_id, supplier_ref, slug, title / description (jsonb fr/en), status (`draft`/`active`/`archived`), seo_title, seo_description | Descriptions **réécrites** (voir SEO). |
| `product_images` | product_id, path, view (`front`/`back`/`detail`), position, alt (jsonb) | Photos détourées, versions AVIF/WebP générées. |
| `product_variants` | product_id, sku, color, size, supplier_cost, cost_currency (CNY), weight_g, availability | Une ligne = une taille × une couleur. |

### 2.2 Fournisseur

| Table | Champs | Notes |
|---|---|---|
| `suppliers` | name, site_url, contact_wechat, feed_config (jsonb) | |
| `supplier_sync_runs` | supplier_id, started_at, finished_at, status, stats (jsonb), error | Journal de chaque import : ajoutés / modifiés / disparus. |

Un produit qui disparaît chez le fournisseur passe en `archived` (jamais
supprimé : les anciennes commandes y font référence).

### 2.3 Prix personnalisés

| Table | Champs | Notes |
|---|---|---|
| `customer_groups` | name (ex. « Revendeurs Dakar », « VIP diaspora ») | |
| `price_rules` | scope (`global`/`country`/`group`/`customer`/`brand`/`category`), target_id ou country, coefficient, fixed_markup, rounding (ex. finir en ,90), currency, priority, valid_from, valid_to | La règle la plus précise gagne. |
| `fx_rates` | base, quote, rate, fetched_at | Mise à jour quotidienne (coût en CNY → prix en USD/CAD/GBP/EUR). |

Calcul : `prix = arrondi( coût_CNY × taux × coefficient + marge_fixe )`, en
appliquant la règle de plus haute priorité. **Visiteur anonyme** : prix
« public » de la zone détectée (pays via l'IP, jamais affiché ; pas de sélecteur
de pays). L'adresse de livraison fait foi au paiement. Stratégie complète
(groupes de remise, liens d'invitation et de parrainage) : CLAUDE.md §9.

⚠️ **Obligation légale UE** (France, Belgique) : si un prix est personnalisé
par décision automatisée, il faut **l'indiquer au client** (directive
Omnibus). Mention prévue sur la fiche produit et dans les CGV.

### 2.4 Clients

| Table | Champs | Notes |
|---|---|---|
| `customers` | id (= compte Supabase Auth), email, phone, whatsapp, country, locale, currency, group_id | |
| `addresses` | customer_id, nom, lignes, ville, pays, téléphone, défaut | |
| `consents` | customer_id, type (`cgv`, `marketing`, `cookies`), document_version, granted_at, revoked_at | Preuve de consentement (RGPD). |

### 2.5 Panier, commandes, paiements

| Table | Champs | Notes |
|---|---|---|
| `carts` / `cart_items` | customer_id ou session anonyme, variant_id, qty | Pas de prix stocké : recalculé à chaque affichage. |
| `orders` | number (`FRL-2026-000123`), customer_id, status, currency, subtotal, shipping, duties, total, price_snapshot (jsonb : règles appliquées), shipping_address (copie), terms_version | **Copie figée** au moment de l'achat. |
| `order_items` | order_id, variant_id, qty, unit_price, unit_cost, title (copie) | Marge calculable par ligne. |
| `payments` | order_id, provider (`stripe`, ou `shopify` si hybride), provider_ref, amount, status | |
| `payment_events` | provider_event_id (**unique**), payload, processed_at | Un webhook reçu deux fois n'est traité qu'une fois. |

Cycle de vie d'une commande :

```
en_attente_paiement → payée → envoyée_fournisseur → confirmée_fournisseur
  → expédiée → en_transit → douane → en_livraison → livrée
(à tout moment avant expédition : annulée / remboursée)
```

### 2.6 Logistique et suivi

| Table | Champs | Notes |
|---|---|---|
| `shipments` | order_id, carrier, tracking_code, public_token, status, shipped_at, delivered_at, created_by | `public_token` = lien de suivi impossible à deviner. |
| `shipment_events` | shipment_id, status, location, occurred_at, source (`manuel`/`17track`) | Alimente le **suivi animé**. |

### 2.7 Équipe, partenaires, traçabilité

| Table | Champs | Notes |
|---|---|---|
| `staff` | user_id, role (`admin`/`ops`/`supplier`/`courier`), supplier_id | Le fournisseur ne voit **que** ses commandes (RLS). |
| `notifications_outbox` | channel (`email`/`wechat`/`whatsapp`/`slack`), recipient, payload, status, attempts | Envoi fiable avec relances. |
| `audit_log` | actor, action, entity, entity_id, diff (jsonb), at | Qui a changé un prix, un statut, un remboursement. |
| `legal_documents` | type (`cgv`, `confidentialite`, `retours`…), version, locale, content, published_at | Chaque commande garde la version des CGV acceptée. |

## 3. Le site, page par page

**Public (indexé par Google)**
- `/fr` `/en` : accueil (Nouveautés, marques, catégories, invitation Fraul Walk).
- `/fr/marques` + `/fr/marques/[marque]` : annuaire A–Z + page marque.
- `/fr/[categorie]` : listes filtrables (taille, couleur, marque, prix).
- `/fr/produit/[slug]` : fiche produit (photos face/dos, tailles, prix, livraison estimée par pays).
- `/fr/suivi` : suivi de commande (code ou lien reçu), animation.
- `/fr/walk` : Fraul Walk 3D (chargé à la demande).
- Pages légales (section 7), FAQ, contact.

**Client connecté** : compte, adresses, commandes, suivi, préférences,
suppression du compte (RGPD).

**Tunnel d'achat** : panier → livraison (pays, délai, droits de douane
affichés) → paiement (Stripe) → confirmation.
Commande possible **sans compte** (compte proposé après).

**Admin** (`/admin`, 2FA obligatoire) : produits, marques, règles de prix,
clients et groupes, commandes, remboursements, synchro fournisseur, journal.

**Portails partenaires** (lien sécurisé ouvrable depuis WeChat, sans appli) :
- Fournisseur : nouvelles commandes, confirmer/refuser, signaler une rupture.
- Livreur / ops : saisir le code de suivi, marquer expédié/livré.

## 4. Sécurité

| Menace | Protection |
|---|---|
| Accès aux données d'un autre client | RLS Postgres sur **toutes** les tables + tests automatiques de ces règles. |
| Modifier un prix depuis le navigateur | Prix recalculé côté serveur, jamais lu depuis la requête. |
| Vol de carte | Aucune donnée carte chez nous : paiement sur la page Stripe. |
| Faux webhook de paiement | Vérification de signature + idempotence (`payment_events`). |
| Prise de compte | Connexion par lien magique / code (email ou WhatsApp), passkeys ; 2FA **obligatoire** pour admin et partenaires. |
| Deviner un numéro de suivi | Lien de suivi avec jeton aléatoire ; suivi par numéro = numéro + email. |
| Injection / XSS | Requêtes paramétrées, échappement par défaut (React), en-têtes **CSP**, HSTS, X-Frame-Options. |
| Fuite de secrets | Clés uniquement dans les variables d'environnement Vercel/Supabase ; scan des secrets sur le repo. |
| Dépendances vulnérables | Dependabot + `npm audit` en CI. |
| Perte de données | Sauvegardes Supabase quotidiennes + restauration à un instant donné ; test de restauration avant le lancement. |
| Fraude à la commande | Stripe Radar ; vérification manuelle au-delà d'un montant ; limite de commandes par compte/IP. |

## 5. Anti-spam, captcha, abus

- **Cloudflare Turnstile** (invisible la plupart du temps) sur : inscription,
  connexion, mot de passe oublié, contact, newsletter, avis, et avant paiement
  pour les commandes sans compte.
- **Limitation de débit** par IP et par compte sur toutes les routes sensibles
  (connexion : 5 essais / 15 min ; formulaires : quelques envois / heure).
- **Champ piège** invisible (honeypot) + délai minimum de remplissage.
- Emails jetables refusés à l'inscription ; double opt-in pour la newsletter.
- Avis clients : seulement après achat livré, modérés avant publication.
- **Assistant IA (phase optionnelle)**, si on ajoute un chat d'aide à
  l'achat (petit modèle d'IA, choisi pour le coût) :
  - accès en **lecture seule** au catalogue public, aucun accès aux prix des
    autres clients, aux commandes des autres ni à l'admin ;
  - le texte du client est traité comme une **donnée**, jamais comme une
    instruction (protection contre l'injection de prompt) ;
  - Turnstile avant la première question, quota de messages par session et
    budget mensuel plafonné ;
  - réponses limitées en longueur, journalisées, bouton « parler à un humain ».

## 6. SEO (et visibilité dans les IA)

- Pages publiques **rendues côté serveur** et régénérées quand le catalogue
  change → rapides et lisibles par Google.
- **Bilingue fr/en** avec `hreflang` (diaspora anglophone : USA, UK, Canada).
- URL propres : `/fr/produit/hoodie-oversize-noir`, une URL canonique par produit.
- Données structurées **schema.org** : Product, Offer, BreadcrumbList,
  Organization, FAQ.
- ⚠️ **Contenu dupliqué** : le fournisseur publie déjà les mêmes descriptions.
  On **réécrit** titres et descriptions (sinon Google classe le fournisseur
  avant nous).
- `sitemap.xml` automatique, `robots.txt`, images avec `alt` fr/en, Open Graph
  pour les partages WhatsApp / Instagram.
- **Core Web Vitals** au vert sur mobile : images AVIF/WebP redimensionnées,
  polices auto-hébergées, three.js **jamais** chargé hors Fraul Walk.
- Le Fraul Walk n'est pas lisible par Google : chaque boutique a son
  **équivalent HTML** (page marque).
- Flux **Google Merchant Center** (Shopping) avec le prix public par pays.
- Visibilité IA : données structurées propres, page « À propos » claire,
  `llms.txt`.

## 7. Juridique (à faire valider par un juriste)

Pages prévues, en fr et en en :
1. **Mentions légales** — entité, adresse, immatriculation `[À FOURNIR]`.
2. **CGV** — commande, prix personnalisés (mention Omnibus), paiement,
   livraison, douane, garanties.
3. **Livraison et douanes** — délais par pays, qui paie les droits.
4. **Retours et remboursements** — ⚠️ **14 jours de rétractation obligatoires**
   pour les clients de l'UE.
5. **Politique de confidentialité** — RGPD (UE), UK GDPR, lois USA (dont Californie) et
   Canada (LPRPDE, Loi 25 au Québec) ; droits d'accès/suppression.
6. **Cookies** — bandeau de consentement seulement si on ajoute des traceurs
   non essentiels (analytics respectueux sans cookie par défaut).
7. **Accessibilité** — site conforme WCAG 2.2 AA visé.

## 8. Risques à trancher avant de coder ⚠️

1. **Authenticité des marques.** Si les 27 marques sont vendues sans être
   des produits authentiques/autorisés, Stripe et les autres prestataires
   **bloquent le compte et gèlent les fonds**, et c'est illégal dans les pays
   visés. Il faut confirmer avec le client la provenance (factures,
   distributeur autorisé). C'est le risque n°1 du projet.
2. **Douanes et taxes.** Expédition Chine → USA : l'exemption sous 800 $ a été
   supprimée en 2025 et les droits sur les produits chinois sont élevés. UK
   et UE : TVA à collecter dès le premier article (IOSS côté UE). À valider
   avec un comptable : livraison **droits payés (DDP)** ou à la charge du
   client.
3. **Entité juridique et pays** de l'entreprise : nécessaire pour Stripe, les
   CGV et la fiscalité, et **décide Shopify hybride ou sur mesure** `[À FOURNIR]`.
4. **WeChat** : il n'existe pas d'API simple pour écrire à un compte WeChat
   personnel. Options : (a) lien vers le portail que le livreur ouvre dans
   WeChat, avec message prêt à copier ; (b) robot de groupe **WeCom**
   (WeChat Work), si fournisseur et livreur acceptent. À trancher avec Serge.

## 9. Ordre de construction

| Phase | Contenu | Validation humaine |
|---|---|---|
| **P0 Fondations** | Projet Next.js, lint, tests, CI, preview Vercel par PR, Supabase, schéma de base, auth, ébauches légales | Preview vide mais en ligne |
| **P1 Catalogue + SEO** | Import des données démo, pages marques/catégories/produits, fr/en, sitemap, données structurées | Preview + score Lighthouse mobile |
| **P2 Achat** | Comptes, prix personnalisés, panier, Stripe, emails | Commande test de bout en bout |
| **P3 Logistique** | Portails fournisseur/livreur, notifications, suivi animé, 17TRACK | Test avec le vrai livreur |
| **P4 Automatisation** | Synchro fournisseur automatique, Fraul Walk branché au vrai catalogue | Preview |
| **P5 Bonus** | Assistant IA, avis, emailing, programme fidélité | Au cas par cas |

Chaque phase = des tâches attribuées dans `STATUS.md` et des PR séparées,
avec les deux validations humaines.
