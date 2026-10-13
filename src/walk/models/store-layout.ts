// Plan de l'intérieur d'une boutique (même gabarit pour toutes les marques).
// Changer la place d'un rayon ou d'un portant, c'est ici.
import { dist2, lerp } from "./math.ts";

type Spot = { p: [number, number]; look: [number, number, number] };

/** Endroits où la caméra s'arrête : porte, centre, et devant chaque rayon. */
export const STORE_ZONES: Record<string, Spot> = {
  door: { p: [0, 2.8], look: [0, 1.5, -16] }, hub: { p: [0, -3.2], look: [0, 1.45, -16] },
  tee: { p: [-2.2, -6.4], look: [-6, 0.75, -6.4] }, hoodie: { p: [-2.2, -12.4], look: [-6, 0.75, -12.4] },
  pants: { p: [2.2, -11.9], look: [6, 0.6, -11.9] }, cap: { p: [2.5, -4.8], look: [6, 0.85, -4.8] },
  sneaker: { p: [-2.9, -12.9], look: [-3.75, 0.95, -16] }, bag: { p: [0, -6.3], look: [0, 0.35, -8.8] },
};

type V3 = [number, number, number];
/**
 * Portant d'un rayon : origine, sens du défilement, côté vers l'allée, espacement, taille des articles,
 * et réglages du « tirer l'article » (pull, rise) et du zoom (close).
 */
export type Rack = { o: V3; d: V3; out: V3; sp: number; size: [number, number]; pull: number; rise: number; close: number };

export const RACKS: Record<string, Rack> = {
  tee: { o: [-5.5, 1.375, -6.4], d: [0, 0, -1], out: [1, 0, 0], sp: 0.62, size: [0.68, 0.85], pull: 0.75, rise: 0.05, close: 1.0 },
  hoodie: { o: [-5.5, 1.375, -12.4], d: [0, 0, -1], out: [1, 0, 0], sp: 0.62, size: [0.68, 0.85], pull: 0.75, rise: 0.05, close: 1.0 },
  pants: { o: [5.5, 1.3, -11.9], d: [0, 0, 1], out: [-1, 0, 0], sp: 0.62, size: [0.8, 1.0], pull: 0.75, rise: 0.05, close: 0.85 },
  cap: { o: [5.8, 1.52, -4.8], d: [0, 0, 1], out: [-1, 0, 0], sp: 0.5, size: [0.46, 0.5], pull: 0.6, rise: 0.04, close: 1.5 },
  sneaker: { o: [-3.75, 1.53, -15.7], d: [1, 0, 0], out: [0, 0, 1], sp: 0.62, size: [0.58, 0.32], pull: 0.6, rise: 0.1, close: 2.0 },
  bag: { o: [0, 1.12, -8.8], d: [1, 0, 0], out: [0, 0, 1], sp: 0.42, size: [0.38, 0.42], pull: 0.45, rise: 0.42, close: 1.7 },
};

/** Îlot central, à contourner quand on marche d'un rayon à l'autre. */
export const ISLAND = { x0: -1.9, x1: 1.9, z0: -10.2, z1: -7.4 };

function crossesIsland(a: number[], b: number[]) {
  for (let k = 0; k <= 24; k++) {
    const t = k / 24, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t);
    if (x > ISLAND.x0 && x < ISLAND.x1 && z > ISLAND.z0 && z < ISLAND.z1) return true;
  }
  return false;
}

/** Chemin de a à b au sol : direct, ou par le coin le plus court qui contourne l'îlot. */
export function route(a: number[], b: number[]): number[][] {
  if (!crossesIsland(a, b)) return [a, b];
  let best: { c: number[]; L: number } | null = null;
  for (const c of [[2.7, -8.8], [-2.7, -8.8], [2.7, -6.6], [-2.7, -6.6], [2.7, -11], [-2.7, -11]]) {
    if (crossesIsland(a, c) || crossesIsland(c, b)) continue;
    const L = dist2(a, c) + dist2(c, b);
    if (!best || L < best.L) best = { c, L };
  }
  return [a, best ? best.c : [2.7, -8.8], b];
}
