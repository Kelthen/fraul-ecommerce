// Parcours de la caméra dans le mall : entrée → un arrêt face à chaque vitrine (avec Fraul Finds en route) → la Caisse (si le sac
// n'est pas vide) → sortie.
// Changer la vitesse ressentie, les pauses ou la hauteur du regard, c'est ici.
import { clamp, ease, lerp } from "./math.ts";
import type { MallLayout, PathNode } from "./mall-layout.ts";

/** Hauteur des yeux, hauteur du point regardé, part de chaque étape passée à l'arrêt (pause). */
export const EYE = 1.75;
export const LOOK_Y = 2.3;
export const DWELL = 0.45;

type Node = PathNode;

/** Arrêts qui ne sont pas des boutiques. */
export const AT_ENTRY = -1, AT_EXIT = -2, AT_CAISSE = -3, AT_CONCIERGE = -4;
/** On s'arrête plus près du comptoir Fraul Finds que d'une vitrine. */
const CONCIERGE_DIST = 0.7;
/** Et plus près encore du comptoir de la Caisse. */
const CAISSE_DIST = 0.6;
/** Nombre d'étapes après l'entrée : les vitrines, Fraul Finds, la Caisse si elle est là, la sortie. */
export const lastStop = (n: number, withCaisse = false) => n + 2 + (withCaisse ? 1 : 0);

/** Boutique regardée : index de 0 à n-1, ou AT_ENTRY, AT_CONCIERGE, AT_CAISSE, AT_EXIT. */
export type PathPoint = { x: number; z: number; lx: number; ly: number; lz: number; shop: number; intro: number };

/**
 * Position de la caméra pour un avancement p (0 = entrée, 1 = sortie), avec n boutiques,
 * la caméra à `dist` mètres de la vitrine (dépend de la taille de l'écran), dans le plan `mall` (src/walk/modes).
 * `withCaisse` : arrêt à la Caisse avant la sortie, seulement quand le sac contient au moins un article.
 */
export function pathAt(p: number, n: number, dist: number, mall: MallLayout, withCaisse = false): PathPoint {
  const { slots: SLOTS, concierge: CON, caisse: CA, entry: ENTRY, exit: EXIT } = mall;
  const stop = (k: number): Node => {
    const s = SLOTS[k];
    return { p: [s.x + s.nx * dist, s.z + s.nz * dist], l: [s.x, LOOK_Y, s.z] };
  };
  const c = CON.slot, cd = dist * CONCIERGE_DIST;
  const concierge: Node = { p: [c.x + c.nx * cd, c.z + c.nz * cd], l: [c.x, LOOK_Y - 1, c.z] }; // regard plus bas : le comptoir et le « F » montent au-dessus du panneau
  const ca = dist * CAISSE_DIST, caisse: Node = { p: [CA.x + CA.nx * ca, CA.z + CA.nz * ca], l: [CA.x, LOOK_Y - 1.1, CA.z] };
  // Étapes : 0 entrée, puis les boutiques avec Fraul Finds après les `after` premières, la Caisse (n + 2) si elle est là, la sortie.
  const last = lastStop(n, withCaisse);
  const node = (j: number): Node => (j === 0 ? ENTRY : j === last ? EXIT : j === n + 2 ? caisse : j - 1 < CON.after ? stop(j - 1) : j - 1 === CON.after ? concierge : stop(j - 2));
  const at = (j: number) => (j === 0 ? AT_ENTRY : j === last ? AT_EXIT : j === n + 2 ? AT_CAISSE : j - 1 < CON.after ? j - 1 : j - 1 === CON.after ? AT_CONCIERGE : j - 2);
  const u = clamp(p, 0, 1) * last;
  const i = Math.min(Math.floor(u), last - 1), t = Math.min(u - i, 1);
  const a = node(i), b = node(i + 1), dw = i === 0 ? 0 : DWELL;
  const m = t <= dw ? 0 : ease((t - dw) / (1 - dw));
  const shop = i === 0 ? (t > 0.55 ? at(1) : AT_ENTRY) : at(m < 0.5 ? i : i + 1);
  return { x: lerp(a.p[0], b.p[0], m), z: lerp(a.p[1], b.p[1], m), lx: lerp(a.l[0], b.l[0], m), ly: lerp(a.l[1], b.l[1], m), lz: lerp(a.l[2], b.l[2], m), shop, intro: i === 0 ? 1 - t : 0 };
}

/** Avancement de l'arrêt j (0 entrée, 1…n+1 vitrines et Fraul Finds, puis la Caisse, puis la sortie) : un point d'arrêt du défilement. */
export const stopProgress = (j: number, n: number, withCaisse = false) => {
  const last = lastStop(n, withCaisse);
  return j <= 0 ? 0 : j >= last ? 1 : (j + 0.1) / last;
};
/** Avancement qui place la caméra juste devant la boutique k (utilisé pour « sauter » à une boutique). */
export const progressForShop = (k: number, n: number, mall: MallLayout, withCaisse = false) => stopProgress(k + 1 + (k >= mall.concierge.after ? 1 : 0), n, withCaisse);
/** Avancement qui place la caméra face au comptoir Fraul Finds. */
export const progressForConcierge = (n: number, mall: MallLayout, withCaisse = false) => stopProgress(mall.concierge.after + 1, n, withCaisse);
/** Avancement qui place la caméra face à la Caisse. */
export const progressForCaisse = (n: number) => stopProgress(n + 2, n, true);
