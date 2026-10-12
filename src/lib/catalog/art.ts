import type { CategoryId } from "./types";

// Tracés des dessins provisoires (repris de la démo V2), partagés par le site
// (SVG) et par le Fraul Walk (textures canvas).
export const GARMENT_PATHS: Record<CategoryId, string> = {
  tee: "M30 8 L42 4 Q50 13 58 4 L70 8 L93 27 L81 41 L72 34 L72 106 L28 106 L28 34 L19 41 L7 27 Z",
  hoodie: "M31 10 Q50 -3 69 10 L93 34 L86 98 L76 97 L74 48 L74 106 L26 106 L26 48 L24 97 L14 98 L7 34 Z",
  pants: "M26 6 H74 L79 106 H56 L50 40 L44 106 H21 Z",
  sneaker: "M10 74 C10 61 22 57 32 56 L50 47 C58 43 66 45 72 53 L88 63 C95 67 95 72 94 76 L10 78 Z",
  cap: "M14 74 C14 46 30 34 50 34 C68 34 80 44 82 64 L96 70 Q100 73 96 76 L14 76 Z",
  bag: "M20 48 H80 Q86 48 86 54 V90 Q86 96 80 96 H20 Q14 96 14 90 V54 Q14 48 20 48 Z",
};
