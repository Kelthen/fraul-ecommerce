-- 0015 — Limites d'essais (demande de Rhamone, 5 nov. 2026) : un compteur par action et par visiteur.
-- Le visiteur n'y est jamais en clair (empreinte de l'adresse IP, voir src/lib/server/limits.ts).
-- Aucun accès avec la clé publique : seul le serveur (clé service) appelle la fonction.
create table rate_limits (
  key      text primary key,
  hits     integer not null,
  reset_at timestamptz not null
);
alter table rate_limits enable row level security;
revoke all on rate_limits from anon, authenticated;

-- Compte un essai et dit s'il reste permis. Une seule instruction : deux essais en même temps comptent pour deux.
create function take_rate_limit(p_key text, p_max integer, p_seconds integer) returns boolean
language plpgsql
set search_path = ''
as $$
declare n integer;
begin
  insert into public.rate_limits as r (key, hits, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_seconds))
  on conflict (key) do update set
    hits = case when r.reset_at <= now() then 1 else r.hits + 1 end,
    reset_at = case when r.reset_at <= now() then excluded.reset_at else r.reset_at end
  returning hits into n;
  return n <= p_max;
end
$$;
revoke all on function take_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function take_rate_limit(text, integer, integer) to service_role;
