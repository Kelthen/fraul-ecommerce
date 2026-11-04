-- 0012 — Les coûts fournisseur ne sont plus lisibles avec la clé publique (Serge, 4 nov. 2026).
-- La RLS filtre des lignes, pas des colonnes : les visiteurs lisaient products.cost et product_variants.supplier_cost.
-- Le site lit le catalogue côté serveur (clé service). Une nouvelle colonne reste privée tant qu'on ne l'ajoute pas ici.
revoke select on public.products from anon, authenticated;
grant select (id, slug, brand_id, category_id, title, description, seo_title, seo_description, status, created_at, updated_at,
              price_usd, weight_g, colors, sizes, on_site, position)
  on public.products to anon, authenticated;

revoke select on public.product_variants from anon, authenticated;
grant select (id, product_id, sku, color_name, color_hex, size, weight_g, available)
  on public.product_variants to anon, authenticated;
