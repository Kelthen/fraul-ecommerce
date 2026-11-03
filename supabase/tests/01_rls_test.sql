\set ON_ERROR_STOP 1
select 'tables: '||count(*) from pg_tables where schemaname='public';
select 'sans RLS: '||count(*) from pg_tables where schemaname='public' and not rowsecurity;
select 'regles: '||count(*) from pg_policies;
-- Données de test (en superutilisateur, comme le serveur)
insert into auth.users values ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222'), ('33333333-3333-3333-3333-333333333333');
insert into customer_groups (id, name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Cercle TakeUrClothes');
insert into customers (id, email) values ('11111111-1111-1111-1111-111111111111', 'a@test'), ('22222222-2222-2222-2222-222222222222', 'b@test');
insert into brands (id, slug, name) values ('bbbbbbbb-0000-0000-0000-000000000001', 'nike', 'Nike');
insert into categories (id, code, slug, name, slot) values ('cccccccc-0000-0000-0000-000000000001', 'tee', 't-shirts', '{"fr":"T-shirts"}', 'top');
insert into products (slug, brand_id, category_id, title, status) values ('p-actif', 'bbbbbbbb-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', '{"fr":"A"}', 'active'), ('p-brouillon', 'bbbbbbbb-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', '{"fr":"B"}', 'draft');
insert into orders (id, customer_id, email, currency, subtotal, total, price_snapshot, shipping_address, terms_version)
  values ('dddddddd-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a@test', 'USD', 1000, 1000, '{}', '{}', 'v1');
insert into shipments (order_id, carrier, tracking_code) values ('dddddddd-0000-0000-0000-000000000001', 'DHL', 'X1');
select 'numéro de commande: '||number from orders;

-- Visiteur anonyme
set role anon;
select 'anon voit produits: '||count(*) from products;          -- attendu 1 (pas le brouillon)
select 'anon voit commandes: '||count(*) from orders;           -- attendu 0
select 'anon suivi par lien: '||count(*) from public_tracking((select public_token from shipments limit 1)); -- 0 : anon ne lit pas shipments
reset role;
select 'suivi par lien (vrai jeton): '||order_number from public_tracking((select public_token from shipments limit 1));
set role anon;
select 'suivi faux jeton: '||count(*) from public_tracking('faux');  -- attendu 0
reset role;

-- Client A
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'A voit commandes: '||count(*) from orders;               -- attendu 1
select 'A voit clients: '||count(*) from customers;              -- attendu 1 (lui-même)
update customers set phone = '123' where id = auth.uid();
select 'A modifie son téléphone: ok';
do $$ begin
  begin update customers set group_id = 'aaaaaaaa-0000-0000-0000-000000000001' where id = auth.uid(); raise notice 'ECHEC: A a changé son groupe';
  exception when insufficient_privilege then raise notice 'OK: A ne peut pas changer son groupe de prix'; end;
  begin insert into orders (customer_id, email, currency, subtotal, total, price_snapshot, shipping_address, terms_version) values (auth.uid(), 'x', 'USD', 1, 1, '{}', '{}', 'v1'); raise notice 'ECHEC: A a créé une commande';
  exception when insufficient_privilege then raise notice 'OK: A ne peut pas créer de commande lui-même'; end;
  begin insert into price_rules (scope, currency) values ('global', 'USD'); raise notice 'ECHEC: A a créé une règle de prix';
  exception when insufficient_privilege then raise notice 'OK: A ne peut pas toucher aux prix'; end;
end $$;
reset role;

-- Client B
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'B voit commandes de A: '||count(*) from orders;          -- attendu 0
select 'B voit expéditions de A: '||count(*) from shipments;     -- attendu 0
reset role;

-- Admin
insert into staff (user_id, role) values ('33333333-3333-3333-3333-333333333333', 'admin');
set role authenticated; set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'admin voit produits (brouillon compris): '||count(*) from products; -- attendu 2
select 'admin voit commandes: '||count(*) from orders;           -- attendu 1
reset role;

-- Fonctions internes hors de l'API (migration 0002)
select 'fonctions internes dans public: '||count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('staff_role_of', 'my_supplier_id'); -- attendu 0

-- Livreur et fournisseur (les règles passent par private.staff_role_of / private.my_supplier_id)
insert into auth.users values ('44444444-4444-4444-4444-444444444444'), ('55555555-5555-5555-5555-555555555555');
insert into suppliers (id, name) values ('eeeeeeee-0000-0000-0000-000000000001', 'Fournisseur test');
insert into staff (user_id, role) values ('44444444-4444-4444-4444-444444444444', 'courier');
insert into staff (user_id, role, supplier_id) values ('55555555-5555-5555-5555-555555555555', 'supplier', 'eeeeeeee-0000-0000-0000-000000000001');
insert into product_variants (id, product_id, sku, color_name, size, supplier_cost)
  select 'ffffffff-0000-0000-0000-000000000001', id, 'SKU-1', 'Noir', 'M', 6000 from products where slug = 'p-actif';
insert into order_items (order_id, variant_id, supplier_id, title, color_name, size, qty, unit_price, unit_cost)
  values ('dddddddd-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 'A', 'Noir', 'M', 1, 1000, 6000);
set role authenticated; set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select 'livreur voit expéditions non attribuées: '||count(*) from shipments;     -- attendu 0 (0004)
select 'livreur voit commandes: '||count(*) from orders;          -- attendu 0
reset role;
set role authenticated; set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
select 'fournisseur lit order_items en direct: '||count(*) from order_items; -- attendu 0 (0004)
select 'fournisseur voit commandes: '||count(*) from orders;      -- attendu 0
reset role;

-- Migrations 0004 et 0009 : fournisseurs multiples, expédition, Finds (docs/FOURNISSEURS-MULTIPLES.md, demandé par Serge)
insert into auth.users values ('66666666-6666-6666-6666-666666666666'), ('77777777-7777-7777-7777-777777777777');
insert into suppliers (id, name) values ('eeeeeeee-0000-0000-0000-000000000002', 'Autre fournisseur');
insert into staff (user_id, role) values ('66666666-6666-6666-6666-666666666666', 'courier');
insert into staff (user_id, role, supplier_id) values ('77777777-7777-7777-7777-777777777777', 'supplier', 'eeeeeeee-0000-0000-0000-000000000002');
update shipments set handled_by = '44444444-4444-4444-4444-444444444444';
select set_config('test.shipment', (select id::text from shipments limit 1), false) is not null as _ \gset
insert into supplier_offers (variant_id, supplier_id, cost) values ('ffffffff-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 6000);
insert into concierge_requests (email, item) values ('c@test', 'Une pièce rare');

-- Fournisseur : ses lignes par la fonction, jamais les prix
set role authenticated; set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
do $$ begin
  if (select count(*) from public.supplier_order_lines()) = 1 then raise notice 'OK: le fournisseur reçoit sa ligne'; else raise notice 'ECHEC: le fournisseur ne reçoit pas sa ligne'; end if;
  if (select count(*) from order_items) = 0 then raise notice 'OK: le fournisseur ne lit pas order_items en direct (ni unit_price, ni unit_cost)'; else raise notice 'ECHEC: le fournisseur lit order_items'; end if;
  if (select count(*) from supplier_offers) = 1 then raise notice 'OK: le fournisseur voit son offre'; else raise notice 'ECHEC: offre du fournisseur'; end if;
end $$;
reset role;
do $$ begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'supplier_order_lines'
               and pg_get_function_result(p.oid) ~ 'unit_(price|cost)') then
    raise notice 'ECHEC: la fonction expose un prix';
  else raise notice 'OK: la fonction ne renvoie ni unit_price ni unit_cost'; end if;
end $$;

-- Autre fournisseur : rien
set role authenticated; set request.jwt.claim.sub = '77777777-7777-7777-7777-777777777777';
do $$ begin
  if (select count(*) from public.supplier_order_lines()) = 0 then raise notice 'OK: un autre fournisseur ne reçoit aucune ligne'; else raise notice 'ECHEC: fuite de lignes vers un autre fournisseur'; end if;
  if (select count(*) from supplier_offers) = 0 then raise notice 'OK: un autre fournisseur ne voit pas les offres'; else raise notice 'ECHEC: fuite d''offres'; end if;
end $$;
reset role;

-- Visiteur : pas d'appel à la fonction
set role anon;
do $$ begin
  begin perform public.supplier_order_lines(); raise notice 'ECHEC: un visiteur appelle supplier_order_lines';
  exception when insufficient_privilege then raise notice 'OK: un visiteur ne peut pas appeler supplier_order_lines'; end;
end $$;
reset role;

-- Livreur attribué : lit et met à jour son envoi, ajoute un événement
set role authenticated; set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
do $$ declare n int; begin
  if (select count(*) from shipments) = 1 then raise notice 'OK: le livreur attribué lit son envoi'; else raise notice 'ECHEC: le livreur attribué ne lit pas son envoi'; end if;
  update shipments set status = 'shipped'; get diagnostics n = row_count;
  if n = 1 then raise notice 'OK: le livreur attribué met à jour son envoi'; else raise notice 'ECHEC: mise à jour du livreur attribué'; end if;
  insert into shipment_events (shipment_id, status, occurred_at) select id, 'shipped', now() from shipments;
  raise notice 'OK: le livreur attribué ajoute un événement';
end $$;
reset role;

-- Autre livreur : ni lecture, ni mise à jour, ni événement
set role authenticated; set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';
do $$ declare n int; begin
  if (select count(*) from shipments) = 0 then raise notice 'OK: un autre livreur ne lit pas cet envoi'; else raise notice 'ECHEC: un autre livreur lit cet envoi'; end if;
  if (select count(*) from shipment_events) = 0 then raise notice 'OK: un autre livreur ne lit pas ses événements'; else raise notice 'ECHEC: un autre livreur lit les événements'; end if;
  update shipments set status = 'delivered'; get diagnostics n = row_count;
  if n = 0 then raise notice 'OK: un autre livreur ne modifie pas cet envoi'; else raise notice 'ECHEC: un autre livreur a modifié cet envoi'; end if;
  begin
    insert into shipment_events (shipment_id, status, occurred_at) values (current_setting('test.shipment')::uuid, 'delivered', now());
    raise notice 'ECHEC: un autre livreur a ajouté un événement';
  exception when insufficient_privilege then raise notice 'OK: un autre livreur n''ajoute pas d''événement'; end;
end $$;
reset role;

-- Client : rien sur les offres ni sur les demandes Finds
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$ begin
  if (select count(*) from supplier_offers) = 0 then raise notice 'OK: un client ne lit pas supplier_offers'; else raise notice 'ECHEC: un client lit supplier_offers'; end if;
  if (select count(*) from concierge_requests) = 0 then raise notice 'OK: un client ne lit pas concierge_requests'; else raise notice 'ECHEC: un client lit concierge_requests'; end if;
  begin
    insert into concierge_requests (email, item) values ('x@test', 'Essai direct');
    raise notice 'ECHEC: un client écrit dans concierge_requests';
  exception when insufficient_privilege then raise notice 'OK: un client n''écrit pas dans concierge_requests'; end;
end $$;
reset role;
