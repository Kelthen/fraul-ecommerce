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
  /** Prénom Telegram de la personne qui a touché le bouton. */
  forwardedBy?: string | null;
  receivedBy?: string | null;
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

/** Date et heure courtes (« 21 oct. à 12:04 »), fuseau de l'équipe (STATUS, Infos client). */
const TZ = "America/Toronto";
const DAY_FMT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: TZ });
const TIME_FMT = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const when = (iso: string) => `${DAY_FMT.format(new Date(iso))} à ${TIME_FMT.format(new Date(iso))}`;

const by = (name?: string | null) => (name ? ` (${esc(name)})` : "");

/** Une ligne d'état par fournisseur, en tête du message : on voit d'un coup d'œil ce qui reste à faire. */
export function parcelStatusLine(p: RelayParcel): string {
  const name = `<b>${esc(p.supplier)}</b>`;
  if (p.receivedAt) return `📥 ${name} : colis reçu ${when(p.receivedAt)}${by(p.receivedBy)}`;
  if (p.forwardedAt) return `✅ ${name} : transféré ${when(p.forwardedAt)}${by(p.forwardedBy)}`;
  return `⏳ ${name} : à transférer`;
}

/** Titre du message selon l'avancement : il change quand tout est transféré, puis quand tout est reçu. */
export function orderTitle(o: Pick<RelayOrder, "number" | "parcels">): string {
  const n = esc(o.number);
  if (o.parcels.length && o.parcels.every((p) => p.receivedAt)) return `📦 <b>Tous les colis reçus · ${n}</b>`;
  if (o.parcels.length && o.parcels.every((p) => p.forwardedAt)) return `✅ <b>Tout transféré · ${n}</b>`;
  return `🛍 <b>Nouvelle commande ${n}</b>`;
}

/** Message envoyé à Jean Paul quand une commande est payée ; réécrit à chaque bouton touché. */
export function orderMessage(o: RelayOrder): string {
  const head = [
    `${o.isDemo ? "🧪 <b>COMMANDE TEST</b> — rien à expédier\n" : ""}${orderTitle(o)}`,
    `Payée ${esc(o.total)}${o.margin ? ` · marge estimée ${esc(o.margin)}` : ""}`,
    `Client : ${esc(o.firstName)} · ${esc(o.city)} · ${parcelCount(o)}`,
    "",
    ...o.parcels.map(parcelStatusLine),
  ].join("\n");
  const blocks = o.parcels.map(
    (p) =>
      `\n<b>── ${p.forwardedAt ? "✅ Transféré" : "À transférer"} : ${esc(p.supplier)} ──</b>\n<pre>${esc(supplierBlock(o.number, p))}</pre>`,
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

export const UNDO_MINUTES = 15;

/** Dernière action sur ce colis encore annulable (moins de UNDO_MINUTES), sinon null. */
export function undoableStep(p: Pick<RelayParcel, "forwardedAt" | "receivedAt">, now: number): "received" | "forwarded" | null {
  const recent = (iso?: string | null) => !!iso && now - Date.parse(iso) <= UNDO_MINUTES * 60_000;
  if (p.receivedAt) return recent(p.receivedAt) ? "received" : null;
  if (p.forwardedAt) return recent(p.forwardedAt) ? "forwarded" : null;
  return null;
}

/**
 * Boutons du message de commande, colis par colis : « Transféré », puis « Colis reçu ».
 * Un « ↩️ » à côté pendant UNDO_MINUTES après chaque geste, en cas de mauvais bouton.
 */
export function orderButtons(o: Pick<RelayOrder, "parcels">, now = Date.now()): Button[][] {
  return o.parcels.map((p) => {
    const row: Button[] = !p.forwardedAt
      ? [{ text: `✅ Transféré à ${p.supplier}`, data: `fwd:${p.id}` }]
      : !p.receivedAt
        ? [{ text: `📥 Colis reçu de ${p.supplier}`, data: `rcv:${p.id}` }]
        : [{ text: `✔︎ ${p.supplier} : reçu`, data: `noop:${p.id}` }];
    if (undoableStep(p, now)) row.push({ text: "↩️ Annuler", data: `unf:${p.id}` });
    return row;
  });
}

// ───────────────────────── /afaire : ce qui reste ─────────────────────────

export type TodoOrder = {
  orderId: string;
  number: string;
  isDemo: boolean;
  /** Lien direct vers le message de la commande (groupes Telegram seulement), sinon null. */
  link: string | null;
  toForward: string[];
  toReceive: string[];
};

/** Lien vers un message : possible seulement dans un supergroupe (identifiant en -100…). */
export function messageLink(chatId: number | null, messageId: number | null): string | null {
  if (!chatId || !messageId) return null;
  const s = String(chatId);
  return s.startsWith("-100") ? `https://t.me/c/${s.slice(4)}/${messageId}` : null;
}

/** Réponse à /afaire : blocs à transférer, puis colis attendus chez l'expéditeur. */
export function todoMessage(list: TodoOrder[]): string {
  const forward = list.filter((o) => o.toForward.length);
  const receive = list.filter((o) => o.toReceive.length);
  if (!forward.length && !receive.length) return "✅ Rien en attente : tout est transféré et reçu.";
  const ref = (o: TodoOrder) => {
    const n = `${esc(o.number)}${o.isDemo ? " (test)" : ""}`;
    return o.link ? `<a href="${esc(o.link)}">${n}</a>` : n;
  };
  const count = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
  const parts: string[] = [];
  if (forward.length) {
    const n = forward.reduce((s, o) => s + o.toForward.length, 0);
    parts.push(`⏳ <b>${count(n, "bloc à transférer", "blocs à transférer")}</b>`, ...forward.map((o) => `• ${ref(o)} → ${o.toForward.map(esc).join(", ")}`));
  }
  if (receive.length) {
    const n = receive.reduce((s, o) => s + o.toReceive.length, 0);
    if (parts.length) parts.push("");
    parts.push(`📥 <b>${count(n, "colis attendu", "colis attendus")} chez l'expéditeur</b>`, ...receive.map((o) => `• ${ref(o)} ← ${o.toReceive.map(esc).join(", ")}`));
  }
  if (list.some((o) => !o.link)) parts.push("", "Touche un numéro ci-dessous pour retrouver la commande en bas du fil.");
  return parts.join("\n");
}

/** Sans lien possible (conversation privée) : un bouton par commande pour la renvoyer en bas du fil. */
export const todoButtons = (list: TodoOrder[]): Button[][] =>
  list
    .filter((o) => !o.link && (o.toForward.length || o.toReceive.length))
    .slice(0, 20)
    .map((o) => [{ text: `🔁 ${o.number}`, data: `rsd:${o.orderId}` }]);

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

export function confirmedCard(code: string, o: CardOrder, who?: string | null): string {
  return `${trackingCard(code, o).replace("🔎 <b>Vérifie avant d'enregistrer</b>", `✅ <b>Code enregistré</b>${by(who)}`)}\nLa commande passe « En transit ». Le client est prévenu dans ${UNDO_MINUTES} min.`;
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
