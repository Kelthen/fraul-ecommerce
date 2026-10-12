-- Fraul — schéma initial (Supabase / PostgreSQL 15+).
-- Base vide : aucune donnée n'est insérée ici.
--
-- Principes (voir docs/ARCHITECTURE.md) :
--   * argent en entiers (unités mineures) + code devise ;
--   * prix TOUJOURS calculés côté serveur, jamais lus depuis le navigateur ;
--   * sécurité ligne par ligne (RLS) activée sur toutes les tables ;
--   * les commandes, paiements et expéditions sont écrits par le serveur
--     (clé service, qui contourne la RLS), jamais directement par le client ;
--   * une commande garde une copie figée de ce qui a été acheté.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions; -- gen_random_bytes (liens de suivi)

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type product_status   as enum ('draft', 'active', 'archived');
create type image_view       as enum ('front', 'back', 'detail');
create type outfit_slot      as enum ('top', 'bottom', 'shoes', 'accessory');
create type staff_role       as enum ('admin', 'ops', 'supplier', 'courier');
create type price_scope      as enum ('global', 'country', 'group', 'customer', 'brand', 'category');
create type order_status     as enum ('pending_payment', 'paid', 'sent_to_supplier', 'supplier_confirmed',
                                      'shipped', 'in_transit', 'customs', 'out_for_delivery', 'delivered',
                                      'cancelled', 'refunded');
create type payment_status   as enum ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded');
create type shipment_status  as enum ('label_created', 'shipped', 'in_transit', 'customs', 'out_for_delivery',
                                      'delivered', 'exception');
create type event_source     as enum ('manual', 'carrier_api');
create type notify_channel   as enum ('email', 'wechat', 'whatsapp', 'slack');
create type notify_status    as enum ('pending', 'sent', 'failed');
create type consent_type     as enum ('terms', 'privacy', 'marketing', 'cookies');

-- ---------------------------------------------------------------------------
-- Outils
-- ---------------------------------------------------------------------------
create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Équipe et partenaires
-- ---------------------------------------------------------------------------
create table suppliers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  site_url      text,
  contact_wechat text,
  feed_config   jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table staff (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  role        staff_role not null,
  supplier_id uuid references suppliers (id),
  created_at  timestamptz not null default now(),
  constraint supplier_needs_link check (role <> 'supplier' or supplier_id is not null)
);

-- Rôle de l'utilisateur connecté (security definer : lisible même sous RLS).
create function staff_role_of(uid uuid) returns staff_role
  language sql stable security definer set search_path = public as $$
  select role from staff where user_id = uid
$$;

create function is_admin() returns boolean language sql stable as $$
  select coalesce(staff_role_of(auth.uid()) = 'admin', false)
$$;

create function is_team() returns boolean language sql stable as $$
  select coalesce(staff_role_of(auth.uid()) in ('admin', 'ops'), false)
$$;

create function my_supplier_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select supplier_id from staff where user_id = auth.uid() and role = 'supplier'
$$;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table brands (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  style         jsonb not null default '{}',   -- gabarit de boutique : couleurs, police, enseigne
  in_walk       boolean not null default false, -- boutique présente dans le mall du Fraul Walk
  walk_position integer,                        -- place dans le parcours du mall
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Preuves d'authenticité (factures, autorisations). Jamais publiques.
create table brand_documents (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references brands (id) on delete cascade,
  kind        text not null,                    -- facture, autorisation, licence fournisseur…
  storage_path text not null,
  note        text,
  uploaded_by uuid references auth.users (id),
  created_at  timestamptz not null default now()
);

create table categories (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,              -- tee, hoodie, pants, sneaker, cap, bag
  slug       text not null unique,
  name       jsonb not null,                    -- {"fr": "...", "en": "..."}
  slot       outfit_slot not null,
  sizes      text[] not null default '{}',
  position   integer not null default 0,
  parent_id  uuid references categories (id)
);

create table products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  brand_id        uuid not null references brands (id),
  category_id     uuid not null references categories (id),
  supplier_id     uuid references suppliers (id),
  supplier_ref    text,
  title           jsonb not null,               -- réécrit (pas copié du fournisseur : SEO)
  description     jsonb not null default '{}',
  seo_title       jsonb,
  seo_description jsonb,
  status          product_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (supplier_id, supplier_ref)
);
create index on products (brand_id, status);
create index on products (category_id, status);

create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  color      text,                              -- variante de couleur concernée (null = toutes)
  view       image_view not null,
  path       text not null,                     -- photo détourée, optimisée (< 200 Ko)
  position   integer not null default 0,
  alt        jsonb not null default '{}'
);
create index on product_images (product_id);

create table product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products (id) on delete cascade,
  sku           text not null unique,
  color_name    text not null,
  color_hex     text,
  size          text not null,
  supplier_cost integer not null check (supplier_cost >= 0), -- coût fournisseur, unités mineures
  cost_currency char(3) not null default 'CNY',
  weight_g      integer,
  available     boolean not null default true,
  unique (product_id, color_name, size)
);

create table size_charts (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references brands (id) on delete cascade,
  category_id uuid not null references categories (id),
  chart       jsonb not null,                   -- mesures et équivalences de pointures
  unique (brand_id, category_id)
);

-- Drops et collections (Drop 001, « bientôt »…)
create table collections (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         jsonb not null,
  starts_at    timestamptz,
  ends_at      timestamptz,
  limited_qty  integer check (limited_qty is null or limited_qty > 0),
  published    boolean not null default false,
  created_at   timestamptz not null default now()
);
create table collection_products (
  collection_id uuid not null references collections (id) on delete cascade,
  product_id    uuid not null references products (id) on delete cascade,
  position      integer not null default 0,
  primary key (collection_id, product_id)
);

create table supplier_sync_runs (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers (id),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  status      text not null default 'running',
  stats       jsonb not null default '{}',      -- ajoutés / modifiés / disparus
  error       text
);

-- ---------------------------------------------------------------------------
-- Prix personnalisés
-- ---------------------------------------------------------------------------
create table customer_groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,              -- ex. « Cercle Fraul »
  created_at timestamptz not null default now()
);

create table fx_rates (
  base       char(3) not null,
  quote      char(3) not null,
  rate       numeric(18, 8) not null check (rate > 0),
  fetched_at timestamptz not null default now(),
  primary key (base, quote, fetched_at)
);

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
create table customers (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  phone      text,
  whatsapp   text,
  country    char(2),                           -- adresse de livraison (logistique), jamais affiché
  locale     text not null default 'fr',
  currency   char(3),
  group_id   uuid references customer_groups (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table price_rules (
  id           uuid primary key default gen_random_uuid(),
  scope        price_scope not null,
  country      char(2),
  group_id     uuid references customer_groups (id),
  customer_id  uuid references customers (id) on delete cascade,
  brand_id     uuid references brands (id),
  category_id  uuid references categories (id),
  coefficient  numeric(8, 4) not null default 1 check (coefficient > 0),
  fixed_markup integer not null default 0,      -- unités mineures de `currency`
  rounding     integer,                         -- ex. 90 pour finir en ,90
  currency     char(3) not null,
  priority     integer not null default 0,
  valid_from   timestamptz,
  valid_to     timestamptz,
  created_at   timestamptz not null default now(),
  constraint scope_target check (
    (scope = 'global') or
    (scope = 'country'  and country is not null) or
    (scope = 'group'    and group_id is not null) or
    (scope = 'customer' and customer_id is not null) or
    (scope = 'brand'    and brand_id is not null) or
    (scope = 'category' and category_id is not null)
  )
);

create table addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  full_name   text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  region      text,
  postal_code text,
  country     char(2) not null,
  phone       text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table legal_documents (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null,                   -- cgv, confidentialite, retours…
  version      text not null,
  locale       text not null default 'fr',
  content      text not null,
  published_at timestamptz,
  unique (kind, version, locale)
);

create table consents (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  kind        consent_type not null,
  document_id uuid references legal_documents (id),
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

create table wishlists (
  customer_id uuid not null references customers (id) on delete cascade,
  product_id  uuid not null references products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (customer_id, product_id)
);

-- « Crée ta tenue » enregistrée
create table outfits (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  name        text,
  created_at  timestamptz not null default now()
);
create table outfit_items (
  outfit_id  uuid not null references outfits (id) on delete cascade,
  slot       outfit_slot not null,
  variant_id uuid not null references product_variants (id),
  primary key (outfit_id, slot)
);

-- ---------------------------------------------------------------------------
-- Panier et commandes
-- ---------------------------------------------------------------------------
create table carts (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references customers (id) on delete cascade,
  session_key text unique,                      -- panier anonyme (cookie signé côté serveur)
  updated_at  timestamptz not null default now(),
  constraint cart_owner check (customer_id is not null or session_key is not null)
);
create table cart_items (
  cart_id    uuid not null references carts (id) on delete cascade,
  variant_id uuid not null references product_variants (id),
  qty        integer not null check (qty between 1 and 20),
  primary key (cart_id, variant_id)
  -- pas de prix ici : recalculé à chaque affichage
);

create sequence order_number_seq;

create table orders (
  id               uuid primary key default gen_random_uuid(),
  number           text not null unique
                     default 'FRL-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 6, '0'),
  customer_id      uuid references customers (id),
  email            text not null,               -- commande possible sans compte
  status           order_status not null default 'pending_payment',
  currency         char(3) not null,
  subtotal         integer not null check (subtotal >= 0),
  shipping         integer not null default 0 check (shipping >= 0),
  duties           integer not null default 0 check (duties >= 0),
  tax              integer not null default 0 check (tax >= 0),
  total            integer not null check (total >= 0),
  price_snapshot   jsonb not null,              -- règles de prix appliquées, copie figée
  shipping_address jsonb not null,              -- copie figée de l'adresse
  terms_version    text not null,               -- version des CGV acceptée
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint total_matches check (total = subtotal + shipping + duties + tax)
);
create index on orders (customer_id, created_at desc);
create index on orders (status);

create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders (id) on delete cascade,
  variant_id uuid not null references product_variants (id),
  supplier_id uuid references suppliers (id),   -- copie : permet au fournisseur de voir SES lignes
  title      text not null,                     -- copie figée
  color_name text not null,
  size       text not null,
  qty        integer not null check (qty > 0),
  unit_price integer not null check (unit_price >= 0),
  unit_cost  integer not null check (unit_cost >= 0)
);
create index on order_items (order_id);
create index on order_items (supplier_id);

create table payments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders (id),
  provider     text not null,                   -- stripe (ou shopify si hybride)
  provider_ref text not null unique,
  amount       integer not null,
  currency     char(3) not null,
  status       payment_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Webhooks : un événement reçu deux fois n'est traité qu'une fois.
create table payment_events (
  provider_event_id text primary key,
  provider          text not null,
  payload           jsonb not null,
  received_at       timestamptz not null default now(),
  processed_at      timestamptz
);

-- ---------------------------------------------------------------------------
-- Logistique et suivi
-- ---------------------------------------------------------------------------
create table shipments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders (id),
  carrier       text,
  tracking_code text,
  public_token  text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  status        shipment_status not null default 'label_created',
  shipped_at    timestamptz,
  delivered_at  timestamptz,
  created_by    uuid references auth.users (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on shipments (order_id);

create table shipment_events (
  id          uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments (id) on delete cascade,
  status      shipment_status not null,
  location    text,
  note        text,
  occurred_at timestamptz not null,
  source      event_source not null default 'manual'
);
create index on shipment_events (shipment_id, occurred_at);

-- Suivi public par lien : renvoie seulement ce que le client doit voir.
create function public_tracking(token text)
  returns table (order_number text, status shipment_status, carrier text, tracking_code text,
                 events jsonb)
  language sql stable security definer set search_path = public as $$
  select o.number, s.status, s.carrier, s.tracking_code,
         coalesce((select jsonb_agg(jsonb_build_object('status', e.status, 'location', e.location,
                                                       'at', e.occurred_at) order by e.occurred_at)
                   from shipment_events e where e.shipment_id = s.id), '[]'::jsonb)
  from shipments s join orders o on o.id = s.order_id
  where s.public_token = token
$$;

-- ---------------------------------------------------------------------------
-- Notifications et traçabilité
-- ---------------------------------------------------------------------------
create table notifications_outbox (
  id          uuid primary key default gen_random_uuid(),
  channel     notify_channel not null,
  recipient   text not null,
  payload     jsonb not null,
  status      notify_status not null default 'pending',
  attempts    integer not null default 0,
  last_error  text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create index on notifications_outbox (status, created_at);

create table audit_log (
  id         bigint generated always as identity primary key,
  actor      uuid references auth.users (id),
  action     text not null,
  entity     text not null,
  entity_id  text,
  diff       jsonb,
  at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Horodatage automatique
-- ---------------------------------------------------------------------------
create trigger t_brands_updated    before update on brands    for each row execute function set_updated_at();
create trigger t_products_updated  before update on products  for each row execute function set_updated_at();
create trigger t_customers_updated before update on customers for each row execute function set_updated_at();
create trigger t_orders_updated    before update on orders    for each row execute function set_updated_at();
create trigger t_payments_updated  before update on payments  for each row execute function set_updated_at();
create trigger t_shipments_updated before update on shipments for each row execute function set_updated_at();
create trigger t_suppliers_updated before update on suppliers for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Sécurité ligne par ligne (RLS)
-- Par défaut tout est fermé ; on ouvre explicitement ce qui doit l'être.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'suppliers','staff','brands','brand_documents','categories','products','product_images',
    'product_variants','size_charts','collections','collection_products','supplier_sync_runs',
    'customer_groups','fx_rates','customers','price_rules','addresses','legal_documents','consents',
    'wishlists','outfits','outfit_items','carts','cart_items','orders','order_items','payments',
    'payment_events','shipments','shipment_events','notifications_outbox','audit_log'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Catalogue public : seulement ce qui est publié.
create policy "catalogue lisible"  on brands           for select using (active);
create policy "catalogue lisible"  on categories       for select using (true);
create policy "catalogue lisible"  on products         for select using (status = 'active');
create policy "catalogue lisible"  on product_images   for select using (exists (select 1 from products p where p.id = product_id and p.status = 'active'));
create policy "catalogue lisible"  on product_variants for select using (exists (select 1 from products p where p.id = product_id and p.status = 'active'));
create policy "catalogue lisible"  on size_charts      for select using (true);
create policy "drops publiés"      on collections      for select using (published);
create policy "drops publiés"      on collection_products for select using (exists (select 1 from collections c where c.id = collection_id and c.published));
create policy "textes publiés"     on legal_documents  for select using (published_at is not null and published_at <= now());

-- Gestion du catalogue : équipe (admin + ops).
create policy "équipe gère" on brands             for all using (is_team()) with check (is_team());
create policy "équipe gère" on categories         for all using (is_team()) with check (is_team());
create policy "équipe gère" on products           for all using (is_team()) with check (is_team());
create policy "équipe gère" on product_images     for all using (is_team()) with check (is_team());
create policy "équipe gère" on product_variants   for all using (is_team()) with check (is_team());
create policy "équipe gère" on size_charts        for all using (is_team()) with check (is_team());
create policy "équipe gère" on collections        for all using (is_team()) with check (is_team());
create policy "équipe gère" on collection_products for all using (is_team()) with check (is_team());
create policy "équipe gère" on legal_documents    for all using (is_team()) with check (is_team());
create policy "équipe gère" on supplier_sync_runs for all using (is_team()) with check (is_team());
create policy "équipe gère" on suppliers          for all using (is_team()) with check (is_team());
create policy "équipe gère" on brand_documents    for all using (is_team()) with check (is_team());
create policy "équipe gère" on shipments          for all using (is_team()) with check (is_team());
create policy "équipe gère" on shipment_events    for all using (is_team()) with check (is_team());

-- Réservé à l'administration (prix, groupes, staff, journal).
create policy "admin gère"  on price_rules      for all using (is_admin()) with check (is_admin());
create policy "admin gère"  on customer_groups  for all using (is_admin()) with check (is_admin());
create policy "admin gère"  on fx_rates         for all using (is_admin()) with check (is_admin());
create policy "admin gère"  on staff            for all using (is_admin()) with check (is_admin());
create policy "admin lit"   on audit_log        for select using (is_admin());
create policy "admin lit"   on notifications_outbox for select using (is_admin());
create policy "admin lit"   on payment_events   for select using (is_admin());
create policy "équipe lit"  on payments         for select using (is_team());
create policy "équipe lit"  on orders           for select using (is_team());
create policy "équipe lit"  on order_items      for select using (is_team());
create policy "équipe lit"  on customers        for select using (is_team());
create policy "moi"         on staff            for select using (user_id = auth.uid());

-- Clients : uniquement leurs propres données.
create policy "mon profil (lecture)" on customers for select using (id = auth.uid());
create policy "mon profil (modification)" on customers for update using (id = auth.uid()) with check (id = auth.uid());
-- Un client ne modifie que ses coordonnées, jamais son groupe de prix.
revoke update on customers from authenticated;
grant update (email, phone, whatsapp, locale, currency, country) on customers to authenticated;
create policy "mes adresses" on addresses for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "mes favoris"  on wishlists for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "mes tenues"   on outfits   for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "mes tenues"   on outfit_items for all
  using (exists (select 1 from outfits o where o.id = outfit_id and o.customer_id = auth.uid()))
  with check (exists (select 1 from outfits o where o.id = outfit_id and o.customer_id = auth.uid()));
create policy "mes consentements (lecture)" on consents for select using (customer_id = auth.uid());
create policy "mes consentements (ajout)" on consents for insert with check (customer_id = auth.uid());
create policy "mon panier"   on carts      for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "mon panier"   on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.customer_id = auth.uid()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.customer_id = auth.uid()));
create policy "mes commandes" on orders      for select using (customer_id = auth.uid());
create policy "mes commandes" on order_items for select using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "mes commandes" on shipments   for select using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "mes commandes" on shipment_events for select using (exists (
  select 1 from shipments s join orders o on o.id = s.order_id where s.id = shipment_id and o.customer_id = auth.uid()));

-- Fournisseur : voit uniquement les lignes de commande de SES produits.
create policy "mes lignes fournisseur" on order_items for select using (supplier_id = my_supplier_id());

-- Livreur : voit et met à jour les expéditions, sans accès aux prix ni aux clients.
create policy "livreur lit"     on shipments       for select using (staff_role_of(auth.uid()) = 'courier');
create policy "livreur met à jour" on shipments    for update using (staff_role_of(auth.uid()) = 'courier') with check (staff_role_of(auth.uid()) = 'courier');
create policy "livreur ajoute"  on shipment_events for insert with check (staff_role_of(auth.uid()) = 'courier');
create policy "livreur lit"     on shipment_events for select using (staff_role_of(auth.uid()) = 'courier');

-- Le suivi public passe par la fonction public_tracking(token), jamais par les tables.
revoke all on function public_tracking(text) from public;
grant execute on function public_tracking(text) to anon, authenticated;
