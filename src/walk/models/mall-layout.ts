// Mesures communes à tous les modes de mall, et forme d'une vitrine.
// La disposition des vitrines (le T aujourd'hui) est un « mode » : src/walk/modes/.

/** Largeur d'une vitrine. */
export const SLOT = 8.5;
/** Hauteur sous plafond. */
export const CEIL = 6.4;

/** Une vitrine : centre (x, z) et direction vers l'allée (nx, nz). */
export type Slot = { x: number; z: number; nx: number; nz: number };

/** Point du parcours de la caméra : position au sol (x, z) et point regardé (x, y, z). */
export type PathNode = { p: [number, number]; l: [number, number, number] };

/** Ce qu'un mode de mall calcule pour n boutiques : vitrines dans l'ordre de la promenade, entrée, sortie. */
export type MallLayout<D = Record<string, number>> = {
  slots: Slot[];
  /** Comptoir de la Conciergerie : arrêt après les `after` premières boutiques (décision de Rhamone, 18 oct. 2026). */
  concierge: { after: number; slot: Slot };
  entry: PathNode;
  exit: PathNode;
  /** Dimensions propres au mode (utilisées pour construire les murs, le sol, le plafond). */
  dims: D;
};
