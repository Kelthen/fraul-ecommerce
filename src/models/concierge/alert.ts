// Message à l'équipe pour une demande Finds. Pur (testé dans alert.test.ts).
// Le texte vient d'un visiteur : protégé, et sans lien cliquable ni aperçu.
import { esc } from "../relay/messages.ts";
import type { ConciergeRequest } from "./request.ts";

export function findsAlert(r: ConciergeRequest): string {
  const parts = [`🔎 <b>Demande Finds</b>`, `<b>${esc(r.item)}</b>${r.brand ? ` · ${esc(r.brand)}` : ""}${r.size ? ` · ${esc(r.size)}` : ""}`];
  if (r.note) parts.push(esc(r.note));
  if (r.link) parts.push(`Lien : <code>${esc(r.link)}</code>`);
  parts.push(`Répondre à : ${esc(r.email)}`);
  return parts.join("\n");
}
