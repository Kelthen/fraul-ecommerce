import "server-only";
import { emailHtml, emailText } from "@/models/orders/email-html";
import { orderEmail, type EmailKind } from "@/models/orders/emails";
import { orderFromRow, type TrackingRow } from "@/models/orders/from-db";
import { db, eq } from "./db";

// E-mails de commande par l'API de Resend. Sans RESEND_API_KEY et EMAIL_FROM, rien ne part :
// poser la clé dans Vercel est le feu vert pour écrire à de vrais clients. Jamais pour une commande de test.

const SHIPPED_DELAY_MS = 15 * 60_000; // 15 minutes pour corriger un code de suivi (PARCOURS-COMMANDE, codes de suivi)
const SELECT =
  "select=number,email,status,is_demo,created_at,price_snapshot," +
  "order_items(title,size,qty),order_parcels(forwarded_at,received_at),shipments(status,shipped_at,delivered_at)";

export const mailerReady = () => Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());

/** E-mail simple, en texte (codes de connexion de l'admin). */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!mailerReady()) throw new Error("Resend non configuré");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM!.trim(), to: [to], subject, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
}

async function send(to: string, kind: EmailKind, row: TrackingRow, baseUrl: string): Promise<void> {
  const mail = orderEmail(kind, orderFromRow(row), { timeZone: "America/Toronto" });
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM!.trim(),
      to: [to],
      subject: mail.subject,
      html: emailHtml(mail, baseUrl),
      text: emailText(mail, baseUrl),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  const failure = res.ok ? null : `Resend ${res.status}`;
  await db
    .insert("notifications_outbox", {
      channel: "email",
      recipient: to,
      payload: { kind, order: row.number },
      status: failure ? "failed" : "sent",
      attempts: 1,
      last_error: failure,
      sent_at: failure ? null : new Date().toISOString(),
    })
    .catch((e) => console.warn("[e-mail] trace", e));
  if (failure) throw new Error(failure);
}

const loadRow = (orderId: string) => db.one<TrackingRow & { email: string; is_demo: boolean }>("orders", `${SELECT}&id=${eq(orderId)}`);

/** « Commande confirmée », juste après l'enregistrement. Un échec n'annule jamais la commande. */
export async function sendPaidEmail(orderId: string, baseUrl: string): Promise<void> {
  if (!mailerReady()) return;
  try {
    const row = await loadRow(orderId);
    if (row && !row.is_demo) await send(row.email, "paid", row, baseUrl);
  } catch (e) {
    console.error("[e-mail] confirmation", orderId, e);
  }
}

/** « En route », 15 minutes après le code de suivi confirmé. Chaque suivi est réservé avant l'envoi : jamais deux e-mails. */
export async function sendDueShippedEmails(baseUrl: string): Promise<void> {
  if (!mailerReady()) return;
  const before = encodeURIComponent(new Date(Date.now() - SHIPPED_DELAY_MS).toISOString());
  const due = await db.select<{ id: string; order_id: string }>(
    "tracking_submissions",
    `select=id,order_id&status=eq.confirmed&customer_notified_at=is.null&confirmed_at=lt.${before}&limit=25`,
  );
  for (const sub of due) {
    const claim = `id=${eq(sub.id)}&customer_notified_at=is.null`;
    const claimed = await db.update<{ id: string }>("tracking_submissions", claim, { customer_notified_at: new Date().toISOString() });
    if (!claimed.length) continue;
    try {
      const row = await loadRow(sub.order_id);
      if (row && !row.is_demo) await send(row.email, "shipped", row, baseUrl);
    } catch (e) {
      console.error("[e-mail] en route", sub.order_id, e);
      await db.update("tracking_submissions", `id=${eq(sub.id)}`, { customer_notified_at: null }).catch(() => {}); // on réessaiera
    }
  }
}
