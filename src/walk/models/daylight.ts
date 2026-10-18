// Lumière du mall selon l'heure locale du visiteur (décision de Rhamone, 18 oct. 2026) :
// la journée comme aujourd'hui ; dès 17 h la lumière baisse et se réchauffe ; à 19 h c'est plus sombre
// et éclairé (vitrines, plafonniers) ; la nuit, sombre mais jamais noir.
import { clamp, lerp } from "./math.ts";

export type Daylight = {
  /** 0 = plein jour, 1 = pleine nuit. */
  night: number;
  /** Intensités : lumière d'ambiance (ciel / sol) et soleil. */
  hemi: number;
  sun: number;
  /** Couleur du fond et du brouillard, et teinte de l'ambiance (0xRRGGBB). */
  sky: number;
  tint: number;
  label: "jour" | "soir" | "nuit";
};

const DAY_SKY = 0xf3efe8, NIGHT_SKY = 0x3b3440; // prune sombre : jamais noir
const DAY_TINT = 0xffffff, NIGHT_TINT = 0xffd9ae; // la nuit, lumière chaude
/** Plancher : même à 3 h du matin, on voit les boutiques. */
export const MIN_HEMI = 0.3;

const mix = (a: number, b: number, t: number) => {
  const ch = (c: number, s: number) => (c >> s) & 255;
  return [16, 8, 0].reduce((acc, s) => acc | (Math.round(lerp(ch(a, s), ch(b, s), t)) << s), 0);
};

/** Part de nuit pour une heure décimale (ex. 19.5 = 19 h 30). */
export function nightAt(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 8 && h < 17) return 0;
  if (h >= 17 && h < 21) return clamp((h - 17) / 4, 0, 1) ** 0.8; // crépuscule : 19 h ≈ 0,57
  if (h >= 6 && h < 8) return 1 - (h - 6) / 2; // aube
  return 1;
}

export function daylightAt(hour: number): Daylight {
  const n = nightAt(hour);
  return {
    night: n,
    hemi: lerp(0.92, MIN_HEMI, n),
    sun: lerp(0.35, 0, n),
    sky: mix(DAY_SKY, NIGHT_SKY, n),
    tint: mix(DAY_TINT, NIGHT_TINT, n),
    label: n < 0.15 ? "jour" : n < 0.8 ? "soir" : "nuit",
  };
}

/** Heure décimale locale du visiteur. */
export const localHour = (d = new Date()) => d.getHours() + d.getMinutes() / 60;
