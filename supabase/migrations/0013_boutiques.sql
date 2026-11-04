-- Boutiques gérées par Jean Paul depuis l'admin (Serge, 4 nov. 2026) : logo envoyé par lui, couleur, place, masquage.
-- Seules les marques qui ont des articles restent : il ajoutera les autres quand il aura leurs produits.

alter table brands add column if not exists logo_url text;

delete from brands b
where not exists (select 1 from products p where p.brand_id = b.id)
  and not exists (select 1 from brand_documents d where d.brand_id = b.id);

-- Places qui se suivent, dans l'ordre actuel du mall.
with ranked as (select id, row_number() over (order by walk_position nulls last, name) - 1 as place from brands)
update brands b set walk_position = r.place from ranked r where r.id = b.id;
