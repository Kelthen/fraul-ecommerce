import { timingSafeEqual } from "node:crypto";
import { adminChatId, webhookSecret } from "@/lib/server/env";
import { decideSubmission, handleTrackingText, markParcel } from "@/lib/server/relay";
import { answerCallback, sendMessage } from "@/lib/server/telegram";

// Webhook du bot Telegram de Fraul (docs/PARCOURS-COMMANDE.md §2, §7.4).
// Sécurité : 1) en-tête secret posé par Telegram, 2) un seul compte écouté (Jean Paul ; Serge en démo),
// tout autre message est ignoré sans réponse. On répond toujours 200 pour que Telegram ne renvoie pas en boucle.

type Update = {
  message?: { chat: { id: number }; from?: { id: number }; text?: string; caption?: string };
  callback_query?: { id: string; from: { id: number }; message?: { chat: { id: number } }; data?: string };
};

const ok = () => new Response("ok");

function sameSecret(got: string | null): boolean {
  let secret: string;
  try {
    secret = webhookSecret();
  } catch {
    return false; // bot pas encore configuré
  }
  const want = Buffer.from(secret);
  const g = Buffer.from(got ?? "");
  return g.length === want.length && timingSafeEqual(g, want);
}

export async function POST(request: Request) {
  if (!sameSecret(request.headers.get("x-telegram-bot-api-secret-token"))) return new Response("forbidden", { status: 403 });
  const update = (await request.json()) as Update;
  const admin = adminChatId();
  const base = new URL(request.url).origin;

  try {
    const cb = update.callback_query;
    if (cb) {
      if (cb.from.id !== admin || cb.message?.chat.id !== admin) return ok();
      const [action, id] = (cb.data ?? "").split(":");
      let reply = "";
      if (action === "fwd") reply = await markParcel(id, "forwarded", base);
      else if (action === "rcv") reply = await markParcel(id, "received", base);
      else if (action === "ok" || action === "no" || action === "undo") reply = await decideSubmission(admin, id, action);
      await answerCallback(cb.id, reply || undefined);
      return ok();
    }

    const msg = update.message;
    if (!msg || msg.chat.id !== admin || msg.from?.id !== admin) return ok();
    const text = (msg.text ?? msg.caption ?? "").trim();
    if (text === "/start" || text === "/aide") {
      await sendMessage(
        admin,
        "Bonjour 👋 Je t'envoie chaque commande payée.\n\nPour un code de suivi, transfère-moi le message de l'expéditeur ou écris :\n<code>FRL-2026-000123 → LP123456789CN</code>\n(une ligne par commande). Je te montre une carte à vérifier avant d'enregistrer.",
      );
      return ok();
    }
    if (text) await handleTrackingText(admin, text);
  } catch (e) {
    console.error("[telegram]", e);
    try {
      await sendMessage(admin, "⚠️ Une erreur est survenue, rien n'a été enregistré. Réessaie dans un instant.");
    } catch {}
  }
  return ok();
}
