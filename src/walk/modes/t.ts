// Mode « T » (docs/fraul-walk-plan-T.png) : on entre par le bas du tronc, vitrines toujours à droite,
// on monte le tronc, on fait le tour de la barre, on redescend. Le T s'allonge s'il y a plus de boutiques.
import { CEIL, SLOT, type MallLayout, type Slot } from "../models/mall-layout.ts";

export type TDims = { SLOT: number; CEIL: number; STEM_X: number; STEM_END: number; BAR_X: number; BAR_Z: number };

/** Plan de base : 27 vitrines (tronc 4 + 4, bas de barre 3 + 3, bouts 3 + 3, mur du haut 7). */
const BASE = { stem: 4, low: 3, end: 3, top: 7 };
const STEM_X = 7;
const BAR_Z = -32;

/**
 * Répartit n boutiques sur le T. Au-delà de 27, on ajoute à tour de rôle une vitrine de chaque côté
 * du tronc (le tronc s'allonge), puis deux au mur du haut (la barre s'élargit).
 */
export function counts(n: number) {
  const c = { ...BASE };
  for (let extra = Math.max(0, n - 27), turn = 0; extra > 0; turn++) {
    if (turn % 2 === 0) { c.stem += 1; extra -= 2; } else { c.top += 2; extra -= 2; }
  }
  return c;
}

export function layoutT(n: number): MallLayout<TDims> {
  const c = counts(n);
  const STEM_END = 24.5 + (c.stem - 1) * SLOT;
  const BAR_X = Math.max(33, ((c.top - 1) / 2) * SLOT + 7.5);
  const s: Slot[] = [];
  const put = (x: number, z: number, nx: number, nz: number) => s.push({ x, z, nx, nz });
  const spread = (a: number, b: number, k: number) => Array.from({ length: k }, (_, i) => (k === 1 ? (a + b) / 2 : a + ((b - a) * i) / (k - 1)));
  const stemZ = Array.from({ length: c.stem }, (_, i) => 12.25 + i * SLOT);           // du bas de la barre vers l'entrée
  const lowX = spread(STEM_X + 4.5, BAR_X - 4.5, c.low);
  const endZ = [-7.5, -16, -24.5];
  const topX = spread(((c.top - 1) / 2) * SLOT, -((c.top - 1) / 2) * SLOT, c.top);

  [...stemZ].reverse().forEach((z) => put(STEM_X, z, -1, 0));       // on monte le tronc (côté droit)
  lowX.forEach((x) => put(x, 0, 0, -1));                              // barre, mur du bas à droite
  endZ.forEach((z) => put(BAR_X, z, -1, 0));                          // bout droit
  topX.forEach((x) => put(x, BAR_Z, 0, 1));                           // mur du haut
  [...endZ].reverse().forEach((z) => put(-BAR_X, z, 1, 0));           // bout gauche
  [...lowX].reverse().forEach((x) => put(-x, 0, 0, -1));              // barre, mur du bas à gauche
  stemZ.forEach((z) => put(-STEM_X, z, 1, 0));                        // on redescend le tronc

  return {
    slots: s,
    // Contre le mur gauche du bas du tronc (pas de vitrine à cet endroit), juste avant les portes.
    caisse: { x: -STEM_X + 0.9, z: STEM_END - 4, nx: 1, nz: 0 },
    entry: { p: [0, STEM_END + 9], l: [0, 2.2, 18] },
    exit: { p: [0, STEM_END + 9], l: [0, 2.2, STEM_END + 40] },
    dims: { SLOT, CEIL, STEM_X, STEM_END, BAR_X, BAR_Z },
  };
}

export const T_MODE = { id: "t", label: "Mall en T", layout: layoutT } as const;
