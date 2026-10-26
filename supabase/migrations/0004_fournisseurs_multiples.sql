-- 0004 — Plusieurs fournisseurs par article, expédition, Fraul Finds.
-- Proposée par Rhamone (docs/FOURNISSEURS-MULTIPLES.md), corrigée et validée par Serge le 18 oct. 2026 ;
-- appliquée sur le projet Supabase fraul le 20 oct. 2026 (nom : fournisseurs_multiples).
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
-- ⛔ Faille 2 (Serge) : les politiques « livreur » de la 0001 ouvrent TOUS les envois à n'importe quel livreur ;
-- une nouvelle politique s'ajouterait en OU sans rien fermer. On les remplace.
drop policy "livreur lit"        on shipments;
drop policy "livreur met à jour" on shipments;
drop policy "livreur ajoute"     on shipment_events;
drop policy "livreur lit"        on shipment_events;
create policy "expédition lit ses envois"        on shipments for select using (handled_by = auth.uid());
create policy "expédition met à jour ses envois" on shipments for update using (handled_by = auth.uid()) with check (handled_by = auth.uid());
create policy "expédition lit ses événements"    on shipment_events for select
  using (exists (select 1 from shipments s where s.id = shipment_id and s.handled_by = auth.uid()));
create policy "expédition ajoute ses événements" on shipment_events for insert
  with check (exists (select 1 from shipments s where s.id = shipment_id and s.handled_by = auth.uid()));

-- ⛔ Faille 1 (Serge) : la RLS filtre des lignes, pas des colonnes. Avec « mes lignes fournisseur » (0001), le
-- fournisseur lisait unit_price (prix payé par le client) et unit_cost. Il lit désormais une vue sans ces colonnes.
drop policy "mes lignes fournisseur" on order_items;
create view public.supplier_order_lines with (security_barrier) as
  select oi.id, oi.order_id, o.number, oi.offer_id, oi.title, oi.color_name, oi.size, oi.qty, o.status, o.created_at
  from order_items oi join orders o on o.id = oi.order_id
  where oi.supplier_id = private.my_supplier_id();
revoke all on public.supplier_order_lines from anon;
grant select on public.supplier_order_lines to authenticated;
-- Si le contrôle de sécurité Supabase signale la vue, la remplacer par une fonction RPC qui renvoie les mêmes colonnes.

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
