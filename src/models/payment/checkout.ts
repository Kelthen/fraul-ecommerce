// Paiement : fonctions pures, sans réseau (testées dans checkout.test.ts).
// Le navigateur n'envoie que des identifiants et des quantités ; les prix sont recalculés ici,
// côté serveur, avec la zone du visiteur (CLAUDE.md §9 : « le navigateur n'envoie jamais un prix »).
import { COUNTRY_ZONE, ZONES, type ZoneId } from "../pricing/config.ts";
import { customerPrice, landedCost, type Cost } from "../pricing/price.ts";

/** Ce que le navigateur envoie pour une ligne du panier. */
export type CartRequestLine = { slug: string; size?: string; color: string; qty: number };

/** Ce qu'il faut savoir d'un produit pour l'encaisser (lu dans le catalogue, jamais dans le navigateur). */
export type PayableProduct = { slug: string; name: string; brandName: string; cost: Cost; colors: string[]; sizes: string[] };

export type CheckoutLine = {
  slug: string;
  title: string;
  color: string;
  size: string;
  qty: number;
  /** Prix unitaire en unités mineures (centimes) de la devise de la zone. */
  unitPrice: number;
  /** Coût rendu unitaire (marchandise + livraison + droits), en unités mineures : sert à la marge estimée. */
  unitLanded: number;
};

export { MAX_LINES, MAX_QTY } from "../cart/limits.ts";
import { MAX_LINES, MAX_QTY } from "../cart/limits.ts";
/** Taille enregistrée pour un article sans taille (casquette, sac…). */
export const ONE_SIZE = "TU";

export type CartProblem = "empty" | "too-many" | "unknown-product" | "bad-size" | "bad-color" | "bad-qty";

/**
 * Vérifie le panier et recalcule chaque prix pour la zone.
 * `find` lit le catalogue : un produit inconnu, une taille ou une couleur qui n'existe pas refusent tout le panier.
 */
export function priceCart(
  lines: unknown,
  zone: ZoneId,
  find: (slug: string) => PayableProduct | undefined,
): { ok: true; lines: CheckoutLine[]; currency: string; total: number; landed: number } | { ok: false; problem: CartProblem } {
  if (!Array.isArray(lines) || !lines.length) return { ok: false, problem: "empty" };
  if (lines.length > MAX_LINES) return { ok: false, problem: "too-many" };
  const out: CheckoutLine[] = [];
  for (const raw of lines as Partial<CartRequestLine>[]) {
    const p = typeof raw?.slug === "string" ? find(raw.slug) : undefined;
    if (!p) return { ok: false, problem: "unknown-product" };
    const qty = raw.qty;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { ok: false, problem: "bad-qty" };
    if (typeof raw.color !== "string" || !p.colors.includes(raw.color)) return { ok: false, problem: "bad-color" };
    let size = ONE_SIZE;
    if (p.sizes.length > 1) {
      if (typeof raw.size !== "string" || !p.sizes.includes(raw.size)) return { ok: false, problem: "bad-size" };
      size = raw.size;
    } else if (p.sizes.length === 1) size = p.sizes[0];
    out.push({
      slug: p.slug,
      title: `${p.brandName} · ${p.name}`,
      color: raw.color,
      size,
      qty,
      unitPrice: Math.round(customerPrice(p.cost, zone) * 100),
      unitLanded: Math.round(landedCost(p.cost, zone) * 100),
    });
  }
  return {
    ok: true,
    lines: out,
    currency: ZONES[zone].currency,
    total: out.reduce((a, l) => a + l.unitPrice * l.qty, 0),
    landed: out.reduce((a, l) => a + l.unitLanded * l.qty, 0),
  };
}

/** Pays de livraison acceptés pour une zone : le prix payé correspond toujours à l'adresse (« l'adresse fait foi »). */
export const countriesOf = (zone: ZoneId): string[] =>
  Object.entries(COUNTRY_ZONE)
    .filter(([, z]) => z === zone)
    .map(([c]) => c);

/** Panier compact gardé dans la session Stripe (500 caractères max par valeur) : slug|couleur|taille|qté. */
export function packCart(lines: CheckoutLine[]): string[] {
  const chunks: string[] = [];
  let cur = "";
  for (const l of lines) {
    const item = [l.slug, l.color, l.size, l.qty].join("|");
    if (cur && cur.length + item.length + 1 > 480) {
      chunks.push(cur);
      cur = "";
    }
    cur = cur ? `${cur};${item}` : item;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

export function unpackCart(chunks: string[]): CartRequestLine[] {
  return chunks
    .join(";")
    .split(";")
    .filter(Boolean)
    .map((item) => {
      const [slug, color, size, qty] = item.split("|");
      return { slug, color, size, qty: Number(qty) };
    });
}

/** Paramètres de la session Stripe Checkout (format formulaire de l'API Stripe). */
export function checkoutParams(o: {
  lines: CheckoutLine[];
  currency: string;
  zone: ZoneId;
  baseUrl: string;
  photo: (slug: string) => string | undefined;
}): URLSearchParams {
  const f = new URLSearchParams();
  f.set("mode", "payment");
  f.set("locale", "fr");
  f.set("success_url", `${o.baseUrl}/commande/merci?session_id={CHECKOUT_SESSION_ID}`);
  f.set("cancel_url", `${o.baseUrl}/panier`);
  f.set("phone_number_collection[enabled]", "true"); // le transporteur l'exige presque toujours (PARCOURS §7.3)
  countriesOf(o.zone).forEach((c, i) => f.set(`shipping_address_collection[allowed_countries][${i}]`, c));
  o.lines.forEach((l, i) => {
    const k = `line_items[${i}]`;
    f.set(`${k}[quantity]`, String(l.qty));
    f.set(`${k}[price_data][currency]`, o.currency.toLowerCase());
    f.set(`${k}[price_data][unit_amount]`, String(l.unitPrice));
    f.set(`${k}[price_data][product_data][name]`, l.title);
    f.set(`${k}[price_data][product_data][description]`, l.size === ONE_SIZE ? "Taille unique" : `Taille ${l.size}`);
    const img = o.photo(l.slug);
    if (img) f.set(`${k}[price_data][product_data][images][0]`, img);
  });
  f.set("metadata[zone]", o.zone);
  packCart(o.lines).forEach((c, i) => f.set(`metadata[cart${i}]`, c));
  return f;
}
