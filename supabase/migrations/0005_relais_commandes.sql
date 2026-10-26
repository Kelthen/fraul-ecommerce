-- 0005 — Relais des commandes par Telegram, colis attendus chez l'expéditeur, codes de suivi, fiche d'expédition.
-- Parcours validé par Serge et Rhamone le 19 oct. 2026 (docs/PARCOURS-COMMANDE.md §2, §6, §7).
-- Tout est écrit par le serveur (clé service) ; RLS activée, seule l'équipe lit.

-- Telegram devient un canal de notification (Jean Paul seulement).
alter type notify_channel add value if not exists 'telegram';

-- Commandes de démonstration : séparées des vraies, faciles à effacer.
alter table orders add column is_demo boolean not null default false;
-- Message Telegram envoyé à Fraul pour cette commande (pour mettre à jour ses boutons).
alter table orders add column relay_chat_id bigint;
alter table orders add column relay_message_id bigint;
alter table orders add column relayed_at timestamptz;

-- Fraîcheur des offres (garde-fou « prix périmé », §4).
alter table supplier_offers add column last_checked_at timestamptz;

-- Un code de suivi ne peut servir qu'à une seule commande (§2, codes de suivi).
create unique index shipments_tracking_unique on shipments (upper(tracking_code)) where tracking_code is not null;

-- Colis attendus par l'expéditeur : un par (commande × fournisseur).
create type parcel_status as enum ('expected', 'received', 'missing');
create table order_parcels (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders (id) on delete cascade,
  supplier_id  uuid not null references suppliers (id),
  status       parcel_status not null default 'expected',
  forwarded_at timestamptz,          -- Fraul a transféré le bloc au fournisseur
  received_at  timestamptz,          -- l'expéditeur a reçu le colis
  unique (order_id, supplier_id)
);
create index on order_parcels (status);

-- Codes de suivi proposés par Fraul (couple « FRL → code »), confirmés d'une touche, annulables 15 min.
create type tracking_submission_status as enum ('pending', 'confirmed', 'cancelled');
create table tracking_submissions (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders (id) on delete cascade,
  tracking_code text not null check (char_length(tracking_code) between 8 and 40),
  status        tracking_submission_status not null default 'pending',
  card_message_id bigint,            -- carte de vérification dans Telegram
  proposed_at   timestamptz not null default now(),
  confirmed_at  timestamptz,
  cancelled_at  timestamptz,
  customer_notified_at timestamptz   -- e-mail « En transit » envoyé après 15 min
);
create index on tracking_submissions (order_id, status);

-- Fiche d'expédition : lien secret qui expire, chaque ouverture enregistrée (§7.3).
create table shipping_sheets (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null unique references orders (id) on delete cascade,
  token      text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table shipping_sheet_views (
  id         bigint generated always as identity primary key,
  sheet_id   uuid not null references shipping_sheets (id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  user_agent text
);

alter table order_parcels        enable row level security;
alter table tracking_submissions enable row level security;
alter table shipping_sheets      enable row level security;
alter table shipping_sheet_views enable row level security;
create policy "équipe gère" on order_parcels        for all using (public.is_team()) with check (public.is_team());
create policy "équipe gère" on tracking_submissions for all using (public.is_team()) with check (public.is_team());
create policy "équipe gère" on shipping_sheets      for all using (public.is_team()) with check (public.is_team());
create policy "équipe lit"  on shipping_sheet_views for select using (public.is_team());
-- Pas de politique pour anon / authenticated : la fiche est lue par le serveur, après vérification du lien.
