-- 0016 — Double vérification de l'admin (demande de Rhamone, 5 nov. 2026) : le secret de l'application
-- d'authentification de chaque admin, chiffré par le serveur. Aucun accès avec la clé publique.
-- last_step : dernier code accepté, pour qu'un code déjà utilisé ne resserve pas.
create table admin_totp (
  email        text primary key,
  secret_enc   text not null,
  confirmed_at timestamptz,
  last_step    bigint not null default 0,
  created_at   timestamptz not null default now()
);
alter table admin_totp enable row level security;
revoke all on admin_totp from anon, authenticated;
