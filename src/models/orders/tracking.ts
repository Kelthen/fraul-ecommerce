// Suivi d'une commande côté client : 4 étapes, une phrase qui change sur l'étape en cours,
// une livraison estimée en fourchette dès le paiement (docs/PARCOURS-COMMANDE.md §7.1, validé par Serge le 19 oct. 2026).
// Pur : aucune date « maintenant » cachée, tout est passé en paramètre (testable, et prêt pour la vraie base).
import type { ZoneId } from "../pricing/config.ts";

export const STAGES = [
  { id: "payee", label: "Payée" },
  { id: "traitement", label: "En cours de traitement" },
  { id: "transit", label: "En transit" },
  { id: "livree", label: "Livrée" },
] as const;
export type StageId = (typeof STAGES)[number]["id"];

/**
 * Où en est la commande, du plus tôt au plus tard. Chaque point fait avancer la phrase ;
 * l'étape affichée s'en déduit (`stageOf`). « payee » est franchie au paiement : on passe tout de suite
 * en traitement (Serge : statut « En cours de traitement » dès le paiement).
 */
export const STEPS = [
  { id: "paid", stage: "traitement", text: "Paiement reçu. Tes pièces sont commandées." },
  { id: "preparing", stage: "traitement", text: "Tes pièces sont en préparation." },
  { id: "gathered", stage: "traitement", text: "Tout est réuni, on emballe." },
  { id: "shipped", stage: "transit", text: "Ton colis est parti. Code de suivi actif." },
  { id: "flying", stage: "transit", text: "En vol vers toi." },
  { id: "customs", stage: "transit", text: "Arrivé, en passage en douane. Droits et taxes déjà payés." },
  { id: "out", stage: "transit", text: "Chez le livreur, bientôt à ta porte." },
  { id: "delivered", stage: "livree", text: "Livré. Profite bien." },
] as const;
export type StepId = (typeof STEPS)[number]["id"];

export const stepOf = (id: StepId) => STEPS.find((s) => s.id === id)!;
export const stageIndex = (id: StepId) => STAGES.findIndex((s) => s.id === stepOf(id).stage);

/**
 * Délais en jours après le paiement : préparation (réunir les pièces chez l'expéditeur) + transport par zone.
 * Objectifs CLAUDE.md §9 : USA/UK < 10 j, Canada < 14 j, France ~14 j.
 * ⚠️ Valeurs « décidé par l'équipe, à confirmer » avec les vrais délais de l'expéditeur.
 */
export const PREP_DAYS = 3;
export const TRANSIT_DAYS: Record<ZoneId, [number, number]> = { us: [4, 7], uk: [4, 7], ca: [7, 11], eu: [8, 11] };

const DAY = 86_400_000;

/**
 * Fourchette de livraison. `prepDays` = délai du fournisseur le plus lent de la commande (§7.1), jamais moins que PREP_DAYS.
 * Une fois expédiée, on repart de la date d'expédition (plus juste).
 */
export function deliveryWindow(o: { paidAt: number; shippedAt?: number; zone: ZoneId; prepDays?: number }): { from: number; to: number } {
  const [min, max] = TRANSIT_DAYS[o.zone];
  const start = o.shippedAt ?? o.paidAt + Math.max(PREP_DAYS, o.prepDays ?? PREP_DAYS) * DAY;
  return { from: start + min * DAY, to: start + max * DAY };
}

/** « entre le 28 oct. et le 2 nov. » (même mois : « entre le 3 et le 7 nov. »). */
export function formatWindow(w: { from: number; to: number }, timeZone?: string): string {
  const f = (t: number, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { ...o, timeZone }).format(t);
  const sameMonth = f(w.from, { month: "numeric", year: "numeric" }) === f(w.to, { month: "numeric", year: "numeric" });
  const from = f(w.from, sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" });
  return `entre le ${from} et le ${f(w.to, { day: "numeric", month: "short" })}`;
}

export type OrderLine = {
  name: string;
  brand: string;
  size?: string;
  qty: number;
  /** Rupture après paiement : article retiré de la commande et remboursé (§7.2). */
  refundedAt?: number;
};

export type Order = {
  /** Numéro lisible, aussi code de suivi Fraul (ex. FRL-1042). */
  id: string;
  paidAt: number;
  shippedAt?: number;
  deliveredAt?: number;
  zone: ZoneId;
  prepDays?: number;
  step: StepId;
  lines: OrderLine[];
};

export type TrackingView = {
  stage: number;
  text: string;
  /** Fourchette tant que ce n'est pas livré. */
  window?: string;
  refunds: OrderLine[];
};

export function trackingView(o: Order, timeZone?: string): TrackingView {
  const s = stepOf(o.step);
  return {
    stage: stageIndex(o.step),
    text: s.text,
    window: s.id === "delivered" ? undefined : formatWindow(deliveryWindow(o), timeZone),
    refunds: o.lines.filter((l) => l.refundedAt),
  };
}

/** Code tapé par le client → forme rangée (« frl 1042 » → « FRL-1042 »). Null si ce n'est pas un code Fraul. */
export function normalizeCode(raw: string): string | null {
  const m = raw.trim().toUpperCase().match(/^FRL[\s-]*(\d{3,8})$/);
  return m ? `FRL-${m[1]}` : null;
}
