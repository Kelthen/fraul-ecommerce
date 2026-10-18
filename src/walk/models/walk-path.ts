// Parcours de la caméra dans le mall : entrée → un arrêt face à chaque vitrine → la Caisse → sortie.
// Changer la vitesse ressentie, les pauses ou la hauteur du regard, c'est ici.
import { clamp, ease, lerp } from "./math.ts";
import type { MallLayout, PathNode } from "./mall-layout.ts";

/** Hauteur des yeux, hauteur du point regardé, part de chaque étape passée à l'arrêt (pause). */
export const EYE = 1.75;
export const LOOK_Y = 2.3;
export const DWELL = 0.45;

type Node = PathNode;

/** Arrêts qui ne sont pas des boutiques. */
export const AT_ENTRY = -1, AT_EXIT = -2, AT_CAISSE = -3;
/** On s'arrête plus près du comptoir de la Caisse que d'une vitrine. */
const CAISSE_DIST = 0.6;

/** Boutique regardée : index de 0 à n-1, ou AT_ENTRY, AT_CAISSE, AT_EXIT. */
export type PathPoint = { x: number; z: number; lx: number; ly: number; lz: number; shop: number; intro: number };

/**
 * Position de la caméra pour un avancement p (0 = entrée, 1 = sortie), avec n boutiques,
 * la caméra à `dist` mètres de la vitrine (dépend de la taille de l'écran), dans le plan `mall` (src/walk/modes).
 */
export function pathAt(p: number, n: number, dist: number, mall: MallLayout): PathPoint {
  const { slots: SLOTS, caisse: C, entry: ENTRY, exit: EXIT } = mall;
  const stop = (k: number): Node => {
    const s = SLOTS[k];
    return { p: [s.x + s.nx * dist, s.z + s.nz * dist], l: [s.x, LOOK_Y, s.z] };
  };
  const caisse: Node = { p: [C.x + C.nx * dist * CAISSE_DIST, C.z + C.nz * dist * CAISSE_DIST], l: [C.x, LOOK_Y - 1.1, C.z] }; // regard plus bas : le comptoir monte dans l'écran, au-dessus du panneau
  // Étapes : 0 entrée, 1..n boutiques, n+1 Caisse, n+2 sortie.
  const node = (j: number) => (j === 0 ? ENTRY : j <= n ? stop(j - 1) : j === n + 1 ? caisse : EXIT);
  const at = (j: number) => (j === 0 ? AT_ENTRY : j <= n ? j - 1 : j === n + 1 ? AT_CAISSE : AT_EXIT);
  const u = clamp(p, 0, 1) * (n + 2);
  const i = Math.min(Math.floor(u), n + 1), t = Math.min(u - i, 1);
  const a = node(i), b = node(i + 1), dw = i === 0 ? 0 : DWELL;
  const m = t <= dw ? 0 : ease((t - dw) / (1 - dw));
  const shop = i === 0 ? (t > 0.55 ? 0 : AT_ENTRY) : at(m < 0.5 ? i : i + 1);
  return { x: lerp(a.p[0], b.p[0], m), z: lerp(a.p[1], b.p[1], m), lx: lerp(a.l[0], b.l[0], m), ly: lerp(a.l[1], b.l[1], m), lz: lerp(a.l[2], b.l[2], m), shop, intro: i === 0 ? 1 - t : 0 };
}

/** Avancement qui place la caméra juste devant la boutique k (utilisé pour « sauter » à une boutique). */
export const progressForShop = (k: number, n: number) => (k + 1 + 0.1) / (n + 2);
/** Avancement qui place la caméra devant la Caisse. */
export const progressForCaisse = (n: number) => (n + 1 + 0.1) / (n + 2);
