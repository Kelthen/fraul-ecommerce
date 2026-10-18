# Plusieurs fournisseurs par article + Fraul Finds (pièces sur demande) : proposition pour Serge

> **Zone de Serge** (fournisseur, commandes, SQL). Proposition écrite par Rhamone (avec son Claude) le 18 oct. 2026.
> **Rien n'est appliqué** : le SQL ci-dessous est une proposition à relire, modifier ou refuser. Réponds sous chaque partie en « 🗣️ Serge ».

## Le besoin (Rhamone, 18 oct. 2026)

- Un même article peut venir de **plusieurs fournisseurs** (ex. 10 fournisseurs pour Nike).
- **Une personne à part** s'occupe de l'expédition (réception, colis, code de suivi).
- Pour chaque article vendu, **on doit retrouver en interne quel fournisseur le vend** (et à quel prix).
- **Le client ne voit jamais les fournisseurs.**
- **Fraul Finds** (« Sur demande », ex-Conciergerie) : un visiteur décrit une pièce introuvable, l'équipe la cherche chez les fournisseurs et lui répond par e-mail.

## Ce qui existe aujourd'hui (schéma 0001)

- `products.supplier_id` + `supplier_ref` : **un seul** fournisseur par produit.
- `product_variants.supplier_cost` : un seul coût par taille / couleur.
- `order_items.supplier_id` : copie du fournisseur sur la ligne de commande (le fournisseur voit SES lignes) ; `unit_cost` figé.
- `staff.role = 'courier'` existe, mais un envoi (`shipments`) n'est relié à aucune personne en particulier.

## Proposition

### 1. Les offres : « tel fournisseur vend telle variante à tel prix »

Nouvelle table `supplier_offers` : une ligne par **variante × fournisseur**.

| Colonne | Rôle |
|---|---|
| `variant_id`, `supplier_id` | quelle taille / couleur, chez qui |
| `supplier_ref`, `supplier_url` | sa référence et sa fiche (pour commander vite) |
| `cost` (unités mineures, ¥) | son prix |
| `in_stock`, `lead_days` | dispo et délai annoncés |
| `priority` | 1 = fournisseur de référence (sert au prix affiché) |
| `active`, `last_seen_at` | désactivée si le produit disparaît chez lui (synchro) |

- `products.supplier_id` reste pour l'instant (= fournisseur d'origine de l'import), puis on le retire quand les offres sont en place.
- `product_variants.supplier_cost` devient le **coût de référence** (copie de l'offre `priority = 1`), pour ne pas toucher au calcul des prix.

### 2. Quel fournisseur pour une commande ?

- **Prix affiché au client** : calculé sur le coût de référence (comme aujourd'hui). Le client ne voit qu'un prix.
- **À l'envoi au fournisseur** (statut `sent_to_supplier`), on choisit l'offre :
  - par défaut : la moins chère **en stock** dont le délai tient dans l'objectif de la zone (USA/UK < 10 j, Canada < 14 j, France ~14 j) ;
  - Fraul peut changer à la main.
- On fige sur la ligne : `order_items.offer_id`, `supplier_id` (déjà là) et `unit_cost` (le vrai coût payé).
- **Prix plancher (R5)** : contrôle refait avec le vrai coût de l'offre choisie. Si on passerait sous coût + marge minimale, alerte à Fraul avant d'envoyer.

### 3. La personne de l'expédition

- `shipments.handled_by` → la personne (`staff`, rôle `courier`) qui s'occupe du colis.
- Elle voit **seulement** les envois qui lui sont attribués (règle RLS), pas les prix d'achat ni les autres fournisseurs.

### 4. Ce que chacun voit (RLS)

| Qui | Voit |
|---|---|
| Client | ses commandes, son suivi. **Jamais** `suppliers`, `supplier_offers`, `unit_cost`. |
| Fournisseur | ses offres et SES lignes de commande (`my_supplier_id()`), rien des autres fournisseurs. |
| Expédition | les envois qui lui sont attribués. |
| Fraul / équipe | tout. |

### 5. Fraul Finds : les demandes de pièces

Nouvelle table `concierge_requests` : `email`, `item`, `brand`, `size`, `link`, `note`, `status` (`new` → `searching` → `found` / `not_found` → `answered`), `assigned_to`, `found_offer_id`, `customer_id` (si connecté).
- **Écriture uniquement côté serveur** (clé service), après captcha Turnstile et limite de débit (ex. 5 demandes / heure / adresse IP). Aucune politique d'insertion pour `anon`.
- Le texte de la demande reste une **donnée** : jamais exécuté, jamais donné tel quel comme consigne à un outil ou une IA (règle anti-injection).
- Côté site, le formulaire existe déjà en démo (`/sur-demande` et le comptoir au centre du mall), avec la même vérification que le serveur fera (`src/models/concierge/request.ts`).

## SQL proposé (migration `0003`, **à valider par Serge, non appliquée**)

```sql
-- Offres fournisseurs : une variante peut être vendue par plusieurs fournisseurs.
create table supplier_offers (
  id            uuid primary key default gen_random_uuid(),
  variant_id    uuid not null references product_variants (id) on delete cascade,
  supplier_id   uuid not null references suppliers (id),
  supplier_ref  text,
  supplier_url  text,
  cost          integer not null check (cost >= 0),      -- unités mineures
  cost_currency char(3) not null default 'CNY',
  in_stock      boolean not null default true,
  lead_days     integer check (lead_days >= 0),
  priority      integer not null default 10,              -- 1 = référence (prix affiché)
  active        boolean not null default true,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (variant_id, supplier_id)
);
create index on supplier_offers (supplier_id);
create index on supplier_offers (variant_id) where active;
create trigger t_supplier_offers_updated before update on supplier_offers for each row execute function public.set_updated_at();

alter table order_items add column offer_id uuid references supplier_offers (id);
alter table shipments  add column handled_by uuid references auth.users (id);
create index on shipments (handled_by);

alter table supplier_offers enable row level security;
create policy "équipe gère"          on supplier_offers for all    using (public.is_team()) with check (public.is_team());
create policy "fournisseur voit les siennes" on supplier_offers for select using (supplier_id = private.my_supplier_id());
create policy "expédition voit ses envois" on shipments for select using (handled_by = auth.uid());

-- Fraul Finds : demandes de pièces (insertion par le serveur uniquement, après captcha et limite de débit).
create type concierge_status as enum ('new', 'searching', 'found', 'not_found', 'answered');
create table concierge_requests (
  id             uuid primary key default gen_random_uuid(),
  email          text not null check (char_length(email) <= 254),
  item           text not null check (char_length(item) between 3 and 160),
  brand          text check (char_length(brand) <= 60),
  size           text check (char_length(size) <= 20),
  link           text check (char_length(link) <= 500),
  note           text check (char_length(note) <= 1000),
  status         concierge_status not null default 'new',
  assigned_to    uuid references auth.users (id),
  found_offer_id uuid references supplier_offers (id),
  customer_id    uuid references customers (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on concierge_requests (status, created_at);
create trigger t_concierge_requests_updated before update on concierge_requests for each row execute function public.set_updated_at();
alter table concierge_requests enable row level security;
create policy "équipe gère" on concierge_requests for all using (public.is_team()) with check (public.is_team());
-- Pas de politique pour anon / authenticated : le client n'écrit ni ne lit cette table directement.
```

## Questions pour Serge

1. Choix automatique de l'offre (la moins chère en stock dans le délai) : d'accord, ou toujours au choix de Fraul au début ?
2. Le prix affiché vient du fournisseur de référence (`priority = 1`) : d'accord, ou plutôt du coût le plus haut des offres actives (plus prudent pour la marge) ?
3. La personne de l'expédition a-t-elle un compte à elle (rôle `courier`), ou passe-t-elle par le lien WeChat du portail (`docs/FOURNISSEUR-COMMANDES.md`) ?
