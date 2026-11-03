// Un e-mail de commande (emails.ts) mis en forme pour l'envoi. Pur (testé dans tracking.test.ts).
// Styles écrits dans le HTML : les boîtes mail ignorent le reste. Tout texte variable est protégé.
import { lineLabel, type OrderEmail } from "./emails.ts";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const absolute = (href: string, base: string) => `${base.replace(/\/$/, "")}${href}`;

export function emailText(m: OrderEmail, base: string): string {
  return [m.title, "", ...m.body, "", ...m.lines.map(lineLabel), "", `${m.cta.label} : ${absolute(m.cta.href, base)}`, "", "TakeUrClothes"].join("\n");
}

export function emailHtml(m: OrderEmail, base: string): string {
  const para = m.body.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#0A0A0C">${esc(p)}</p>`).join("");
  const lines = m.lines.map((l) => `<li style="padding:6px 0;font-size:14px;color:#0A0A0C">${esc(lineLabel(l))}</li>`).join("");
  return (
    `<!doctype html><html lang="fr"><body style="margin:0;background:#FFFEF7;font-family:Helvetica,Arial,sans-serif">` +
    `<div style="display:none;max-height:0;overflow:hidden">${esc(m.preheader)}</div>` +
    `<div style="max-width:520px;margin:0 auto;padding:32px 20px">` +
    `<p style="margin:0 0 24px;font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#0A0A0C">TakeUrClothes</p>` +
    `<h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:30px;font-weight:normal;color:#0A0A0C">${esc(m.title)}</h1>` +
    para +
    (lines ? `<ul style="list-style:none;margin:18px 0;padding:12px 0;border-top:1px solid #EAE0C8;border-bottom:1px solid #EAE0C8">${lines}</ul>` : "") +
    `<p style="margin:24px 0 0"><a href="${esc(absolute(m.cta.href, base))}" style="display:inline-block;padding:13px 24px;border-radius:999px;background:#680209;color:#FFFEF7;font-size:14px;text-decoration:none">${esc(m.cta.label)}</a></p>` +
    `</div></body></html>`
  );
}
