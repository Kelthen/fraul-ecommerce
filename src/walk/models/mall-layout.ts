// Plan du mall en T (docs/fraul-walk-plan-T.png) : dimensions et emplacement des 27 vitrines.
// Changer la forme du T ou l'écart entre vitrines, c'est ici.

/** Largeur d'une vitrine. */
export const SLOT = 8.5;
/** Demi-largeur du tronc du T, et longueur du tronc depuis la barre. */
export const STEM_X = 7;
export const STEM_END = 50;
/** Demi-longueur de la barre du T, et position de son mur du haut. */
export const BAR_X = 33;
export const BAR_Z = -32;
/** Hauteur sous plafond. */
export const CEIL = 6.4;

/** Une vitrine : centre (x, z) et direction vers l'allée (nx, nz). */
export type Slot = { x: number; z: number; nx: number; nz: number };

/** Les 27 vitrines dans l'ordre de la promenade : vitrines toujours à droite du visiteur. */
export const SLOTS: Slot[] = (() => {
  const s: Slot[] = [], put = (x: number, z: number, nx: number, nz: number) => s.push({ x, z, nx, nz });
  [37.75, 29.25, 20.75, 12.25].forEach((z) => put(STEM_X, z, -1, 0));          // 1-4 : on monte le tronc
  [11.5, 20, 28.5].forEach((x) => put(x, 0, 0, -1));                            // 5-7 : barre, mur du bas à droite
  [-7.5, -16, -24.5].forEach((z) => put(BAR_X, z, -1, 0));                      // 8-10 : bout droit
  [25.5, 17, 8.5, 0, -8.5, -17, -25.5].forEach((x) => put(x, BAR_Z, 0, 1));     // 11-17 : mur du haut
  [-24.5, -16, -7.5].forEach((z) => put(-BAR_X, z, 1, 0));                      // 18-20 : bout gauche
  [-28.5, -20, -11.5].forEach((x) => put(x, 0, 0, -1));                         // 21-23 : barre, mur du bas à gauche
  [12.25, 20.75, 29.25, 37.75].forEach((z) => put(-STEM_X, z, 1, 0));           // 24-27 : on redescend
  return s;
})();
