// Textes du bot Telegram de Jean Paul (Fraul) : message de commande, blocs à envoyer aux fournisseurs, carte de vérification.
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

/** Nom affiché quand c'est l'expéditeur qui a coché « reçu » sur sa fiche. */
export const SHIPPER = "l'expéditeur";

/** Une ligne d'état par fournisseur, en tête du message : on voit d'un coup d'œil ce qui reste à faire. */
export function parcelStatusLine(p: RelayParcel): string {
  const name = `<b>${esc(p.supplier)}</b>`;
  if (p.receivedAt) return `📥 ${name} : reçu chez l'expéditeur ${when(p.receivedAt)}${by(p.receivedBy)}`;
  if (p.forwardedAt) return `📤 ${name} : envoyé au fournisseur ${when(p.forwardedAt)}${by(p.forwardedBy)}`;
  return `⏳ ${name} : à envoyer au fournisseur`;
}

/** Titre du message selon l'avancement : il change quand tout est envoyé, puis quand tout est reçu. */
export function orderTitle(o: Pick<RelayOrder, "number" | "parcels">): string {
  const n = esc(o.number);
  if (o.parcels.length && o.parcels.every((p) => p.receivedAt)) return `📦 <b>Tous les colis reçus · ${n}</b> — l'expéditeur peut expédier`;
  if (o.parcels.length && o.parcels.every((p) => p.forwardedAt)) return `📤 <b>Tout envoyé aux fournisseurs · ${n}</b>`;
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
      `\n<b>── ${p.forwardedAt ? "📤 Envoyé" : "À envoyer"} : ${esc(p.supplier)} ──</b>\n<pre>${esc(supplierBlock(o.number, p))}</pre>`,
  );
  const sheet = [
    "\n<b>── Fiche d'expédition (pour l'expéditeur) ──</b>",
    `<pre>${esc(`发货单 Shipping sheet ${o.number}\n${o.sheetUrl}`)}</pre>`,
    `Lien valable jusqu'au ${esc(o.sheetExpires)}. L'expéditeur y coche chaque colis reçu ; je préviens ici.`,
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
 * Boutons du message de commande : seulement la prochaine étape de chaque colis, rien une fois tout fait.
 * « 📤 J'ai envoyé à A », puis (secours, si l'expéditeur n'a pas coché sa fiche) « 📥 A reçu par l'expéditeur ».
 * « ↩️ Corriger » pendant UNDO_MINUTES après un geste ; la question « Oui / Non » arrive dans un NOUVEAU
 * message (undoQuestion) : rien ne bouge sous le doigt, un second tap ne peut pas tomber sur « Oui ».
 */
export function orderButtons(o: Pick<RelayOrder, "parcels">, now = Date.now()): Button[][] {
  const rows: Button[][] = [];
  for (const p of o.parcels) {
    const step = undoableStep(p, now);
    const row: Button[] = [];
    if (!p.forwardedAt) row.push({ text: `📤 J'ai envoyé à ${p.supplier}`, data: `fwd:${p.id}` });
    else if (!p.receivedAt) row.push({ text: `📥 ${p.supplier} reçu par l'expéditeur`, data: `rcv:${p.id}` });
    if (step) row.push({ text: row.length ? "↩️" : `↩️ Corriger : ${p.supplier}`, data: `unq:${p.id}` });
    if (row.length) rows.push(row);
  }
  return rows;
}

/**
 * Question posée en bas du fil après « ↩️ Corriger ». L'étape est dans « Oui » :
 * un double-tap ne peut pas défaire deux étapes d'affilée.
 */
export function undoQuestion(orderNumber: string, p: Pick<RelayParcel, "id" | "supplier">, step: "received" | "forwarded"): { text: string; buttons: Button[][] } {
  const what = step === "received" ? "« reçu chez l'expéditeur »" : "« envoyé au fournisseur »";
  return {
    text: `↩️ <b>${esc(orderNumber)}</b> : annuler ${what} pour <b>${esc(p.supplier)}</b> ?`,
    buttons: [
      [
        { text: "Oui, annuler", data: `unf:${p.id}:${step === "received" ? "r" : "f"}` },
        { text: "✖️ Non", data: `keep:${p.id}` },
      ],
    ],
  };
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
  if (!forward.length && !receive.length) return "✅ Rien en attente : tout est envoyé et reçu.";
  const ref = (o: TodoOrder) => {
    const n = `${esc(o.number)}${o.isDemo ? " (test)" : ""}`;
    return o.link ? `<a href="${esc(o.link)}">${n}</a>` : n;
  };
  const count = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
  const parts: string[] = [];
  if (forward.length) {
    const n = forward.reduce((s, o) => s + o.toForward.length, 0);
    parts.push(`⏳ <b>${count(n, "bloc à envoyer", "blocs à envoyer")} aux fournisseurs</b>`, ...forward.map((o) => `• ${ref(o)} → ${o.toForward.map(esc).join(", ")}`));
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

export type CardOrder = { number: string; firstName: string; city: string; articles: number; isDemo: boolean; missing?: string[] };

const cardBody = (code: string, o: CardOrder) => [
  `Code <code>${esc(code)}</code>`,
  `→ <b>${esc(o.number)}</b> · ${esc(o.firstName)} · ${esc(o.city)} · ${o.articles} article${o.articles > 1 ? "s" : ""}`,
];

/** Carte de vérification avant d'enregistrer un code de suivi ; avertit s'il manque un colis chez l'expéditeur. */
export function trackingCard(code: string, o: CardOrder): string {
  const missing = o.missing ?? [];
  return [
    `🔎 <b>Vérifie avant d'enregistrer</b>${o.isDemo ? " (commande test)" : ""}`,
    ...cardBody(code, o),
    ...(missing.length ? ["", `⚠️ Pas encore reçu chez l'expéditeur : <b>${missing.map(esc).join(", ")}</b>. Tout est bien dans le colis ?`] : []),
  ].join("\n");
}

export const cardButtons = (submissionId: string): Button[][] => [
  [
    { text: "✅ Confirmer", data: `ok:${submissionId}` },
    { text: "✖️ Annuler", data: `no:${submissionId}` },
  ],
];

export function confirmedCard(code: string, o: CardOrder, who?: string | null): string {
  return [`✅ <b>Code enregistré</b>${by(who)}${o.isDemo ? " (commande test)" : ""}`, ...cardBody(code, o), "La commande passe « En transit »."].join("\n");
}

/** Après ✅ : un seul bouton « Corriger » ; la question arrive dans un nouveau message. Il disparaît après UNDO_MINUTES. */
export const undoButtons = (submissionId: string): Button[][] => [[{ text: `↩️ Corriger (${UNDO_MINUTES} min)`, data: `undq:${submissionId}` }]];

export const undoCodeQuestion = (code: string, orderNumber: string, submissionId: string) => ({
  text: `↩️ Retirer le code <code>${esc(code)}</code> de <b>${esc(orderNumber)}</b> ?`,
  buttons: [
    [
      { text: "Oui, retirer", data: `undo:${submissionId}` },
      { text: "✖️ Non", data: `keepc:${submissionId}` },
    ],
  ] as Button[][],
});

/** Pourquoi un code est refusé, en clair pour Jean Paul. */
export const REFUSALS = {
  unknownOrder: (n: string) => `⛔ ${esc(n)} : commande introuvable. Vérifie le numéro sur la fiche.`,
  alreadyTracked: (n: string) => `⛔ ${esc(n)} a déjà un code de suivi. Pour le changer, annule d'abord l'ancien.`,
  codeUsed: (c: string, other: string) => `⛔ Le code <code>${esc(c)}</code> est déjà enregistré sur ${esc(other)}.`,
  notReady: (n: string) => `⛔ ${esc(n)} n'est pas encore payée ou a été annulée.`,
  unreadable: (lines: string[]) =>
    `⚠️ Je n'ai pas compris ${lines.length > 1 ? "ces lignes" : "cette ligne"} (il faut « FRL-… → code ») :\n${lines.map((l) => `• ${esc(l)}`).join("\n")}`,
};
