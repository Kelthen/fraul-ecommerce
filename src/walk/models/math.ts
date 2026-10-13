// Petits calculs partagés par le mall et la boutique (aucune page, aucun three.js).

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Accélère puis freine (cubique). */
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Passage doux de 0 à 1 entre a et b. */
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Distance entre deux points au sol [x, z]. */
export const dist2 = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
