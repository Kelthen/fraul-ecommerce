// Textes du bot Telegram de Jean Paul (Fraul) : message de commande, blocs à transférer, carte de vérification.
// docs/PARCOURS-COMMANDE.md §2 et §7 : Fraul voit prix et marge ; les blocs « à transférer » n'ont
// ni prix ni adresse du client ; la fiche d'expédition passe par un lien qui expire.
// Pur : HTML Telegram (parse_mode=HTML), aucune base, aucun réseau (testé dans messages.test.ts).

export type RelayLine = {
  title: string;
  brand: string;
  color: string;
  size: string;
  qty: number;
  supplierRef?: string;
  /** Lien vers la fiche (photo) chez le fournisseur ou sur notre site. */
  link?: string;
};

export type RelayParcel = {
  id: string;
  /** Nom interne du fournisseur (jamais montré au client). */
  supplier: string;
  lines: RelayLine[];
  forwardedAt?: string | null;
  receivedAt?: string | null;
};

export type RelayOrder = {
  number: string;
  isDemo: boolean;
  /** Montant payé, déjà formaté (« 358 USD »). */
  total: string;
  /** Marge estimée, déjà formatée ; absente si inconnue. */
  margin?: string;
  firstName: string;
  city: string;
  parcels: RelayParcel[];
  sheetUrl: string;
  sheetExpires: string;
};

/** Échappe le texte pour le mode HTML de Telegram. */
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Bloc à coller tel quel dans WeChat : chinois + anglais, sans prix ni adresse du client. */
export function supplierBlock(orderNumber: string, p: RelayParcel): string {
  const lines = [
    `订单 Order ${orderNumber}`,
    "请寄给发货人，包裹上写订单号。",
    "Please send to our shipper and write the order number on the parcel.",
    ...p.lines.map((l) =>
      [
        `• ${l.qty} 件 pc · ${[l.brand, l.title].filter(Boolean).join(" ")} · ${l.color} · 尺码 size ${l.size}`,
        l.supplierRef ? `  编号 ref ${l.supplierRef}` : "",
        l.link ? `  ${l.link}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ];
  return lines.join("\n");
}

export function parcelCount(o: Pick<RelayOrder, "parcels">): string {
  const n = o.parcels.length;
  return n === 1 ? "1 colis attendu" : `${n} colis attendus`;
}

/** Message envoyé à Jean Paul quand une commande est payée. */
export function orderMessage(o: RelayOrder): string {
  const head = [
    `${o.isDemo ? "🧪 <b>COMMANDE TEST</b> — rien à expédier\n" : ""}🛍 <b>Nouvelle commande ${esc(o.number)}</b>`,
    `Payée ${esc(o.total)}${o.margin ? ` · marge estimée ${esc(o.margin)}` : ""}`,
    `Client : ${esc(o.firstName)} · ${esc(o.city)} · ${parcelCount(o)}`,
  ].join("\n");
  const blocks = o.parcels.map(
    (p) => `\n<b>── À transférer : ${esc(p.supplier)} ──</b>\n<pre>${esc(supplierBlock(o.number, p))}</pre>`,
  );
  const sheet = [
    "\n<b>── Fiche d'expédition (pour l'expéditeur) ──</b>",
    `<pre>${esc(`发货单 Shipping sheet ${o.number}\n${o.sheetUrl}`)}</pre>`,
    `Lien valable jusqu'au ${esc(o.sheetExpires)}. Chaque ouverture est enregistrée.`,
    "\nQuand l'expéditeur envoie le code de suivi, transfère-moi son message (« FRL-… → code »).",
  ].join("\n");
  return [head, ...blocks, sheet].join("\n");
}

export type Button = { text: string; data: string };

/** Boutons du message de commande : transféré, puis reçu chez l'expéditeur, colis par colis. */
export function orderButtons(o: Pick<RelayOrder, "parcels">): Button[][] {
  return o.parcels.map((p) => {
    if (!p.forwardedAt) return [{ text: `✅ Transféré à ${p.supplier}`, data: `fwd:${p.id}` }];
    if (!p.receivedAt) return [{ text: `📥 Colis reçu de ${p.supplier}`, data: `rcv:${p.id}` }];
    return [{ text: `✔︎ ${p.supplier} : reçu`, data: `noop:${p.id}` }];
  });
}

export type CardOrder = { number: string; firstName: string; city: string; articles: number; isDemo: boolean };

/** Carte de vérification avant d'enregistrer un code de suivi. */
export function trackingCard(code: string, o: CardOrder): string {
  return [
    `🔎 <b>Vérifie avant d'enregistrer</b>${o.isDemo ? " (commande test)" : ""}`,
    `Code <code>${esc(code)}</code>`,
    `→ <b>${esc(o.number)}</b> · ${esc(o.firstName)} · ${esc(o.city)} · ${o.articles} article${o.articles > 1 ? "s" : ""}`,
  ].join("\n");
}

export const cardButtons = (submissionId: string): Button[][] => [
  [
    { text: "✅ Confirmer", data: `ok:${submissionId}` },
    { text: "✖️ Annuler", data: `no:${submissionId}` },
  ],
];

export const UNDO_MINUTES = 15;

export function confirmedCard(code: string, o: CardOrder): string {
  return `${trackingCard(code, o).replace("🔎 <b>Vérifie avant d'enregistrer</b>", "✅ <b>Code enregistré</b>")}\nLa commande passe « En transit ». Le client est prévenu dans ${UNDO_MINUTES} min.`;
}

export const undoButtons = (submissionId: string): Button[][] => [[{ text: `↩️ Annuler (${UNDO_MINUTES} min)`, data: `undo:${submissionId}` }]];

/** Pourquoi un code est refusé, en clair pour Jean Paul. */
export const REFUSALS = {
  unknownOrder: (n: string) => `⛔ ${esc(n)} : commande introuvable. Vérifie le numéro sur la fiche.`,
  alreadyTracked: (n: string) => `⛔ ${esc(n)} a déjà un code de suivi. Pour le changer, annule d'abord l'ancien.`,
  codeUsed: (c: string, other: string) => `⛔ Le code <code>${esc(c)}</code> est déjà enregistré sur ${esc(other)}.`,
  notReady: (n: string) => `⛔ ${esc(n)} n'est pas encore payée ou a été annulée.`,
  unreadable: (lines: string[]) =>
    `⚠️ Je n'ai pas compris ${lines.length > 1 ? "ces lignes" : "cette ligne"} (il faut « FRL-… → code ») :\n${lines.map((l) => `• ${esc(l)}`).join("\n")}`,
};
