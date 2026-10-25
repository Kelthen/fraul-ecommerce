// Plan de l'intérieur d'une boutique (même gabarit pour toutes les marques).
// Changer la place d'un rayon ou d'un portant, c'est ici.
import { dist2, lerp } from "./math.ts";

type Spot = { p: [number, number]; look: [number, number, number] };

/** Endroits où la caméra s'arrête : porte, centre, et devant chaque rayon. */
export const STORE_ZONES: Record<string, Spot> = {
  door: { p: [0, 2.8], look: [0, 1.5, -16] }, hub: { p: [0, -3.2], look: [0, 1.45, -16] },
  tee: { p: [-2.2, -6.4], look: [-6, 0.75, -6.4] }, hoodie: { p: [-2.2, -12.4], look: [-6, 0.75, -12.4] },
  pants: { p: [2.2, -11.9], look: [6, 0.6, -11.9] }, cap: { p: [2.5, -4.8], look: [6, 0.85, -4.8] },
  sneaker: { p: [-3.75, -12.9], look: [-3.75, 0.95, -16] }, bag: { p: [0, -6.3], look: [0, 0.35, -8.8] },
};

type V3 = [number, number, number];
/**
 * Portant d'un rayon : origine, sens du défilement, côté vers l'allée, espacement, taille des articles,
 * et réglages du « tirer l'article » (pull, rise) et du zoom (close).
 * `pull` est grand : l'article choisi vient près de soi et occupe ~70 % de la largeur du téléphone (photo en grand, Rhamone 19 oct.).
 * `side` : portant de hauts vus de côté, serrés (pas entre deux pièces, en mètres) ; seule la pièce choisie se met de face
 * (Rhamone, 22 oct. : « dans le rayon, on n'affiche pas le devant »). `sp` est alors l'écart autour de la pièce choisie.
 * `len` : demi-longueur du portant ; au-delà, les pièces disparaissent (niche de la boutique en modules).
 */
export type Rack = { o: V3; d: V3; out: V3; sp: number; size: [number, number]; pull: number; rise: number; close: number; side?: number; len?: number };

export const RACKS: Record<string, Rack> = {
  tee: { o: [-5.5, 1.375, -6.4], d: [0, 0, -1], out: [1, 0, 0], sp: 0.62, size: [0.68, 0.85], pull: 1.8, rise: 0.18, close: 1.0, side: 0.17 },
  hoodie: { o: [-5.5, 1.375, -12.4], d: [0, 0, -1], out: [1, 0, 0], sp: 0.62, size: [0.68, 0.85], pull: 1.8, rise: 0.18, close: 1.0, side: 0.17 },
  pants: { o: [5.5, 1.3, -11.9], d: [0, 0, 1], out: [-1, 0, 0], sp: 0.62, size: [0.8, 1.0], pull: 1.5, rise: 0.18, close: 0.85 },
  cap: { o: [5.8, 1.52, -4.8], d: [0, 0, 1], out: [-1, 0, 0], sp: 0.5, size: [0.46, 0.5], pull: 1.6, rise: 0.04, close: 1.5 },
  sneaker: { o: [-3.75, 1.53, -15.7], d: [1, 0, 0], out: [0, 0, 1], sp: 0.62, size: [0.58, 0.32], pull: 0.95, rise: 0.1, close: 2.0 },
  bag: { o: [0, 1.12, -8.8], d: [1, 0, 0], out: [0, 0, 1], sp: 0.42, size: [0.34, 0.38], pull: 1.1, rise: 0.42, close: 1.8 },
};

/** Îlot central, à contourner quand on marche d'un rayon à l'autre. */
export const ISLAND = { x0: -1.9, x1: 1.9, z0: -10.2, z1: -7.4 };
const CORNERS = [[2.7, -8.8], [-2.7, -8.8], [2.7, -6.6], [-2.7, -6.6], [2.7, -11], [-2.7, -11]];

type Box = { x0: number; x1: number; z0: number; z1: number };
function crosses(box: Box, a: number[], b: number[]) {
  for (let k = 0; k <= 24; k++) {
    const t = k / 24, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t);
    if (x > box.x0 && x < box.x1 && z > box.z0 && z < box.z1) return true;
  }
  return false;
}

/** Chemin de a à b au sol : direct, ou par le coin le plus court qui contourne l'obstacle (îlot ou table). */
export function route(a: number[], b: number[], box: Box = ISLAND, corners: number[][] = CORNERS): number[][] {
  if (!crosses(box, a, b)) return [a, b];
  let best: { c: number[]; L: number } | null = null;
  for (const c of corners) {
    if (crosses(box, a, c) || crosses(box, c, b)) continue;
    const L = dist2(a, c) + dist2(c, b);
    if (!best || L < best.L) best = { c, L };
  }
  return [a, best ? best.c : corners[0], b];
}

/**
 * Boutique en modules, faite dans Blender par Rhamone (25 oct. 2026, public/models/boutique.glb) :
 * entrée (2,4 m), 3 travées de 2,4 m avec une niche de chaque côté, table (2,6 m), fond (1,2 m) ; 8 m de large.
 * Chaque niche porte un rayon : barre pour les vêtements suspendus, étagères pour casquettes et sneakers.
 * Les vêtements vus de côté glissent le long de la barre de la niche (`len` = demi-longueur visible).
 */
export const MODULES = {
  entree: 2.4, travee: 2.4, table: 2.6, fond: 1.2, travees: 3,
  /** Niche de chaque rayon : travée (0, 1, 2), côté (-1 gauche, 1 droite), barre ou étagères. */
  niches: { tee: [0, -1, "barre"], cap: [0, 1, "etageres"], hoodie: [1, -1, "barre"], pants: [1, 1, "barre"], sneaker: [2, -1, "etageres"], deco: [2, 1, "etageres"] } as Record<string, [number, number, "barre" | "etageres"]>,
};
/** Centre (z) de la niche de la travée k. */
const nicheZ = (k: number) => -(MODULES.entree + k * MODULES.travee + MODULES.travee / 2);
const TABLE_Z = -(MODULES.entree + MODULES.travees * MODULES.travee + 1.3);
const hang = (cat: string, extra: Partial<Rack> = {}): Rack => {
  const [k, side] = MODULES.niches[cat];
  return { o: [side * 3.64, 1.355, nicheZ(k)], d: [0, 0, -side], out: [-side, 0, 0], sp: 0.42, size: [0.68, 0.85], pull: 1.15, rise: 0.12, close: 0.9, side: 0.13, len: 0.7, ...extra };
};
const shelf = (cat: string, extra: Partial<Rack>): Rack => {
  const [k, side] = MODULES.niches[cat];
  return { o: [side * 3.7, 1.3, nicheZ(k)], d: [0, 0, -side], out: [-side, 0, 0], sp: 0.45, size: [0.5, 0.5], pull: 1.1, rise: 0.06, close: 1.3, len: 0.7, ...extra };
};
const look = (cat: string, y: number): Spot => {
  const [k, side] = MODULES.niches[cat];
  return { p: [side * -1.0, nicheZ(k)], look: [side * 3.8, y, nicheZ(k)] };
};
export const MODULE_LAYOUT = {
  zones: {
    door: { p: [0, 1.5], look: [0, 1.5, -13] }, hub: { p: [0.4, 0.6], look: [0, 1.4, -13.4] },
    tee: look("tee", 1.05), hoodie: look("hoodie", 1.05), pants: look("pants", 1.05), cap: look("cap", 1.2), sneaker: look("sneaker", 1.15),
    bag: { p: [0, TABLE_Z + 2.8], look: [0, 0.5, TABLE_Z] },
  } as Record<string, Spot>,
  racks: {
    tee: hang("tee"), hoodie: hang("hoodie"), pants: hang("pants", { size: [0.68, 1.0], o: [3.64, 1.28, nicheZ(1)] }),
    cap: shelf("cap", { size: [0.42, 0.46] }), sneaker: shelf("sneaker", { size: [0.5, 0.28], sp: 0.5 }),
    bag: { o: [0, 1.08, TABLE_Z], d: [1, 0, 0], out: [0, 0, 1], sp: 0.38, size: [0.32, 0.36], pull: 1.0, rise: 0.3, close: 1.6, len: 0.6 },
  } as Record<string, Rack>,
  /** La table au milieu, à contourner. */
  box: { x0: -0.9, x1: 0.9, z0: TABLE_Z - 1.1, z1: TABLE_Z + 1.1 },
  corners: [[1.6, TABLE_Z + 1.5], [-1.6, TABLE_Z + 1.5], [1.6, TABLE_Z - 1.5], [-1.6, TABLE_Z - 1.5]],
  tableZ: TABLE_Z, nicheZ,
};
