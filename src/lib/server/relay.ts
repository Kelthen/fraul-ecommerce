import "server-only";
import { getCategory, getProduct } from "@/lib/catalog";
import { parseTrackingMessage } from "@/models/relay/codes";
import {
  REFUSALS,
  UNDO_MINUTES,
  cardButtons,
  confirmedCard,
  SHIPPER,
  esc,
  messageLink,
  orderButtons,
  orderMessage,
  trackingCard,
  undoButtons,
  undoableStep,
  type CardOrder,
  type RelayOrder,
  type TodoOrder,
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
  order_parcels: {
    id: string;
    supplier_id: string;
    status: string;
    forwarded_at: string | null;
    received_at: string | null;
    forwarded_by: string | null;
    received_by: string | null;
    suppliers: { name: string };
  }[];
  shipping_sheets: { token: string; expires_at: string } | null;
  shipments: { id: string; tracking_code: string | null; shipped_at: string | null }[];
};

const ORDER_SELECT =
  "select=id,number,status,is_demo,currency,total,created_at,shipping_address,relay_chat_id,relay_message_id,price_snapshot," +
  "order_items(qty,title,color_name,size,supplier_id,offer_id,supplier_offers(supplier_ref,supplier_url))," +
  "order_parcels(id,supplier_id,status,forwarded_at,received_at,forwarded_by,received_by,suppliers(name))," +
  "shipping_sheets(token,expires_at),shipments(id,tracking_code,shipped_at)";

/** Colis toujours dans le même ordre (nom du fournisseur) : la fiche et le message ne bougent pas après un geste. */
function sorted<T extends OrderRow | null>(o: T): T {
  o?.order_parcels.sort((a, b) => a.suppliers.name.localeCompare(b.suppliers.name, "fr") || a.id.localeCompare(b.id));
  return o;
}

export const loadOrder = async (id: string) => sorted(await db.one<OrderRow>("orders", `${ORDER_SELECT}&id=${eq(id)}`));
export const loadOrderByNumber = async (n: string) => sorted(await db.one<OrderRow>("orders", `${ORDER_SELECT}&number=${eq(n)}`));
export const loadPaidOrders = async () =>
  (await db.select<OrderRow>("orders", `${ORDER_SELECT}&status=not.in.(pending_payment,cancelled)&order=created_at.desc&limit=200`)).map(sorted);

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
      forwardedBy: p.forwarded_by,
      receivedBy: p.received_by,
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
  missing: o.order_parcels.filter((p) => !p.received_at).map((p) => p.suppliers.name),
});

/**
 * Envoie (ou renvoie, en bas du fil) le message de commande à Jean Paul.
 * L'ancien message perd ses boutons : un seul message vivant par commande.
 */
export async function relayOrder(orderId: string, baseUrl: string): Promise<void> {
  const o = await loadOrder(orderId);
  if (!o) throw new Error("Commande introuvable");
  const chat = adminChatId();
  const relay = toRelay(o, baseUrl);
  const messageId = await sendMessage(chat, orderMessage(relay), orderButtons(relay));
  await db.update("orders", `id=${eq(o.id)}`, { relay_chat_id: chat, relay_message_id: messageId, relayed_at: new Date().toISOString() });
  if (o.relay_chat_id && o.relay_message_id) {
    await editButtons(o.relay_chat_id, o.relay_message_id, []).catch((e) => console.warn("[relais] ancien message", e));
  }
}

/** Réécrit le message de commande (lignes d'état, titre, boutons) après un geste. `asking` : colis dont on confirme la correction. */
async function refreshMessage(o: OrderRow, baseUrl: string, asking?: string): Promise<void> {
  if (!o.relay_chat_id || !o.relay_message_id) return;
  const relay = toRelay(o, baseUrl);
  await editText(o.relay_chat_id, o.relay_message_id, orderMessage(relay), orderButtons(relay, Date.now(), asking));
}

const undoUntil = () => new Date(Date.now() + UNDO_MINUTES * 60_000).toISOString();

async function refreshOrderStatus(o: OrderRow): Promise<void> {
  const shipped = o.shipments.find((s) => s.tracking_code && s.shipped_at);
  const status = orderStatusOf({
    paidAt: Date.parse(o.created_at),
    shippedAt: shipped ? Date.parse(shipped.shipped_at!) : null,
    parcels: o.order_parcels.map((p) => ({ supplier: p.suppliers.name, forwardedAt: p.forwarded_at ? 1 : null, receivedAt: p.received_at ? 1 : null })),
  });
  if (status !== o.status) await db.update("orders", `id=${eq(o.id)}`, { status });
}

type ParcelRow = { id: string; order_id: string; forwarded_at: string | null; received_at: string | null };
const PARCEL_SELECT = "select=id,order_id,forwarded_at,received_at";

/**
 * « 📤 J'ai envoyé à … » ou « 📥 … reçu par l'expéditeur » (bouton Telegram, ou fiche de l'expéditeur).
 * `who` : prénom Telegram, ou SHIPPER quand l'expéditeur coche sa fiche.
 */
export async function markParcel(parcelId: string, step: "forwarded" | "received", baseUrl: string, who: string | null): Promise<string> {
  const parcel = await db.one<ParcelRow>("order_parcels", `${PARCEL_SELECT}&id=${eq(parcelId)}`);
  if (!parcel) return "Colis introuvable.";
  if (step === "forwarded" && parcel.forwarded_at) return "Déjà noté comme envoyé.";
  if (step === "received" && parcel.received_at) return "Déjà noté comme reçu.";
  const now = new Date().toISOString();
  const patch =
    step === "forwarded"
      ? { forwarded_at: now, forwarded_by: who, undo_until: undoUntil() }
      : {
          received_at: now,
          received_by: who,
          status: "received",
          undo_until: undoUntil(),
          // Reçu sans « envoyé » noté : on date l'envoi, sans prétendre savoir qui l'a fait.
          ...(parcel.forwarded_at ? {} : { forwarded_at: now, forwarded_by: who === SHIPPER ? null : who }),
        };
  await db.update("order_parcels", `id=${eq(parcelId)}`, patch);
  const o = (await loadOrder(parcel.order_id))!;
  await refreshOrderStatus(o);
  await refreshMessage(o, baseUrl);
  const all = o.order_parcels.every((p) => (step === "forwarded" ? p.forwarded_at : p.received_at));
  if (all) return step === "received" ? "Tous les colis sont chez l'expéditeur : il peut expédier." : "Tout est envoyé aux fournisseurs.";
  return step === "forwarded" ? "Noté : envoyé." : "Noté : reçu chez l'expéditeur.";
}

/** ↩️ Corriger : affiche « Oui / Non » à la place des boutons de ce colis (aucun changement en base). */
export async function askUndoParcel(parcelId: string, baseUrl: string, asking: boolean): Promise<string> {
  const parcel = await db.one<ParcelRow>("order_parcels", `${PARCEL_SELECT}&id=${eq(parcelId)}`);
  if (!parcel) return "Colis introuvable.";
  const o = (await loadOrder(parcel.order_id))!;
  const step = undoableStep({ forwardedAt: parcel.forwarded_at, receivedAt: parcel.received_at }, Date.now());
  await refreshMessage(o, baseUrl, asking && step ? parcelId : undefined);
  if (!step) return `Plus de ${UNDO_MINUTES} min : contacte l'équipe pour corriger.`;
  return asking ? "Confirme ou touche « Non »." : "Rien n'a changé.";
}

/**
 * Oui : défait le dernier geste sur ce colis, dans les UNDO_MINUTES qui suivent.
 * `expected` : l'étape que le bouton affichait ; si elle a déjà été défaite (double-tap), on ne touche à rien.
 */
export async function undoParcel(parcelId: string, baseUrl: string, expected?: "received" | "forwarded"): Promise<string> {
  const parcel = await db.one<ParcelRow>("order_parcels", `${PARCEL_SELECT}&id=${eq(parcelId)}`);
  if (!parcel) return "Colis introuvable.";
  const o = (await loadOrder(parcel.order_id))!;
  if (o.shipments.some((s) => s.tracking_code)) return "Commande déjà expédiée : contacte l'équipe pour corriger.";
  const step = undoableStep({ forwardedAt: parcel.forwarded_at, receivedAt: parcel.received_at }, Date.now());
  if (expected && step !== expected) {
    await refreshMessage(o, baseUrl);
    return "Déjà corrigé.";
  }
  if (!step) {
    await refreshMessage(o, baseUrl); // retire le bouton ↩️ devenu inutile
    return `Plus de ${UNDO_MINUTES} min : contacte l'équipe pour corriger.`;
  }
  const patch =
    step === "received"
      ? { received_at: null, received_by: null, status: "expected", undo_until: null }
      : { forwarded_at: null, forwarded_by: null, undo_until: null };
  await db.update("order_parcels", `id=${eq(parcelId)}`, patch);
  const fresh = (await loadOrder(parcel.order_id))!;
  await refreshOrderStatus(fresh);
  await refreshMessage(fresh, baseUrl);
  return step === "received" ? "Corrigé : colis remis « attendu »." : "Corrigé : remis « à envoyer ».";
}

// ───────────────────────── Fiche de l'expéditeur : « 已收到 Reçu » ─────────────────────────

type SheetRef = { order_id: string; expires_at: string };

/** Vérifie que le lien de fiche est valable et que ce colis appartient bien à sa commande. */
async function sheetParcel(token: string, parcelId: string): Promise<ParcelRow | string> {
  if (!/^[0-9a-f]{48}$/.test(token)) return "invalid";
  const sheet = await db.one<SheetRef>("shipping_sheets", `select=order_id,expires_at&token=${eq(token)}`);
  if (!sheet) return "invalid";
  if (Date.parse(sheet.expires_at) < Date.now()) return "expired";
  const parcel = await db.one<ParcelRow>("order_parcels", `${PARCEL_SELECT}&id=${eq(parcelId)}&order_id=${eq(sheet.order_id)}`);
  return parcel ?? "invalid";
}

/** L'expéditeur coche « reçu » sur sa fiche : on l'enregistre et on prévient l'équipe sur Telegram. */
export async function receiveFromSheet(token: string, parcelId: string, baseUrl: string): Promise<"ok" | "already" | "invalid" | "expired"> {
  const parcel = await sheetParcel(token, parcelId);
  if (typeof parcel === "string") return parcel as "invalid" | "expired";
  if (parcel.received_at) return "already";
  await markParcel(parcelId, "received", baseUrl, SHIPPER);
  const o = (await loadOrder(parcel.order_id))!;
  const p = o.order_parcels.find((x) => x.id === parcelId)!;
  const all = o.order_parcels.every((x) => x.received_at);
  const chat = o.relay_chat_id ?? adminChatId();
  await sendMessage(
    chat,
    `📥 <b>${esc(o.number)}</b> : colis de <b>${esc(p.suppliers.name)}</b> reçu par l'expéditeur (coché sur sa fiche).` +
      (all ? `\n📦 Tout est là : l'expéditeur peut expédier, puis envoyer le code de suivi.` : `\nEncore attendu : ${o.order_parcels.filter((x) => !x.received_at).map((x) => esc(x.suppliers.name)).join(", ")}.`),
  ).catch((e) => console.error("[fiche] message Telegram", e));
  return "ok";
}

/** L'expéditeur s'est trompé de colis : il retire son « reçu » dans les UNDO_MINUTES (seulement le sien). */
export async function undoReceiveFromSheet(token: string, parcelId: string, baseUrl: string): Promise<"ok" | "late" | "invalid" | "expired"> {
  const parcel = await sheetParcel(token, parcelId);
  if (typeof parcel === "string") return parcel as "invalid" | "expired";
  if (undoableStep({ forwardedAt: parcel.forwarded_at, receivedAt: parcel.received_at }, Date.now()) !== "received") return "late";
  const o = (await loadOrder(parcel.order_id))!;
  if (o.order_parcels.find((x) => x.id === parcelId)?.received_by !== SHIPPER) return "late";
  const msg = await undoParcel(parcelId, baseUrl, "received");
  if (!msg.startsWith("Corrigé")) return "late";
  const name = o.order_parcels.find((x) => x.id === parcelId)!.suppliers.name;
  await sendMessage(o.relay_chat_id ?? adminChatId(), `↩️ <b>${esc(o.number)}</b> : l'expéditeur a retiré « reçu » pour <b>${esc(name)}</b> (erreur de colis).`).catch((e) =>
    console.error("[fiche] message Telegram", e),
  );
  return "ok";
}

// ───────────────────────── Nettoyage des boutons « ↩️ » expirés ─────────────────────────

/**
 * Retire les boutons « ↩️ Corriger » dont les UNDO_MINUTES sont passées. Appelé à chaque message reçu
 * par le bot (et chaque ouverture de fiche) : pas de tâche planifiée à maintenir. Même s'il reste affiché,
 * un ↩️ expiré ne fait plus rien (le serveur refuse et l'efface).
 */
export async function sweepExpiredUndo(baseUrl: string): Promise<void> {
  const now = new Date().toISOString();
  const parcels = await db.select<{ id: string; order_id: string }>("order_parcels", `select=id,order_id&undo_until=lt.${encodeURIComponent(now)}&limit=50`);
  for (const orderId of new Set(parcels.map((p) => p.order_id))) {
    const o = await loadOrder(orderId);
    if (o) await refreshMessage(o, baseUrl).catch((e) => console.warn("[nettoyage]", e));
  }
  if (parcels.length) await db.update("order_parcels", `id=in.(${parcels.map((p) => p.id).join(",")})`, { undo_until: null });

  const subs = await db.select<{ id: string; card_message_id: number | null; orders: { relay_chat_id: number | null } }>(
    "tracking_submissions",
    `select=id,card_message_id,orders(relay_chat_id)&undo_until=lt.${encodeURIComponent(now)}&limit=50`,
  );
  for (const s of subs) {
    if (s.card_message_id) await editButtons(s.orders.relay_chat_id ?? adminChatId(), s.card_message_id, []).catch((e) => console.warn("[nettoyage]", e));
  }
  if (subs.length) await db.update("tracking_submissions", `id=in.(${subs.map((s) => s.id).join(",")})`, { undo_until: null });
}

/** /afaire : commandes payées pas encore expédiées, avec ce qui reste à transférer ou à recevoir. */
export async function todoList(): Promise<TodoOrder[]> {
  const orders = await loadPaidOrders();
  return orders
    .filter((o) => !o.shipments.some((s) => s.tracking_code) && !["cancelled", "refunded", "delivered"].includes(o.status))
    .map((o) => ({
      orderId: o.id,
      number: o.number,
      isDemo: o.is_demo,
      link: messageLink(o.relay_chat_id, o.relay_message_id),
      toForward: o.order_parcels.filter((p) => !p.forwarded_at).map((p) => p.suppliers.name),
      toReceive: o.order_parcels.filter((p) => p.forwarded_at && !p.received_at).map((p) => p.suppliers.name),
    }))
    .filter((t) => t.toForward.length || t.toReceive.length)
    .reverse(); // les plus anciennes d'abord
}

/**
 * Message texte de Jean Paul : on y cherche des couples « FRL-… → code ».
 * Dans un groupe, l'équipe discute aussi : on ne répond que si le message parle d'une commande (« FRL »).
 */
export async function handleTrackingText(chat: number, text: string, inGroup: boolean): Promise<void> {
  const parsed = parseTrackingMessage(text);
  const pairs = parsed.pairs;
  const rejected = inGroup ? parsed.rejected.filter((l) => /FRL/i.test(l)) : parsed.rejected;
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
export async function decideSubmission(chat: number, subId: string, decision: "ok" | "no" | "undo" | "undq" | "keepc", who: string | null): Promise<string> {
  const sub = await db.one<Submission>("tracking_submissions", `select=*&id=${eq(subId)}`);
  if (!sub) return "Introuvable.";
  const o = (await loadOrder(sub.order_id))!;
  const card = cardOrder(o);

  if (decision === "no") {
    if (sub.status !== "pending") return "Déjà traité.";
    await db.update("tracking_submissions", `id=${eq(sub.id)}`, { status: "cancelled", cancelled_at: new Date().toISOString(), decided_by: who });
    if (sub.card_message_id) await editText(chat, sub.card_message_id, `✖️ Annulé${who ? ` par ${esc(who)}` : ""} : rien n'a été enregistré pour ${o.number}.`);
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
    await db.update("tracking_submissions", `id=${eq(sub.id)}`, { status: "confirmed", confirmed_at: now.toISOString(), decided_by: who, undo_until: undoUntil() });
    await db.update("shipping_sheets", `order_id=${eq(o.id)}`, { expires_at: new Date(now.getTime() + SHEET_DAYS_AFTER_SHIPPING * DAY).toISOString() });
    await refreshOrderStatus((await loadOrder(o.id))!);
    if (sub.card_message_id) await editText(chat, sub.card_message_id, confirmedCard(sub.tracking_code, card, who), undoButtons(sub.id));
    return "Enregistré.";
  }

  // ↩️ Corriger → Oui / Non → retrait du code
  if (sub.status !== "confirmed" || !sub.confirmed_at) {
    if (sub.card_message_id) await editButtons(chat, sub.card_message_id, []);
    return "Rien à corriger.";
  }
  if (Date.now() - Date.parse(sub.confirmed_at) > UNDO_MINUTES * 60_000) {
    if (sub.card_message_id) await editButtons(chat, sub.card_message_id, []);
    await db.update("tracking_submissions", `id=${eq(sub.id)}`, { undo_until: null });
    return `Plus de ${UNDO_MINUTES} min : contacte l'équipe pour corriger.`;
  }
  if (decision === "undq" || decision === "keepc") {
    if (sub.card_message_id) await editButtons(chat, sub.card_message_id, undoButtons(sub.id, decision === "undq"));
    return decision === "undq" ? "Confirme ou touche « Non »." : "Rien n'a changé.";
  }
  await db.remove("shipments", `order_id=${eq(o.id)}&tracking_code=${eq(sub.tracking_code)}`);
  await db.update("tracking_submissions", `id=${eq(sub.id)}`, { status: "cancelled", cancelled_at: new Date().toISOString(), decided_by: who, undo_until: null });
  await refreshOrderStatus((await loadOrder(o.id))!);
  if (sub.card_message_id) await editText(chat, sub.card_message_id, `↩️ Annulé${who ? ` par ${esc(who)}` : ""} : ${o.number} n'a plus de code de suivi. Renvoie le bon couple « FRL → code ».`);
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
  sorted(sheet.orders);
  const expired = Date.parse(sheet.expires_at) < Date.now();
  if (!expired) await db.insert("shipping_sheet_views", { sheet_id: sheet.id, user_agent: userAgent?.slice(0, 300) ?? null });
  // Colis que l'expéditeur peut encore « dé-cocher » (son propre « reçu », moins de UNDO_MINUTES).
  const now = Date.now();
  const undoable = sheet.orders.order_parcels
    .filter((p) => p.received_by === SHIPPER && undoableStep({ forwardedAt: p.forwarded_at, receivedAt: p.received_at }, now) === "received")
    .map((p) => p.id);
  return { expired, expiresAt: sheet.expires_at, order: sheet.orders, undoable };
}

