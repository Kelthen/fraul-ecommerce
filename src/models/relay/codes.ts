// Codes de commande et codes de suivi : lecture des messages que Fraul transfère au bot.
// Règle (docs/PARCOURS-COMMANDE.md §2) : un code de suivi arrive TOUJOURS collé à un numéro de commande,
// « FRL-2026-000123 → LP123456789CN ». Fraul ne choisit jamais la commande à la main.
// Pur : aucune base, aucun réseau (testé dans codes.test.ts).

/** Numéro de commande Fraul rangé. Accepte « FRL-2026-000123 », « frl 2026 123 » et l'ancien format court « FRL-1042 ». */
export function normalizeOrderNumber(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  const long = s.match(/^FRL[\s-]*(20\d{2})[\s-]*(\d{1,6})$/);
  if (long) return `FRL-${long[1]}-${long[2].padStart(6, "0")}`;
  const short = s.match(/^FRL[\s-]*(\d{3,8})$/);
  return short ? `FRL-${short[1]}` : null;
}

/**
 * Code de suivi plausible : 8 à 40 lettres ou chiffres, au moins un chiffre.
 * Couvre les formats usuels (LP123456789CN, YT…, 1Z…, 4PX…, numéros DHL/FedEx).
 */
export function normalizeTrackingCode(raw: string): string | null {
  const s = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  return /^[A-Z0-9]{8,40}$/.test(s) && /\d/.test(s) ? s : null;
}

export type TrackingPair = { order: string; code: string };
export type ParseResult = { pairs: TrackingPair[]; rejected: string[] };

const ORDER_IN_LINE = /FRL[\s-]*(?:20\d{2}[\s-]*\d{1,6}|\d{3,8})/i;

/**
 * Lit un message : une paire par ligne, séparateurs libres (→, ->, :, =, espace).
 * Une ligne sans numéro FRL, ou sans code valable, est rejetée (jamais devinée).
 * Une même commande citée deux fois avec deux codes différents : les deux lignes sont rejetées.
 */
export function parseTrackingMessage(text: string): ParseResult {
  const pairs: TrackingPair[] = [];
  const rejected: string[] = [];
  for (const line of text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const m = line.match(ORDER_IN_LINE);
    const order = m ? normalizeOrderNumber(m[0]) : null;
    if (!m || !order) {
      rejected.push(line);
      continue;
    }
    const rest = (line.slice(0, m.index) + " " + line.slice(m.index! + m[0].length)).replace(/→|->|=>|:|=|,|;/g, " ");
    const codes = rest.split(/\s+/).map(normalizeTrackingCode).filter((c): c is string => !!c);
    if (codes.length !== 1) {
      rejected.push(line);
      continue;
    }
    pairs.push({ order, code: codes[0] });
  }
  // Conflits : même commande, codes différents → on ne garde rien pour cette commande.
  const byOrder = new Map<string, Set<string>>();
  for (const p of pairs) byOrder.set(p.order, (byOrder.get(p.order) ?? new Set()).add(p.code));
  const clean: TrackingPair[] = [];
  const seen = new Set<string>();
  for (const p of pairs) {
    if (byOrder.get(p.order)!.size > 1) {
      rejected.push(`${p.order} ${p.code}`);
      continue;
    }
    const key = `${p.order}|${p.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push(p);
  }
  return { pairs: clean, rejected };
}
