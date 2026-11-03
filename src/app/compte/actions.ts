"use server";

import { verifiedUser } from "@/lib/server/customer";
import { db, eq } from "@/lib/server/db";
import { isClosed, orderFromRow, type TrackingRow } from "@/models/orders/from-db";
import type { Order } from "@/models/orders/tracking";

// « Mon compte » : le serveur vérifie le jeton, puis lit la base pour ce client seulement.

const SELECT =
  "select=number,email,status,is_demo,created_at,price_snapshot," +
  "order_items(title,size,qty),order_parcels(forwarded_at,received_at),shipments(status,shipped_at,delivered_at)";

/** Crée la fiche client au besoin ; `acceptedTerms` à la création du compte. Renvoie le choix e-mails nouveautés. */
export async function syncAccount(token: unknown, acceptedTerms: unknown): Promise<{ marketing: boolean } | null> {
  try {
    const u = await verifiedUser(token);
    if (!u) return null;
    await db.insert("customers", { id: u.id, email: u.email }, "id");
    if (acceptedTerms === true) await db.insert("consents", { customer_id: u.id, kind: "terms" });
    const on = await db.one("consents", `select=id&customer_id=${eq(u.id)}&kind=eq.marketing&revoked_at=is.null`);
    return { marketing: Boolean(on) };
  } catch (e) {
    console.error("[compte]", e);
    return null;
  }
}

export async function saveMarketing(token: unknown, on: unknown): Promise<boolean> {
  try {
    const u = await verifiedUser(token);
    if (!u) return false;
    const now = new Date().toISOString();
    await db.update("consents", `customer_id=${eq(u.id)}&kind=eq.marketing&revoked_at=is.null`, { revoked_at: now });
    if (on === true) await db.insert("consents", { customer_id: u.id, kind: "marketing" });
    return true;
  } catch (e) {
    console.error("[compte]", e);
    return false;
  }
}

export async function loadMyOrders(token: unknown): Promise<Order[] | null> {
  try {
    const u = await verifiedUser(token);
    if (!u) return null;
    const rows = await db.select<TrackingRow & { is_demo: boolean }>("orders", `${SELECT}&email=${eq(u.email)}&status=neq.pending_payment&order=created_at.desc&limit=50`);
    const live = process.env.VERCEL_ENV === "production";
    return rows.filter((r) => !isClosed(r.status) && !(live && r.is_demo)).map(orderFromRow);
  } catch (e) {
    console.error("[compte]", e);
    return null;
  }
}
