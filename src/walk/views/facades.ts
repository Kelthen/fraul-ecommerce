// Les 3 architectures de boutique du mall (Serge, 4 nov. 2026). Le type de chaque boutique : shopType (models/mall-layout.ts).
// La porte (4,8 m × 4,2 m) et les vitrines de côté restent au même endroit : mannequins et intérieur marchent partout.
// Une façade doit rester légère : une quinzaine de pièces au plus, le mall peut compter des dizaines de boutiques.
import type * as T from "three";

type Opts = {
  type: number;
  bg: string;
  ceil: number;
  /** Enseigne déjà dessinée (nom ou logo). */
  sign: T.Texture;
};

export function createFacade(THREE: typeof T, { type, bg, ceil, sign }: Opts) {
  const g = new THREE.Group();
  const std = (c: number, r: number, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const box = (w: number, h: number, d: number, mat: T.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };
  const brand = new THREE.MeshStandardMaterial({ color: new THREE.Color(bg).getHex(), roughness: 0.6, metalness: 0.05, emissive: new THREE.Color(bg).getHex(), emissiveIntensity: 0.05 });
  const signMat = new THREE.MeshBasicMaterial({ map: sign });
  const light = new THREE.MeshBasicMaterial({ color: 0xfffaf0 });
  const placeSign = (w: number, h: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), signMat);
    m.position.set(0, y, z);
    g.add(m);
  };
  const doorFrame = (mat: T.Material) => {
    [-2.4, 2.4].forEach((x) => box(0.07, 4.2, 0.08, mat, x, 2.1, 0.42));
    box(4.87, 0.07, 0.08, mat, 0, 4.2, 0.42);
    box(4.8, 0.02, 0.04, light, 0, 0.012, 0.44);
  };
  const lintel = (mat: T.Material) => box(4.8, ceil - 4.2, 0.4, mat, 0, 4.2 + (ceil - 4.2) / 2, 0.2);
  const sides = (mat: T.Material, d = 0.4, z = 0.2) => [-1, 1].forEach((s) => box(1.75, ceil, d, mat, s * 3.25, ceil / 2, z));

  if (type === 1) {
    // Verrière : côtés vitrés, grand bandeau à la couleur de la marque qui avance au-dessus de la porte.
    const glass = std(0xcfd8d9, 0.15, 0.35);
    const metal = std(0x2a2a2d, 0.35, 0.6);
    [-1, 1].forEach((s) => {
      box(1.75, 4.2, 0.12, glass, s * 3.25, 2.1, 0.34);
      box(1.75, 0.4, 0.2, brand, s * 3.25, 0.2, 0.36);
      box(0.06, 4.2, 0.08, metal, s * 4.1, 2.1, 0.42);
    });
    box(8.3, ceil - 4.2, 0.9, brand, 0, 4.2 + (ceil - 4.2) / 2, 0.45);
    box(8.3, 0.03, 0.06, light, 0, 4.18, 0.86);
    placeSign(6.2, 1.21, 5.3, 0.91);
    doorFrame(metal);
  } else if (type === 2) {
    // Portique : mur de pierre, colonnes, fronton à la couleur de la marque, vitrines encadrées, laiton.
    const stone = std(0xe9e1d2, 0.7);
    const column = std(0xf5f0e6, 0.45);
    const brass = std(0xc8a96a, 0.35, 0.6);
    sides(stone);
    lintel(stone);
    [-1, 1].forEach((s) => {
      box(1.55, 3.4, 0.05, brand, s * 3.25, 1.8, 0.38); // cadre de la vitrine : le fond lumineux vient devant
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 3.84, 14), column);
      c.position.set(s * 2.62, 2.1, 0.72);
      g.add(c);
      box(0.5, 0.2, 0.5, column, s * 2.62, 0.1, 0.72);
      box(0.5, 0.16, 0.5, column, s * 2.62, 4.1, 0.72);
    });
    box(6.4, 1.0, 0.85, brand, 0, 4.68, 0.6);
    box(6.8, 0.1, 1.0, column, 0, 5.23, 0.6);
    placeSign(4.6, 0.9, 4.68, 1.04);
    doorFrame(brass);
  } else {
    // Enseigne : mur plein à la couleur de la marque.
    const metal = std(0xc9c3b9, 0.3, 0.7);
    sides(brand);
    lintel(brand);
    placeSign(4.6, 0.9, 5.2, 0.41);
    doorFrame(metal);
  }
  return g;
}
