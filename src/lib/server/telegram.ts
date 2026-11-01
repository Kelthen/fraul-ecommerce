import "server-only";
import type { Button } from "@/models/relay/messages";
import { botToken } from "./env";

// Appels à l'API officielle de Telegram (https://core.telegram.org/bots/api).

export async function tg<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${botToken()}/${method}`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${method} : ${json.description ?? res.status}`);
  return json.result;
}

const keyboard = (rows: Button[][]) => ({ inline_keyboard: rows.map((r) => r.map((b) => ({ text: b.text, callback_data: b.data }))) });

export async function sendMessage(chatId: number, html: string, buttons?: Button[][]): Promise<number> {
  const msg = await tg<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(buttons ? { reply_markup: keyboard(buttons) } : {}),
  });
  return msg.message_id;
}

export const editText = (chatId: number, messageId: number, html: string, buttons?: Button[][]) =>
  tg("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: html,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: keyboard(buttons ?? []),
  });

export const editButtons = (chatId: number, messageId: number, buttons: Button[][]) =>
  tg("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: keyboard(buttons) });

export const answerCallback = (id: string, text?: string) => tg("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}) });
