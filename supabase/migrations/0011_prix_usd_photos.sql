-- 0011 — Admin des articles (Rhamone, 4 nov. 2026 ; réponses de Serge du 3 nov.) :
-- Jean Paul tape le prix de vente en dollars (droits et livraison compris), converti par zone sur le site.
-- Le coût en ¥ reste obligatoire dans l'admin (prix plancher R5, alerte de marge à 10 %).
alter table products add column price_usd integer check (price_usd > 0); -- en cents

-- Photos ajoutées depuis l'admin : dossier public « produits » du stockage Supabase.
-- Écriture par le serveur seulement (clé service) ; lecture publique (photos du site).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produits', 'produits', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
