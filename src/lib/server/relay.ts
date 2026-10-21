import "server-only";
import { getCategory, getProduct } from "@/lib/catalog";
import { parseTrackingMessage } from "@/models/relay/codes";
import {
  REFUSALS,
  UNDO_MINUTES,
  cardButtons,
  confirmedCard,
  orderButtons,
  orderMessage,
  trackingCard,
  undoButtons,
  type CardOrder,
  type RelayOrder,
} from "@/models/relay/messages";
import { orderStatusOf } from "@/models/relay/piles";
import { ZONES, type ZoneId } from "@/models/pricing/config";
import { customerPrice, landedCost } from "@/models/pricing/price";
import { DbError, db, eq } from "./db";
import { adminChatId } from "./env";
import { editButtons as rawEditButtons, editText as rawEditText, sendMessage } from "./telegram";

// Toucher deux fois le même bouton renvoie « message is not modified » : sans gravité, on l'ignore.
const quiet = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    if (!(e instanceof Error && e.message.includes("not modified"))) throw e;
  }
};
const editButtons = (...a: Parameters<typeof rawEditButtons>) => quiet(rawEditButtons(...a));
const editText = (...a: Parameters<typeof rawEditText>) => quiet(rawEditText(...a));

// Relais des commandes (docs/PARCOURS-COMMANDE.md) : le site prévient Jean Paul sur Telegram,
// suit les colis attendus chez l'expéditeur et enregistre le code de suivi après vérification.

const DAY = 86_400_000;
const SHEET_DAYS_BEFORE_SHIPPING = 21; // le lien de fiche reste valable pendant la préparation…
const SHEET_DAYS_AFTER_SHIPPING = 7; // … puis 7 jours après l'expédition au plus (§7.3)

type Address = { first_name: string; last_name: string; line1: string; line2?: string; city: string; postal_code: string; country: string; phone?: string };

export type OrderRow = {
  id: string;
  number: string;
  status: string;
  is_demo: boolean;
  currency: string;
  total: number;
  created_at: string;
  shipping_address: Address;
  relay_chat_id: number | null;
  relay_message_id: number | null;
  price_snapshot: { zone?: ZoneId; margin?: number };
  order_items: { qty: number; title: string; color_name: string; size: string; supplier_id: string; offer_id: string | null; supplier_offers: { supplier_ref: string | null; supplier_url: string | null } | null }[];
  order_parcels: { id: string; supplier_id: string; status: string; forwarded_at: string | null; received_at: string | null; suppliers: { name: string } }[];
  shipping_sheets: { token: string; expires_at: string } | null;
  shipments: { id: string; tracking_code: string | null; shipped_at: string | null }[];
};

const ORDER_SELECT =
  "select=id,number,status,is_demo,currency,total,created_at,shipping_address,relay_chat_id,relay_message_id,price_snapshot," +
  "order_items(qty,title,color_name,size,supplier_id,offer_id,supplier_offers(supplier_ref,supplier_url))," +
  "order_parcels(id,supplier_id,status,forwarded_at,received_at,suppliers(name))," +
  "shipping_sheets(token,expires_at),shipments(id,tracking_code,shipped_at)";

export const loadOrder = (id: string) => db.one<OrderRow>("orders", `${ORDER_SELECT}&id=${eq(id)}`);
export const loadOrderByNumber = (n: string) => db.one<OrderRow>("orders", `${ORDER_SELECT}&number=${eq(n)}`);
export const loadPaidOrders = () =>
  db.select<OrderRow>("orders", `${ORDER_SELECT}&status=not.in.(pending_payment,cancelled)&order=created_at.desc&limit=200`);

const money = (minor: number, currency: string) => `${Math.round(minor / 100)} ${currency}`;
const dateFr = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "America/Toronto" }).format(new Date(iso));

export function toRelay(o: OrderRow, baseUrl: string): RelayOrder {
  return {
    number: o.number,
    isDemo: o.is_demo,
    total: money(o.total, o.currency),
    margin: o.price_snapshot?.margin != null ? money(o.price_snapshot.margin, o.currency) : undefined,
    firstName: o.shipping_address.first_name,
    city: o.shipping_address.city,
    sheetUrl: o.shipping_sheets ? `${baseUrl}/f/${o.shipping_sheets.token}` : "",
    sheetExpires: o.shipping_sheets ? dateFr(o.shipping_sheets.expires_at) : "",
    parcels: o.order_parcels.map((p) => ({
      id: p.id,
      supplier: p.suppliers.name,
      forwardedAt: p.forwarded_at,
      receivedAt: p.received_at,
      lines: o.order_items
        .filter((i) => i.supplier_id === p.supplier_id)
        .map((i) => ({
          title: i.title,
          brand: "",
          color: i.color_name,
          size: i.size,
          qty: i.qty,
          supplierRef: i.supplier_offers?.supplier_ref ?? undefined,
          link: i.supplier_offers?.supplier_url ?? undefined,
        })),
    })),
  };
}

export const cardOrder = (o: OrderRow): CardOrder => ({
  number: o.number,
  firstName: o.shipping_address.first_name,
  city: o.shipping_address.city,
  articles: o.order_items.reduce((n, i) => n + i.qty, 0),
  isDemo: o.is_demo,
});

/** Envoie (ou renvoie) le message de commande à Jean Paul. */
export async function relayOrder(orderId: string, baseUrl: string): Promise<void> {
  const o = await loadOrder(orderId);
  if (!o) throw new Error("Commande introuvable");
  const chat = adminChatId();
  const relay = toRelay(o, baseUrl);
  const messageId = await sendMessage(chat, orderMessage(relay), orderButtons(relay));
  await db.update("orders", `id=${eq(o.id)}`, { relay_chat_id: chat, relay_message_id: messageId, relayed_at: new Date().toISOString() });
}

async function refreshOrderStatus(o: OrderRow): Promise<void> {
  const shipped = o.shipments.find((s) => s.tracking_code && s.shipped_at);
  const status = orderStatusOf({
    paidAt: Date.parse(o.created_at),
    shippedAt: shipped ? Date.parse(shipped.shipped_at!) : null,
    parcels: o.order_parcels.map((p) => ({ supplier: p.suppliers.name, forwardedAt: p.forwarded_at ? 1 : null, receivedAt: p.received_at ? 1 : null })),
  });
  if (status !== o.status) await db.update("orders", `id=${eq(o.id)}`, { status });
}

/** Bouton « Transféré à … » ou « Colis reçu de … » dans le message de commande. */
export async function markParcel(parcelId: string, step: "forwarded" | "received", baseUrl: string): Promise<string> {
  const parcel = await db.one<{ id: string; order_id: string; forwarded_at: string | null }>("order_parcels", `select=id,order_id,forwarded_at&id=${eq(parcelId)}`);
  if (!parcel) return "Colis introuvable.";
  const now = new Date().toISOString();
  const patch = step === "forwarded" ? { forwarded_at: now } : { received_at: now, status: "received", ...(parcel.forwarded_at ? {} : { forwarded_at: now }) };
  await db.update("order_parcels", `id=${eq(parcelId)}`, patch);
  const o = (await loadOrder(parcel.order_id))!;
  await refreshOrderStatus(o);
  if (o.relay_chat_id && o.relay_message_id) await editButtons(o.relay_chat_id, o.relay_message_id, orderButtons(toRelay(o, baseUrl)));
  const all = o.order_parcels.every((p) => (step === "forwarded" ? p.forwarded_at : p.received_at));
  if (step === "received" && all) return "Tous les colis sont chez l'expéditeur : il peut expédier.";
  return step === "forwarded" ? "Noté : transféré." : "Noté : colis reçu.";
}

/** Message texte de Jean Paul : on y cherche des couples « FRL-… → code ». */
export async function handleTrackingText(chat: number, text: string): Promise<void> {
  const { pairs, rejected } = parseTrackingMessage(text);
  if (!pairs.length && !rejected.length) return;
  for (const p of pairs) {
    const o = await loadOrderByNumber(p.order);
    if (!o) {
      await sendMessage(chat, REFUSALS.unknownOrder(p.order));
      continue;
    }
    if (["pending_payment", "cancelled", "refunded"].includes(o.status)) {
      await sendMessage(chat, REFUSALS.notReady(o.number));
      continue;
    }
    if (o.shipments.some((s) => s.tracking_code)) {
      await sendMessage(chat, REFUSALS.alreadyTracked(o.number));
      continue;
    }
    const other = await codeOwner(p.code);
    if (other) {
      await sendMessage(chat, REFUSALS.codeUsed(p.code, other));
      continue;
    }
    const [sub] = await db.insert<{ id: string }>("tracking_submissions", { order_id: o.id, tracking_code: p.code });
    const cardId = await sendMessage(chat, trackingCard(p.code, cardOrder(o)), cardButtons(sub.id));
    await db.update("tracking_submissions", `id=${eq(sub.id)}`, { card_message_id: cardId });
  }
  if (rejected.length) await sendMessage(chat, REFUSALS.unreadable(rejected));
}

/** Numéro de la commande qui utilise déjà ce code (comparaison sans tenir compte des majuscules). */
async function codeOwner(code: string): Promise<string | null> {
  const s = await db.one<{ orders: { number: string } }>("shipments", `select=orders(number)&tracking_code=ilike.${encodeURIComponent(code)}`);
  return s?.orders.number ?? null;
}

type Submission = { id: string; order_id: string; tracking_code: string; status: string; card_message_id: number | null; confirmed_at: string | null };

/** ✅ Confirmer / ✖️ Annuler sur la carte de vérification, ↩️ Annuler dans les 15 min. */
export async function decideSubmission(chat: number, subId: string, decision: "ok" | "no" | "undo"): Promise<string> {
  const sub = await db.one<Submission>("tracking_submissions", `select=*&id=${eq(subId)}`);
  if (!sub) return "Introuvable.";
  const o = (await loadOrder(sub.order_id))!;
  const card = cardOrder(o);

  if (decision === "no") {
    if (sub.status !== "pending") return "Déjà traité.";
    await db.update("tracking_submissions", `id=${eq(sub.id)}`, { status: "cancelled", cancelled_at: new Date().toISOString() });
    if (sub.card_message_id) await editText(chat, sub.card_message_id, `✖️ Annulé : rien n'a été enregistré pour ${o.number}.`);
    return "Annulé.";
  }

  if (decision === "ok") {
    if (sub.status !== "pending") return "Déjà traité.";
    if (o.shipments.some((s) => s.tracking_code)) return "Cette commande a déjà un code.";
    const now = new Date();
    try {
      const [ship] = await db.insert<{ id: string }>("shipments", {
        order_id: o.id,
        tracking_code: sub.tracking_code,
        status: "shipped",
        shipped_at: now.toISOString(),
      });
      await db.insert("shipment_events", { shipment_id: ship.id, status: "shipped", occurred_at: now.toISOString(), source: "manual", note: "Code saisi via Telegram" });
    } catch (e) {
      if (e instanceof DbError && e.isUnique) return "Ce code est déjà utilisé sur une autre commande.";
      throw e;
    }
    await db.update("tracking_submissions", `id=${eq(sub.id)}`, { status: "confirmed", confirmed_at: now.toISOString() });
    await db.update("shipping_sheets", `order_id=${eq(o.id)}`, { expires_at: new Date(now.getTime() + SHEET_DAYS_AFTER_SHIPPING * DAY).toISOString() });
    await refreshOrderStatus((await loadOrder(o.id))!);
    if (sub.card_message_id) await editText(chat, sub.card_message_id, confirmedCard(sub.tracking_code, card), undoButtons(sub.id));
    return "Enregistré.";
  }

  // undo
  if (sub.status !== "confirmed" || !sub.confirmed_at) return "Rien à annuler.";
  if (Date.now() - Date.parse(sub.confirmed_at) > UNDO_MINUTES * 60_000) {
    if (sub.card_message_id) await editButtons(chat, sub.card_message_id, []);
    return `Plus de ${UNDO_MINUTES} min : contacte l'équipe pour corriger.`;
  }
  await db.remove("shipments", `order_id=${eq(o.id)}&tracking_code=${eq(sub.tracking_code)}`);
  await db.update("tracking_submissions", `id=${eq(sub.id)}`, { status: "cancelled", cancelled_at: new Date().toISOString() });
  await refreshOrderStatus((await loadOrder(o.id))!);
  if (sub.card_message_id) await editText(chat, sub.card_message_id, `↩️ Annulé : ${o.number} n'a plus de code de suivi. Renvoie le bon couple « FRL → code ».`);
  return "Annulé.";
}

// ───────────────────────── Commande test (démo) ─────────────────────────

const DEMO_SUPPLIERS = ["Fournisseur démo A", "Fournisseur démo B"];
const DEMO_PRODUCTS = [
  { slug: "nike-techfleece-noir-gris-veste", supplier: 0, size: "L", ref: "A-88213" },
  { slug: "trapstar-hoodie-noir", supplier: 1, size: "M", ref: "B-77102" },
];
const DEMO_ADDRESS: Address = {
  first_name: "Awa",
  last_name: "Démo",
  line1: "12 rue Exemple",
  city: "Paris",
  postal_code: "75002",
  country: "FR",
  phone: "+33 6 00 00 00 00",
};

async function ensureSupplier(name: string): Promise<string> {
  const found = await db.one<{ id: string }>("suppliers", `select=id&name=${eq(name)}`);
  if (found) return found.id;
  const [s] = await db.insert<{ id: string }>("suppliers", { name, feed_config: { demo: true } });
  return s.id;
}

/** Crée une commande test payée (2 articles, 2 fournisseurs, vraies photos) et l'envoie sur Telegram. */
export async function createTestOrder(baseUrl: string): Promise<string> {
  const zone: ZoneId = "eu";
  const currency = ZONES[zone].currency;
  const supplierIds = await Promise.all(DEMO_SUPPLIERS.map(ensureSupplier));
  const items: Record<string, unknown>[] = [];
  let subtotal = 0;
  let landed = 0;

  for (const d of DEMO_PRODUCTS) {
    const p = await getProduct(d.slug);
    if (!p) throw new Error(`Produit de démo introuvable : ${d.slug}`);
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
    const color = "noir";
    const [variant] = await db.insert<{ id: string }>(
      "product_variants",
      { product_id: product.id, sku: `DEMO-${p.slug}-${d.size}`, color_name: color, size: d.size, supplier_cost: Math.round(p.cost.cny * 100), weight_g: Math.round(p.cost.g) },
      "sku",
    );
    const supplierId = supplierIds[d.supplier];
    const [offer] = await db.insert<{ id: string }>(
      "supplier_offers",
      {
        variant_id: variant.id,
        supplier_id: supplierId,
        supplier_ref: d.ref,
        supplier_url: `${baseUrl}/produit/${p.slug}`,
        cost: Math.round(p.cost.cny * 100),
        priority: 1,
        last_checked_at: new Date().toISOString(),
      },
      "variant_id,supplier_id",
    );
    const price = customerPrice(p.cost, zone);
    subtotal += Math.round(price * 100);
    landed += landedCost(p.cost, zone) * 100;
    items.push({
      variant_id: variant.id,
      supplier_id: supplierId,
      offer_id: offer.id,
      title: `${p.brandName} · ${p.name}`,
      color_name: color,
      size: d.size,
      qty: 1,
      unit_price: Math.round(price * 100),
      unit_cost: Math.round(p.cost.cny * 100),
    });
  }

  const [order] = await db.insert<{ id: string }>("orders", {
    email: "demo@fraul.invalid",
    status: "paid",
    is_demo: true,
    currency,
    subtotal,
    total: subtotal,
    price_snapshot: { demo: true, zone, margin: Math.round(subtotal - landed) },
    shipping_address: DEMO_ADDRESS,
    terms_version: "demo",
  });
  await db.insert("order_items", items.map((i) => ({ ...i, order_id: order.id })));
  await db.insert(
    "order_parcels",
    supplierIds.map((supplier_id) => ({ order_id: order.id, supplier_id })),
  );
  await db.insert("shipping_sheets", { order_id: order.id, expires_at: new Date(Date.now() + SHEET_DAYS_BEFORE_SHIPPING * DAY).toISOString() });
  await relayOrder(order.id, baseUrl);
  return order.id;
}

/** Efface toutes les commandes test (jamais les vraies). */
export async function deleteTestOrders(): Promise<number> {
  const demo = await db.select<{ id: string }>("orders", "select=id&is_demo=is.true");
  for (const o of demo) {
    await db.remove("shipments", `order_id=${eq(o.id)}`);
    await db.remove("orders", `id=${eq(o.id)}`);
  }
  return demo.length;
}

/** Fiche d'expédition par son lien secret ; null si inconnue. Enregistre l'ouverture. */
export async function openSheet(token: string, userAgent: string | null) {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  const sheet = await db.one<{ id: string; expires_at: string; orders: OrderRow }>(
    "shipping_sheets",
    `select=id,expires_at,orders(${ORDER_SELECT.replace("select=", "")})&token=${eq(token)}`,
  );
  if (!sheet) return null;
  const expired = Date.parse(sheet.expires_at) < Date.now();
  if (!expired) await db.insert("shipping_sheet_views", { sheet_id: sheet.id, user_agent: userAgent?.slice(0, 300) ?? null });
  return { expired, expiresAt: sheet.expires_at, order: sheet.orders };
}

