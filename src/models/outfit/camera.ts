// Cadrages de la caméra du mannequin 3D : un par emplacement, plus la vue d'ensemble.
// Montre → poignet, lunettes → visage, bijoux → cou… Régler un zoom, c'est ici.
import type { WearSlot } from "./slots.ts";

/**
 * Point regardé (x, y, z en mètres, repère du mannequin : pieds au sol, face vers la caméra),
 * distance de la caméra, et rotation du mannequin (radians ; positif = il tourne son côté gauche vers nous).
 */
export type Shot = { target: [number, number, number]; dist: number; yaw: number };

export const OVERVIEW: Shot = { target: [0, 0.93, 0], dist: 4.3, yaw: 0.25 };

export const SHOTS: Record<WearSlot, Shot> = {
  cap: { target: [0, 1.82, 0], dist: 0.9, yaw: 0.5 },
  glasses: { target: [0, 1.77, 0.06], dist: 0.55, yaw: 0.15 },
  neck: { target: [0, 1.47, 0.08], dist: 0.7, yaw: 0.1 },
  watch: { target: [-0.27, 0.9, 0.05], dist: 0.62, yaw: 1.25 },
  top: { target: [0, 1.28, 0], dist: 1.4, yaw: 0.15 },
  layer: { target: [0, 1.22, 0], dist: 1.6, yaw: 0.35 },
  bottom: { target: [0, 0.62, 0], dist: 1.8, yaw: 0.2 },
  socks: { target: [0, 0.2, 0.03], dist: 0.85, yaw: 0.5 },
  shoes: { target: [0, 0.1, 0.05], dist: 0.95, yaw: 0.6 },
};

/** Distance de caméra permise quand le client pince ou fait tourner la molette. */
export const DIST_MIN = 0.35;
export const DIST_MAX = 5.5;
