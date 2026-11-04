import "server-only";
import { randomUUID } from "node:crypto";
import type { ArticleInput } from "@/models/admin/article";
import { db, eq } from "./db";
import { SUPABASE_URL, serviceKey } from "./env";

// Articles du site dans la base, vus et modifiés depuis l'admin (clé service, après vérification de la session).
// Retirer un article = le masquer (on_site = false) : jamais effacé, les commandes passées gardent leur fiche.

export type AdminArticle = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  priceUsd: number | null;
  costCny: number;
  weightG: number;
  colors: string[];
  sizes: string[] | null;
  supplierRef: string | null;
  onSite: boolean;
  photos: { front?: string; back?: string; details: string[] };
};

type Row = {
  id: string;
  slug: string;
  title: { fr?: string };
  price_usd: number | null;
  cost: number;
  weight_g: number;
  colors: string[];
  sizes: string[] | null;
  supplier_ref: string | null;
  on_site: boolean;
  brands: { slug: string };
  categories: { code: string };
  product_images: { view: "front" | "back" | "detail"; path: string; position: number }[];
};

const SELECT =
  "select=id,slug,title,price_usd,cost,weight_g,colors,sizes,supplier_ref,on_site,brands(slug),categories(code),product_images(view,path,position)";

const toArticle = (r: Row): AdminArticle => {
  const imgs = [...r.product_images].sort((a, b) => a.position - b.position);
  return {
    slug: r.slug,
    name: r.title.fr ?? r.slug,
    brand: r.brands.slug,
    category: r.categories.code,
    priceUsd: r.price_usd == null ? null : r.price_usd / 100,
    costCny: r.cost / 100,
    weightG: r.weight_g,
    colors: r.colors,
    sizes: r.sizes,
    supplierRef: r.supplier_ref,
    onSite: r.on_site,
    photos: {
      front: imgs.find((i) => i.view === "front")?.path,
      back: imgs.find((i) => i.view === "back")?.path,
      details: imgs.filter((i) => i.view === "detail").map((i) => i.path),
    },
  };
};

/** Tous les articles du catalogue, visibles ou masqués (pas les fiches créées seules par une commande, sans coût). */
export async function listArticles(): Promise<AdminArticle[]> {
  const rows = await db.select<Row>("products", `${SELECT}&cost=not.is.null&order=on_site.desc,position.asc,created_at.desc`);
  return rows.map(toArticle);
}

export async function getArticle(slug: string): Promise<AdminArticle | null> {
  const r = await db.one<Row>("products", `${SELECT}&slug=${eq(slug)}`);
  return r ? toArticle(r) : null;
}

export async function slugTaken(slug: string): Promise<boolean> {
  return Boolean(await db.one("products", `select=id&slug=${eq(slug)}`));
}

/** Crée ou met à jour l'article (et remplace ses photos). Les nouveaux articles arrivent en tête de liste. */
export async function saveArticle(a: ArticleInput & { slug: string }, isNew: boolean): Promise<void> {
  const [brand] = await db.select<{ id: string }>("brands", `select=id&slug=${eq(a.brand)}`);
  const [cat] = await db.select<{ id: string }>("categories", `select=id&code=${eq(a.category)}`);
  if (!brand || !cat) throw new Error("Marque ou catégorie absente de la base");
  const fields = {
    brand_id: brand.id,
    category_id: cat.id,
    title: { fr: a.name.trim() },
    status: "active",
    price_usd: Math.round(a.priceUsd * 100),
    cost: Math.round(a.costCny * 100),
    weight_g: Math.round(a.weightG),
    colors: a.colors,
    sizes: a.sizes,
    supplier_ref: a.supplierRef?.trim() || null,
    on_site: a.onSite,
  };
  let id: string;
  if (isNew) {
    const [first] = await db.select<{ position: number }>("products", "select=position&cost=not.is.null&order=position.asc&limit=1");
    [{ id }] = await db.insert<{ id: string }>("products", { slug: a.slug, ...fields, position: (first?.position ?? 0) - 1 });
  } else {
    const rows = await db.update<{ id: string }>("products", `slug=${eq(a.slug)}`, fields);
    if (!rows.length) throw new Error("Article introuvable");
    id = rows[0].id;
  }
  await db.remove("product_images", `product_id=${eq(id)}`);
  const views: ["front" | "back" | "detail", string][] = [
    ["front", a.photos.front],
    ...(a.photos.back ? ([["back", a.photos.back]] as ["back", string][]) : []),
    ...a.photos.details.map((d) => ["detail", d] as ["detail", string]),
  ];
  await db.insert("product_images", views.map(([view, path], position) => ({ product_id: id, view, path, position })));
}

export async function setOnSite(slug: string, onSite: boolean): Promise<void> {
  await db.update("products", `slug=${eq(slug)}`, { on_site: onSite });
}

const MAX_PHOTO = 2 * 1024 * 1024; // même limite que le dossier « produits » (migration 0011)
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Envoie une photo (déjà réduite par le téléphone) dans le stockage ; renvoie son adresse publique. */
export async function uploadPhoto(file: File): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error("Photo : JPEG, PNG ou WebP seulement.");
  if (file.size > MAX_PHOTO) throw new Error("Photo trop lourde (2 Mo au plus).");
  const path = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
  const key = serviceKey();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/produits/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": file.type, "x-upsert": "false" },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) throw new Error(`Stockage (${res.status}) : ${(await res.text()).slice(0, 200)}`);
  return `${SUPABASE_URL}/storage/v1/object/public/produits/${path}`;
}
