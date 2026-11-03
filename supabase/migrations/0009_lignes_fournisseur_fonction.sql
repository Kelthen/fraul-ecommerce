-- 0009 — Lignes de commande du fournisseur : une fonction à la place de la vue.
-- La vue supplier_order_lines (0004) tournait avec les droits de son créateur : le contrôle de sécurité
-- Supabase la signale en erreur (security_definer_view). Le site ne s'en sert pas encore.
-- Mêmes colonnes, toujours sans unit_price ni unit_cost ; chaque fournisseur ne reçoit que ses lignes.
drop view public.supplier_order_lines;

create function public.supplier_order_lines()
  returns table (id uuid, order_id uuid, number text, offer_id uuid, title text, color_name text,
                 size text, qty integer, status public.order_status, created_at timestamptz)
  language sql stable security definer set search_path = '' as $$
  select oi.id, oi.order_id, o.number, oi.offer_id, oi.title, oi.color_name, oi.size, oi.qty, o.status, o.created_at
  from public.order_items oi join public.orders o on o.id = oi.order_id
  where oi.supplier_id = private.my_supplier_id()
$$;
revoke all on function public.supplier_order_lines() from public, anon;
grant execute on function public.supplier_order_lines() to authenticated;
