-- 0014 — Connexion à l'admin par e-mail (plan de Rhamone, 4 nov. 2026) : un code à 6 chiffres par adresse autorisée.
-- Le nombre d'essais vit ici et pas dans un cookie : un cookie se rejoue, et on pourrait essayer tous les codes.
-- Aucun accès avec la clé publique : seul le serveur (clé service) lit et écrit cette table.
create table admin_login_codes (
  email      text primary key,
  code_hash  text not null,
  attempts   integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table admin_login_codes enable row level security;
revoke all on admin_login_codes from anon, authenticated;
