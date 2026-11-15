// Comptoir « Finds » (pièces sur demande), au pied du grand « TUC » au centre du mall : on y demande une pièce
// introuvable dans les boutiques (décision de Rhamone, 18 oct. 2026). Texte : src/content/walk.ts.
import type * as T from "three";

type Opts = { x: number; z: number; nx: number; nz: number; title: string; sub: string; serif: string; sans: string };

/** Comptoir en arc (perle, bandeau bordeaux) tourné vers l'allée (nx, nz), enseigne sur pied. */
export function createConciergeDesk(THREE: typeof T, { x, z, nx, nz, title, sub, serif, sans }: Opts) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = Math.atan2(nx, nz);
  // Couleurs de la charte en sRGB, converties pour le rendu (sinon le bordeaux sort rouge vif).
  const std = (c: number, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: new THREE.Color(c).convertSRGBToLinear(), roughness: r, metalness: m });
  const pearl = std(0xeae0c8, 0.3), wine = std(0x680209, 0.45);
  const arc = (r: number, h: number, y: number, mat: T.Material) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40, 1, true, -Math.PI / 3, (2 * Math.PI) / 3), mat);
    m.material.side = THREE.DoubleSide;
    m.position.y = y;
    g.add(m);
  };
  arc(1.6, 1.0, 0.5, pearl);
  arc(1.61, 0.3, 0.62, wine);
  const top = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.75, 40, 1, -Math.PI / 2 - Math.PI / 3, (2 * Math.PI) / 3), std(0xfffef7, 0.25));
  top.rotation.x = -Math.PI / 2;
  top.position.y = 1.01;
  top.material.side = THREE.DoubleSide;
  g.add(top);

  // Inscription sur la façade du comptoir (plan #109, lot 3) : elle ne cache plus le « TUC » comme l'ancien panneau sur pied.
  // Lettres ivoire sur un large bandeau bordeaux qui suit la courbe ; mêmes textes (src/content/walk.ts).
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 256;
  const k = c.getContext("2d")!;
  k.fillStyle = "#680209"; k.fillRect(0, 0, c.width, c.height);
  k.fillStyle = "#C8A96A"; k.fillRect(0, 10, c.width, 4); k.fillRect(0, c.height - 14, c.width, 4); // filets laiton
  k.fillStyle = "#FFFEF7"; k.textAlign = "center"; k.textBaseline = "middle";
  k.font = `600 150px ${serif}`;
  const tw = k.measureText(title).width;
  k.font = `500 58px ${sans}`;
  const sw = k.measureText(sub.toUpperCase()).width, gap = 60, x0 = 1024 - (tw + gap + sw) / 2;
  k.font = `600 150px ${serif}`; k.textAlign = "left"; k.fillText(title, x0, 128);
  k.font = `500 58px ${sans}`; k.fillText(sub.toUpperCase(), x0 + tw + gap, 138);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 4;
  // Le texte occupe le milieu de l'arc (120°) : on le dessine sur 80° seulement, centré face à l'allée.
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.612, 1.612, 0.3, 48, 1, true, -(2 * Math.PI) / 9, (4 * Math.PI) / 9), new THREE.MeshBasicMaterial({ map: tex }));
  band.position.y = 0.62;
  g.add(band);
  return { group: g };
}
