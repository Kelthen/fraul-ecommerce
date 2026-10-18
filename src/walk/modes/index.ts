// Modes de mall : chaque mode dispose les boutiques à sa façon (le T aujourd'hui).
// Ajouter un mode : un fichier ici (sa fonction layout + sa construction de scène dans le moteur),
// puis une ligne dans MODES. Le nombre de boutiques vient toujours de la liste des marques.
import { T_MODE } from "./t.ts";

export const MODES = { t: T_MODE } as const;
export type MallModeId = keyof typeof MODES;

/** Mode utilisé par le site. Changer de forme de mall, c'est ici. */
export const DEFAULT_MODE: MallModeId = "t";

export const getMode = (id: MallModeId = DEFAULT_MODE) => MODES[id] ?? MODES[DEFAULT_MODE];
