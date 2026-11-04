// Écrit le SQL qui recopie dans la base les marques, les catégories et les VRAIS articles du code
// (src/lib/catalog/supplier.ts, avec leurs photos). Les articles de démo restent dans le code.
// Chaque ligne est mise à jour si elle existe déjà (par son slug ou son code).
// Usage : node scripts/catalogue-sql.mjs > /tmp/catalogue.sql, puis exécuter ce SQL sur Supabase.
// ⚠️ Un article du code déjà modifié dans l'admin serait réécrit : à ne relancer que pour un import neuf.
import { register } from "node:module";

// Le code du site importe ses fichiers sans extension (« ./brands ») : on ajoute « .ts » pour Node.
register(
  "data:text/javascript," +
    encodeURIComponent(`export async function resolve(s, c, next) {
      try { return await next(s, c); } catch (e) {
        if (s.startsWith(".") && !s.endsWith(".ts")) return next(s + ".ts", c);
        throw e;
      }
    }`),
);

const { BRANDS, CATEGORIES, PRODUCTS } = await import("../src/lib/catalog/demo.ts");
const { WALK_BRANDS } = await import("../src/lib/catalog/brands.ts");

const q = (v) => `'${String(v).replaceAll("'", "''")}'`;
const cat = (id) => CATEGORIES.find((c) => c.id === id);
const data = {
  brands: BRANDS.map((b) => ({ slug: b.slug, name: b.name, style: b.style, in_walk: b.inWalk, walk_position: WALK_BRANDS.indexOf(b.name) })),
  categories: CATEGORIES.map((c, i) => ({ code: c.id, slug: c.slug, name: { fr: c.label }, slot: c.slot, sizes: c.sizes, position: i })),
  products: PRODUCTS.filter((p) => p.image).map((p, i) => ({
    slug: p.slug,
    brand: p.brandSlug,
    category: p.category,
    title: { fr: p.name },
    cost: Math.round(p.cost.cny * 100),
    weight_g: Math.round(p.cost.g),
    colors: p.colors,
    sizes: p.sizes.join("|") === cat(p.category).sizes.join("|") ? null : p.sizes,
    position: i,
    images: [["front", p.image.front], ...(p.image.back ? [["back", p.image.back]] : []), ...p.image.details.map((d) => ["detail", d])],
  })),
};

console.log(`begin;
create temp table src on commit drop as select ${q(JSON.stringify(data))}::jsonb as j;

insert into brands (slug, name, style, in_walk, walk_position)
select b.slug, b.name, b.style, b.in_walk, nullif(b.walk_position, -1)
from src, jsonb_to_recordset(j->'brands') as b(slug text, name text, style jsonb, in_walk boolean, walk_position int)
on conflict (slug) do update set name = excluded.name, style = excluded.style, in_walk = excluded.in_walk, walk_position = excluded.walk_position;

insert into categories (code, slug, name, slot, sizes, position)
select c.code, c.slug, c.name, c.slot::outfit_slot, array(select jsonb_array_elements_text(c.sizes)), c.position
from src, jsonb_to_recordset(j->'categories') as c(code text, slug text, name jsonb, slot text, sizes jsonb, position int)
on conflict (code) do update set slug = excluded.slug, name = excluded.name, slot = excluded.slot, sizes = excluded.sizes, position = excluded.position;

insert into products (slug, brand_id, category_id, title, status, cost, weight_g, colors, sizes, on_site, position)
select p.slug, (select id from brands where slug = p.brand), (select id from categories where code = p.category), p.title, 'active',
       p.cost, p.weight_g, array(select jsonb_array_elements_text(p.colors)),
       case when jsonb_typeof(p.sizes) = 'array' then array(select jsonb_array_elements_text(p.sizes)) end, true, p.position
from src, jsonb_to_recordset(j->'products') as p(slug text, brand text, category text, title jsonb, cost int, weight_g int, colors jsonb, sizes jsonb, position int)
on conflict (slug) do update set brand_id = excluded.brand_id, category_id = excluded.category_id, title = excluded.title, status = 'active',
  cost = excluded.cost, weight_g = excluded.weight_g, colors = excluded.colors, sizes = excluded.sizes, on_site = true, position = excluded.position;

delete from product_images where product_id in (select id from products where slug in (select p->>'slug' from src, jsonb_array_elements(j->'products') p));
insert into product_images (product_id, view, path, position)
select pr.id, (img->>0)::image_view, img->>1, k - 1
from src, jsonb_array_elements(j->'products') p
join products pr on pr.slug = p->>'slug',
jsonb_array_elements(p->'images') with ordinality as t(img, k);
commit;`);
