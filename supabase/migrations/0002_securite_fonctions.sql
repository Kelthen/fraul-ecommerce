-- Fraul — sécurité des fonctions (retours du contrôle de sécurité Supabase, 13 oct. 2026).
--
-- 1. staff_role_of(uid) et my_supplier_id() étaient appelables par tout le monde via l'API
--    (/rest/v1/rpc/…) : n'importe qui pouvait demander le rôle d'un identifiant.
--    → déplacées dans le schéma `private`, que l'API n'expose pas. Les règles RLS qui
--    les utilisent suivent automatiquement (elles pointent la fonction, pas son nom).
-- 2. set_updated_at, is_admin, is_team n'avaient pas de search_path fixe.
--    → search_path vide et noms complets dans le corps.
-- public_tracking(token) reste public : c'est voulu (suivi par lien).

create schema if not exists private;
-- Les règles RLS s'exécutent avec les droits du visiteur : il doit pouvoir appeler ces fonctions,
-- mais l'API ne les voit pas.
grant usage on schema private to anon, authenticated;

alter function public.staff_role_of(uuid) set schema private;
alter function public.my_supplier_id() set schema private;

create or replace function private.staff_role_of(uid uuid) returns public.staff_role
  language sql stable security definer set search_path = '' as $$
  select role from public.staff where user_id = uid
$$;

create or replace function private.my_supplier_id() returns uuid
  language sql stable security definer set search_path = '' as $$
  select supplier_id from public.staff where user_id = auth.uid() and role = 'supplier'
$$;

create or replace function public.is_admin() returns boolean
  language sql stable set search_path = '' as $$
  select coalesce(private.staff_role_of(auth.uid()) = 'admin', false)
$$;

create or replace function public.is_team() returns boolean
  language sql stable set search_path = '' as $$
  select coalesce(private.staff_role_of(auth.uid()) in ('admin', 'ops'), false)
$$;

create or replace function public.set_updated_at() returns trigger
  language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;
