"use server";

import { db, eq } from "@/lib/server/db";
import { allow, clientIp } from "@/lib/server/limits";
import { findDemoOrder } from "@/models/orders/demo";
import { isClosed, orderFromRow, type TrackingRow } from "@/models/orders/from-db";
import { normalizeCode, type Order } from "@/models/orders/tracking";

// Suivi : le numéro de commande se suit d'une commande à l'autre, il ne suffit donc pas.
// Il faut aussi l'e-mail de la commande, et la réponse est la même si l'un des deux est faux.

export type TrackResult = { status: "found"; order: Order } | { status: "closed" } | { status: "none" } | { status: "error" };

const SELECT =
  "select=number,email,status,is_demo,created_at,price_snapshot," +
  "order_items(title,size,qty),order_parcels(forwarded_at,received_at),shipments(status,shipped_at,delivered_at)";

export async function lookupOrder(rawCode: unknown, rawEmail: unknown): Promise<TrackResult> {
  const code = typeof rawCode === "string" ? normalizeCode(rawCode) : null;
  if (!code) return { status: "none" };
  const live = process.env.VERCEL_ENV === "production";
  if (!live) {
    const demo = findDemoOrder(code, Date.now());
    if (demo) return { status: "found", order: demo };
  }
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase().slice(0, 254) : "";
  if (!email) return { status: "none" };
  if (!(await allow("track", await clientIp()))) return { status: "error" };

  try {
    const row = await db.one<TrackingRow & { email: string; is_demo: boolean }>("orders", `${SELECT}&number=${eq(code)}&status=neq.pending_payment`);
    if (!row || row.email.trim().toLowerCase() !== email || (live && row.is_demo)) return { status: "none" };
    return isClosed(row.status) ? { status: "closed" } : { status: "found", order: orderFromRow(row) };
  } catch (e) {
    console.error("[suivi]", e);
    return { status: "error" };
  }
}
