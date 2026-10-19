// Comptoir « Fraul Finds » (pièces sur demande), au pied du grand « F » au centre du mall : on y demande une pièce
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
  const pearl = std(0xeae0c8, 0.3), wine = std(0x680209, 0.45), brass = std(0xc8a96a, 0.3, 0.8);
  const arc = (r: number, h: number, y: number, mat: T.Material) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40, 1, true, -Math.PI / 3, (2 * Math.PI) / 3), mat);
    m.material.side = THREE.DoubleSide;
    m.position.y = y;
    g.add(m);
  };
  arc(1.6, 1.0, 0.5, pearl);
  arc(1.61, 0.12, 0.78, wine);
  const top = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.75, 40, 1, -Math.PI / 2 - Math.PI / 3, (2 * Math.PI) / 3), std(0xfffef7, 0.25));
  top.rotation.x = -Math.PI / 2;
  top.position.y = 1.01;
  top.material.side = THREE.DoubleSide;
  g.add(top);

  // Enseigne sur pied laiton, lisible depuis l'allée.
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 320;
  const k = c.getContext("2d")!;
  k.fillStyle = "#FFFEF7"; k.fillRect(0, 0, c.width, c.height);
  k.strokeStyle = "#680209"; k.lineWidth = 6; k.strokeRect(16, 16, c.width - 32, c.height - 32);
  k.fillStyle = "#420A0D"; k.textAlign = "center"; k.textBaseline = "middle";
  k.font = `600 120px ${serif}`; k.fillText(title, 512, 140);
  k.font = `500 38px ${sans}`; k.fillText(sub.toUpperCase(), 512, 250);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.69), new THREE.MeshBasicMaterial({ map: tex }));
  sign.position.set(0, 2.05, 0.9);
  g.add(sign);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.7, 10), brass);
  pole.position.set(0, 0.85, 0.88);
  g.add(pole);
  return { group: g };
}
