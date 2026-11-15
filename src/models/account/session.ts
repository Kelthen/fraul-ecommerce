// Durée d'une session client sur l'appareil. Pur (testé dans session.test.ts).
// Durées choisies par l'équipe le 5 nov. 2026, à confirmer avec Rhamone.

export const IDLE_DAYS = 30;
export const MAX_DAYS = 90;
const DAY = 86_400_000;
/** On ne réécrit pas le stockage à chaque geste : la dernière visite se note à l'heure près. */
const SEEN_EVERY = 3_600_000;

export type SessionTimes = { signedInAt: number; lastSeen: number };

/** Lit les dates gardées sur l'appareil. Une session d'avant cette règle commence aujourd'hui, sans déconnecter personne. */
export function readTimes(a: { signedInAt?: unknown; lastSeen?: unknown }, now: number): SessionTimes {
  const date = (v: unknown) => (typeof v === "number" && v > 0 && v <= now ? v : now);
  return { signedInAt: date(a.signedInAt), lastSeen: date(a.lastSeen) };
}

export const sessionExpired = (t: SessionTimes, now: number) => now - t.lastSeen > IDLE_DAYS * DAY || now - t.signedInAt > MAX_DAYS * DAY;

export const seenLongAgo = (t: SessionTimes, now: number) => now - t.lastSeen > SEEN_EVERY;
