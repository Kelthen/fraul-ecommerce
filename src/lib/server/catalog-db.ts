import "server-only";
import { getCategory, type Product } from "@/lib/catalog";
import { db } from "./db";

// Le catalogue vit encore dans le code (src/lib/catalog) : avant d'enregistrer une commande, on recopie
// dans la base la marque, la catégorie, le produit et la variante commandés (créés une fois, puis réutilisés).

/** Identifiant de la variante (produit × couleur × taille) dans la base, créée si besoin. */
export async function ensureVariant(p: Product, size: string, colorName: string, skuPrefix = ""): Promise<string> {
  const cat = getCategory(p.category);
  const [brand] = await db.insert<{ id: string }>("brands", { slug: p.brandSlug, name: p.brandName }, "slug");
  const [category] = await db.insert<{ id: string }>(
    "categories",
    { code: cat.id, slug: cat.slug, name: { fr: cat.label }, slot: cat.slot, sizes: cat.sizes },
    "code",
  );
  const [product] = await db.insert<{ id: string }>(
    "products",
    { slug: p.slug, brand_id: brand.id, category_id: category.id, title: { fr: p.name }, status: "active" },
    "slug",
  );
  const [variant] = await db.insert<{ id: string }>(
    "product_variants",
    {
      product_id: product.id,
      sku: `${skuPrefix}${p.slug}-${colorName}-${size}`.toLowerCase(),
      color_name: colorName,
      size,
      supplier_cost: Math.round(p.cost.cny * 100),
      weight_g: Math.round(p.cost.g),
    },
    "sku",
  );
  return variant.id;
}

/** Fournisseur par son nom, créé si besoin. */
export async function ensureSupplier(name: string, feedConfig: Record<string, unknown> = {}): Promise<string> {
  const found = await db.one<{ id: string }>("suppliers", `select=id&name=eq.${encodeURIComponent(name)}`);
  if (found) return found.id;
  const [s] = await db.insert<{ id: string }>("suppliers", { name, feed_config: feedConfig });
  return s.id;
}
