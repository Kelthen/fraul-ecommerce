import "server-only";
import { getProduct } from "@/lib/catalog";
import { COLOR_NAMES } from "@/lib/catalog/palette";
import { countriesOf, priceCart, unpackCart, type PayableProduct } from "@/models/payment/checkout";
import { ZONES, type ZoneId } from "@/models/pricing/config";
import { ensureSupplier, ensureVariant } from "./catalog-db";
import { DbError, db, eq } from "./db";
import { sendPaidEmail } from "./mailer";
import { relayOrder } from "./relay";
import { getCheckoutSession, shippingOf, type CheckoutSession } from "./stripe";

// Commande payée sur Stripe → commande dans la base → message Telegram à TakeUrClothes (docs/PARCOURS-COMMANDE.md §2).
// Appelé par la page « merci » ET par le webhook Stripe : le premier arrivé enregistre, l'autre retrouve la commande.

/** Version des CGV acceptée (pages légales encore en brouillon, à faire valider par un juriste). */
export const TERMS_VERSION = "2026-11-01-brouillon";
/** Au lancement, un seul fournisseur ; TakeUrClothes répartira ensuite entre ses fournisseurs (FOURNISSEURS-MULTIPLES.md). */
const MAIN_SUPPLIER = "Fournisseur principal";
const DAY = 86_400_000;
const SHEET_DAYS_BEFORE_SHIPPING = 21; // même durée que la commande test du relais

export type Fulfilled = { status: "ok"; number: string; email: string | null } | { status: "pending" } | { status: "unpaid" } | { status: "invalid" };

const payable = async (slugs: string[]) => {
  const found = new Map<string, PayableProduct & { image?: { front: string } }>();
  for (const s of new Set(slugs)) {
    const p = await getProduct(s);
    if (p) found.set(s, p);
  }
  return found;
};

async function orderOfSession(sessionId: string): Promise<string | null> {
  const p = await db.one<{ orders: { number: string } }>("payments", `select=orders(number)&provider_ref=${eq(sessionId)}`);
  return p?.orders.number ?? null;
}

export async function fulfillCheckout(sessionId: string, baseUrl: string, known?: CheckoutSession): Promise<Fulfilled> {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return { status: "invalid" };
  const done = await orderOfSession(sessionId);
  const s = known ?? (await getCheckoutSession(sessionId));
  if (done) return { status: "ok", number: done, email: s.customer_details?.email ?? null };
  if (s.payment_status !== "paid") return { status: "unpaid" };

  // Verrou : un seul enregistrement par session, même si la page et le webhook arrivent en même temps.
  try {
    await db.insert("payment_events", { provider_event_id: `checkout:${s.id}`, provider: "stripe", payload: { session: s.id } });
  } catch (e) {
    if (e instanceof DbError && e.isUnique) {
      const n = await orderOfSession(sessionId);
      return n ? { status: "ok", number: n, email: s.customer_details?.email ?? null } : { status: "pending" };
    }
    throw e;
  }

  try {
    return await record(s, baseUrl);
  } catch (e) {
    // Échec en cours de route : on retire le verrou (et la commande à moitié écrite) pour qu'un nouvel essai
    // (webhook renvoyé par Stripe, page rechargée) reprenne de zéro. L'argent, lui, est déjà chez Stripe.
    const partial = await db.one<{ id: string }>("orders", `select=id&price_snapshot->>stripe_session=${eq(s.id)}`).catch(() => null);
    await db.remove("payments", `provider_ref=${eq(s.id)}`).catch(() => {});
    if (partial) await db.remove("orders", `id=${eq(partial.id)}`).catch(() => {});
    await db.remove("payment_events", `provider_event_id=${eq(`checkout:${s.id}`)}`).catch(() => {});
    throw e;
  }
}

async function record(s: CheckoutSession, baseUrl: string): Promise<Fulfilled> {
  const zone = s.metadata.zone as ZoneId;
  const chunks = Object.keys(s.metadata)
    .filter((k) => /^cart\d+$/.test(k))
    .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)))
    .map((k) => s.metadata[k]);
  const requested = unpackCart(chunks);
  const products = await payable(requested.map((l) => l.slug));
  const priced = zone in ZONES ? priceCart(requested, zone, (slug) => products.get(slug)) : null;
  const ship = shippingOf(s);
  if (!priced?.ok || !ship?.address.country || !countriesOf(zone).includes(ship.address.country)) {
    // Ne devrait jamais arriver (panier vérifié avant le paiement) : on garde la trace pour TakeUrClothes.
    console.error("[paiement] session incohérente", s.id, priced, ship?.address.country);
  }

  const [first, ...rest] = (ship?.name ?? s.customer_details?.name ?? "").trim().split(/\s+/);
  const supplierId = await ensureSupplier(MAIN_SUPPLIER);
  const lines = priced?.ok ? priced.lines : [];
  const items = [];
  for (const l of lines) {
    const p = (await getProduct(l.slug))!;
    const colorName = COLOR_NAMES[l.color] ?? l.color;
    const variantId = await ensureVariant(p, l.size, colorName);
    items.push({
      variant_id: variantId,
      supplier_id: supplierId,
      title: l.title,
      color_name: colorName,
      size: l.size,
      qty: l.qty,
      unit_price: l.unitPrice,
      unit_cost: Math.round(p.cost.cny * 100),
    });
  }

  // Le montant fait foi tel que Stripe l'a encaissé ; le détail recalculé sert à la marge et aux lignes.
  const total = s.amount_total ?? (priced?.ok ? priced.total : 0);
  const currency = (s.currency ?? (priced?.ok ? priced.currency : "usd")).toUpperCase();
  const [order] = await db.insert<{ id: string; number: string }>("orders", {
    email: (s.customer_details?.email ?? "inconnu@takeurclothes.invalid").trim().toLowerCase(), // « Mon compte » retrouve les commandes par e-mail
    status: "paid",
    is_demo: s.id.startsWith("cs_test_"),
    currency,
    subtotal: total,
    total,
    price_snapshot: { zone, group: "public", margin: priced?.ok ? total - priced.landed : null, stripe_session: s.id },
    shipping_address: {
      first_name: first ?? "",
      last_name: rest.join(" "),
      line1: ship?.address.line1 ?? "",
      line2: ship?.address.line2 ?? undefined,
      city: ship?.address.city ?? "",
      postal_code: ship?.address.postal_code ?? "",
      state: ship?.address.state ?? undefined,
      country: ship?.address.country ?? "",
      phone: s.customer_details?.phone ?? undefined,
    },
    terms_version: TERMS_VERSION,
  });
  await db.insert("payments", { order_id: order.id, provider: "stripe", provider_ref: s.id, amount: total, currency, status: "succeeded" });
  if (items.length) await db.insert("order_items", items.map((i) => ({ ...i, order_id: order.id })));
  await db.insert("order_parcels", { order_id: order.id, supplier_id: supplierId });
  await db.insert("shipping_sheets", { order_id: order.id, expires_at: new Date(Date.now() + SHEET_DAYS_BEFORE_SHIPPING * DAY).toISOString() });
  await db.update("payment_events", `provider_event_id=${eq(`checkout:${s.id}`)}`, { processed_at: new Date().toISOString() });

  // Le paiement est enregistré : si Telegram ne répond pas, la commande reste visible dans le tableau de bord.
  await relayOrder(order.id, baseUrl).catch((e) => console.error("[paiement] message Telegram", e));
  await sendPaidEmail(order.id, baseUrl);
  return { status: "ok", number: order.number, email: s.customer_details?.email ?? null };
}
