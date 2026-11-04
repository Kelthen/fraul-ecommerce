// Silhouette féminine tirée du mannequin de Blender : épaules et taille plus fines, hanches et poitrine marquées.
// Utilisé par scripts/prep-mannequin.mjs --femme. Rhamone pourra remplacer le résultat par un vrai modèle de Blender.
import { transformPrimitive } from "@gltf-transform/functions";

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** Valeur lue dans une courbe [[hauteur, valeur], …], lissée entre deux points. */
function curve(points, y) {
  if (y <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [y1, v1] = points[i], [y0, v0] = points[i - 1];
    if (y <= y1) return v0 + (v1 - v0) * smooth(y0, y1, y);
  }
  return points[points.length - 1][1];
}

// Largeur et profondeur selon la hauteur (m) : chevilles, genoux, hanches, taille, poitrine, épaules, cou, tête.
const WIDTH = [[0.1, 0.86], [0.5, 0.86], [0.92, 1.03], [1.1, 0.78], [1.32, 0.86], [1.48, 0.8], [1.58, 0.72], [1.68, 0.86]];
const DEPTH = [[0.1, 0.9], [0.5, 0.88], [0.92, 1], [1.1, 0.82], [1.32, 0.92], [1.48, 0.86], [1.58, 0.74], [1.68, 0.88]];
const HEIGHT = 0.96;

export function deform([x, y, z], piece = "") {
  // Le tee reste par-dessus le jean à la taille ; le haut du jean rentre dessous.
  const hem = smooth(0.9, 1, y) * (1 - smooth(1.08, 1.2, y));
  const fit = piece === "Tee_Mannequin" ? 1 + 0.09 * hem : piece === "Pantalon" ? 1 - 0.05 * smooth(0.96, 1.03, y) : 1;
  x *= fit;
  z *= fit;
  let nz = z * curve(DEPTH, y);
  // Poitrine : devant seulement, plus forte au centre du buste.
  if (z > 0 && y > 1.14 && y < 1.46) {
    const up = smooth(1.14, 1.3, y) * (1 - smooth(1.3, 1.46, y));
    nz += 0.04 * up * Math.max(0, 1 - Math.abs(x) / 0.2);
  }
  // Fesses : derrière seulement.
  if (z < 0 && y > 0.74 && y < 1.08) nz -= 0.025 * smooth(0.74, 0.9, y) * (1 - smooth(0.9, 1.08, y));
  return [x * curve(WIDTH, y), y * HEIGHT, nz];
}

/** Applique la silhouette à toutes les pièces, sauf le socle ; les baskets gardent leur forme et suivent les jambes. */
export function feminize(root) {
  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    const name = node.getName();
    if (!mesh || name.startsWith("Socle")) continue;
    const shoe = name.startsWith("Basket");
    const own = mesh.clone();
    node.setMesh(own);
    own.listPrimitives().forEach((p) => {
      const prim = p.clone();
      own.removePrimitive(p);
      own.addPrimitive(prim);
      const pos = prim.getAttribute("POSITION").clone();
      prim.setAttribute("POSITION", pos);
      const nor = prim.getAttribute("NORMAL")?.clone();
      if (nor) prim.setAttribute("NORMAL", nor);
      transformPrimitive(prim, node.getWorldMatrix());
      const v = [0, 0, 0];
      for (let k = 0; k < pos.getCount(); k++) {
        pos.getElement(k, v);
        if (shoe) { // basket : réduite autour de sa cheville, posée sur le sol
          pos.setElement(k, [v[0] * 0.86, v[1] * HEIGHT, v[2] * 0.92]);
        } else pos.setElement(k, deform(v, name));
      }
    });
    node.setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]);
  }
}
