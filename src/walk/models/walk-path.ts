// Parcours de la caméra dans le mall : entrée → un arrêt face à chaque vitrine → sortie.
// Changer la vitesse ressentie, les pauses ou la hauteur du regard, c'est ici.
import { clamp, ease, lerp } from "./math.ts";
import { STEM_END, SLOTS } from "./mall-layout.ts";

/** Hauteur des yeux, hauteur du point regardé, part de chaque étape passée à l'arrêt (pause). */
export const EYE = 1.75;
export const LOOK_Y = 2.3;
export const DWELL = 0.45;

type Node = { p: [number, number]; l: [number, number, number] };
export const ENTRY: Node = { p: [0, STEM_END + 9], l: [0, 2.2, 18] };
export const EXIT: Node = { p: [0, STEM_END + 9], l: [0, 2.2, STEM_END + 40] };

/** Boutique regardée : index de 0 à n-1, ou -1 = entrée, -2 = sortie. */
export type PathPoint = { x: number; z: number; lx: number; ly: number; lz: number; shop: number; intro: number };

/**
 * Position de la caméra pour un avancement p (0 = entrée, 1 = sortie), avec n boutiques
 * et la caméra à `dist` mètres de la vitrine (dépend de la taille de l'écran).
 */
export function pathAt(p: number, n: number, dist: number): PathPoint {
  const stop = (k: number): Node => {
    const s = SLOTS[k];
    return { p: [s.x + s.nx * dist, s.z + s.nz * dist], l: [s.x, LOOK_Y, s.z] };
  };
  const node = (j: number) => (j === 0 ? ENTRY : j === n + 1 ? EXIT : stop(j - 1));
  const u = clamp(p, 0, 1) * (n + 1);
  const i = Math.min(Math.floor(u), n), t = Math.min(u - i, 1);
  const a = node(i), b = node(i + 1), dw = i === 0 ? 0 : DWELL;
  const m = t <= dw ? 0 : ease((t - dw) / (1 - dw));
  const shop = i === 0 ? (t > 0.55 ? 0 : -1) : m < 0.5 ? i - 1 : i < n ? i : -2;
  return { x: lerp(a.p[0], b.p[0], m), z: lerp(a.p[1], b.p[1], m), lx: lerp(a.l[0], b.l[0], m), ly: lerp(a.l[1], b.l[1], m), lz: lerp(a.l[2], b.l[2], m), shop, intro: i === 0 ? 1 - t : 0 };
}

/** Avancement qui place la caméra juste devant la boutique k (utilisé pour « sauter » à une boutique). */
export const progressForShop = (k: number, n: number) => (k + 1 + 0.1) / (n + 1);
