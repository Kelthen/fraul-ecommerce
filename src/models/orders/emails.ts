// Les 4 e-mails de commande (zone de Rhamone, docs/PARCOURS-COMMANDE.md §7) : textes seulement.
// Rien n'est envoyé ici : l'envoi viendra avec Supabase (zone de Serge), qui réutilisera ces textes.
// Ton du site : cool, classe, posé (L-43). Aucun pays nommé, aucun prix barré.
import { formatWindow, deliveryWindow, type Order, type OrderLine } from "./tracking.ts";

export const EMAIL_KINDS = ["paid", "shipped", "delivered", "unavailable"] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number];

export type OrderEmail = {
  kind: EmailKind;
  subject: string;
  /** Petite ligne grise affichée après l'objet dans la boîte mail. */
  preheader: string;
  title: string;
  body: string[];
  /** Pièces listées dans l'e-mail. */
  lines: OrderLine[];
  cta: { label: string; href: string };
};

/** « Nike · Air Max 90 · 42 », une ligne par pièce. */
export const lineLabel = (l: OrderLine) => `${l.brand} · ${l.name}${l.size ? ` · ${l.size}` : ""}${l.qty > 1 ? ` · ×${l.qty}` : ""}`;

/** `refunded` : la pièce retirée, pour l'e-mail « article indisponible ». */
export function orderEmail(kind: EmailKind, o: Order, opts: { timeZone?: string; refunded?: OrderLine } = {}): OrderEmail {
  const track = { label: "Suivre ma commande", href: `/suivi?code=${o.id}` };
  const kept = o.lines.filter((l) => !l.refundedAt);
  const win = formatWindow(deliveryWindow(o), opts.timeZone);
  // « … le 2 nov. » finit déjà par un point : pas de second point en fin de phrase.
  const end = (t: string) => (t.endsWith(".") ? t : `${t}.`);
  switch (kind) {
    case "paid":
      return {
        kind, lines: kept, cta: track,
        subject: `Commande ${o.id} confirmée`,
        preheader: end(`Livraison prévue ${win}`),
        title: "C'est validé.",
        body: [
          "Merci pour ta commande. On prépare tes pièces dès maintenant.",
          `${end(`Livraison prévue ${win}`)} Droits et taxes inclus : rien à payer à la livraison.`,
          "On t'écrit à chaque grande étape.",
        ],
      };
    case "shipped":
      return {
        kind, lines: kept, cta: track,
        subject: `${o.id} est en route`,
        preheader: end(`Livraison prévue ${win}`),
        title: "Ton colis est parti.",
        body: [
          "Tout est réuni dans un seul colis, et il est en route.",
          `${end(`Livraison prévue ${win}`)} Le suivi se met à jour à chaque passage du colis.`,
        ],
      };
    case "delivered":
      return {
        kind, lines: kept, cta: { label: "Retourner au mall", href: "/walk" },
        subject: `${o.id} est livrée`,
        preheader: "Profite bien.",
        title: "Livré.",
        body: [
          "Ton colis est arrivé. Profite bien de tes pièces.",
          "Un souci de taille ou de pièce ? Réponds simplement à cet e-mail.",
        ],
      };
    case "unavailable": {
      const r = opts.refunded ?? o.lines.find((l) => l.refundedAt);
      return {
        kind, lines: r ? [r] : [], cta: track,
        subject: `${o.id} : une pièce n'est plus disponible`,
        preheader: "Elle t'est remboursée, le reste suit son cours.",
        title: "Une pièce nous a échappé.",
        body: [
          "Désolé : cette pièce n'est plus disponible chez nos fournisseurs.",
          "Elle t'est remboursée sur ton moyen de paiement (quelques jours selon ta banque).",
          kept.length ? end(`Le reste de ta commande suit son cours, livraison prévue ${win}`) : "Ta commande ne contenait qu'elle : elle est remboursée en entier.",
          "Tu la veux quand même ? Fraul Finds la cherche pour toi.",
        ],
      };
    }
  }
}
