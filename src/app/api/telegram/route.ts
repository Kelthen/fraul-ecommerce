import { timingSafeEqual } from "node:crypto";
import { adminChatId, allowedUsers, webhookSecret } from "@/lib/server/env";
import { decideSubmission, handleTrackingText, markParcel, relayOrder, todoList, undoParcel } from "@/lib/server/relay";
import { answerCallback, sendMessage } from "@/lib/server/telegram";
import { commandOf, isGroupChat } from "@/models/relay/access";
import { todoButtons, todoMessage } from "@/models/relay/messages";

// Webhook du bot Telegram de Fraul (docs/PARCOURS-COMMANDE.md §2, §7.4).
// Sécurité : 1) en-tête secret posé par Telegram ; 2) une seule conversation écoutée (Jean Paul, ou le groupe
// de l'équipe) ; 3) seuls les comptes autorisés agissent (TELEGRAM_ALLOWED_USERS). Tout le reste est ignoré.
// On répond toujours 200 pour que Telegram ne renvoie pas en boucle.

type User = { id: number; first_name?: string };
type Update = {
  message?: { chat: { id: number }; from?: User; text?: string; caption?: string };
  callback_query?: { id: string; from: User; message?: { chat: { id: number } }; data?: string };
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

const HELP = [
  "Bonjour 👋 Je poste ici chaque commande payée.",
  "",
  "• Sous chaque commande : touche <b>✅ Transféré</b> quand le bloc est envoyé au fournisseur sur WeChat, puis <b>📥 Colis reçu</b> quand l'expéditeur l'a. Le haut du message montre ce qui reste. <b>↩️</b> annule pendant 15 min.",
  "• /afaire : la liste de tout ce qui reste à transférer ou à recevoir.",
  "• Code de suivi : transfère le message de l'expéditeur ou écris",
  "<code>FRL-2026-000123 → LP123456789CN</code>",
  "(une ligne par commande). Je montre une carte à vérifier avant d'enregistrer.",
].join("\n");

export async function POST(request: Request) {
  if (!sameSecret(request.headers.get("x-telegram-bot-api-secret-token"))) return new Response("forbidden", { status: 403 });
  const update = (await request.json()) as Update;
  const chat = adminChatId();
  const allowed = allowedUsers();
  const base = new URL(request.url).origin;
  const who = (u?: User) => u?.first_name?.slice(0, 40) ?? null;

  try {
    const cb = update.callback_query;
    if (cb) {
      if (cb.message?.chat.id !== chat) return ok();
      if (!allowed.includes(cb.from.id)) {
        await answerCallback(cb.id, "Tu n'es pas autorisé à modifier les commandes.");
        return ok();
      }
      const [action, id] = (cb.data ?? "").split(":");
      let reply = "";
      if (action === "fwd") reply = await markParcel(id, "forwarded", base, who(cb.from));
      else if (action === "rcv") reply = await markParcel(id, "received", base, who(cb.from));
      else if (action === "unf") reply = await undoParcel(id, base);
      else if (action === "rsd") {
        await relayOrder(id, base);
        reply = "Commande renvoyée en bas du fil.";
      } else if (action === "ok" || action === "no" || action === "undo") reply = await decideSubmission(chat, id, action, who(cb.from));
      await answerCallback(cb.id, reply || undefined);
      return ok();
    }

    const msg = update.message;
    if (!msg || msg.chat.id !== chat || !msg.from || !allowed.includes(msg.from.id)) return ok();
    const text = (msg.text ?? msg.caption ?? "").trim();
    const command = commandOf(text);
    if (command === "/start" || command === "/aide") {
      await sendMessage(chat, HELP);
      return ok();
    }
    if (command === "/afaire") {
      const list = await todoList();
      await sendMessage(chat, todoMessage(list), todoButtons(list));
      return ok();
    }
    if (command) return ok(); // autre commande : on ne devine pas
    if (text) await handleTrackingText(chat, text, isGroupChat(chat));
  } catch (e) {
    console.error("[telegram]", e);
    try {
      await sendMessage(chat, "⚠️ Une erreur est survenue, rien n'a été enregistré. Réessaie dans un instant.");
    } catch {}
  }
  return ok();
}
