// « La Caisse » : comptoir bordeaux à plateau perle, enseigne au mur, sac Fraul et terminal posés dessus.
// Dernier arrêt du parcours avant les portes (src/walk/models/walk-path.ts). Texte : src/content/walk.ts.
import type * as T from "three";

type Opts = { x: number; z: number; nx: number; nz: number; title: string; sub: string; serif: string; sans: string };

/** Comptoir face à l'allée (nx, nz) ; le mur est derrière lui. */
export function createCaisse(THREE: typeof T, { x, z, nx, nz, title, sub, serif, sans }: Opts) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = Math.atan2(nx, nz);
  // Couleurs de la charte en sRGB : converties pour le rendu (sinon le bordeaux sort rouge vif, voir les vêtements noirs).
  const std = (c: number, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: new THREE.Color(c).convertSRGBToLinear(), roughness: r, metalness: m });
  const box = (w: number, h: number, d: number, mat: T.Material, px: number, py: number, pz: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(px, py, pz);
    g.add(m);
    return m;
  };
  const wine = std(0x680209, 0.45), pearl = std(0xeae0c8, 0.25, 0.05), brass = std(0xc8a96a, 0.3, 0.8), ink = std(0x1b1b1d, 0.5);

  // Comptoir : 3 m de long, plateau qui déborde, filet laiton, socle en retrait.
  box(3, 0.08, 0.2, ink, 0, 0.04, 0.05);
  box(3, 1.0, 0.7, wine, 0, 0.55, 0);
  box(3.12, 0.06, 0.82, pearl, 0, 1.08, 0);
  box(3.0, 0.03, 0.02, brass, 0, 0.92, 0.36);

  // Enseigne au mur derrière le comptoir.
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 384;
  const k = c.getContext("2d")!;
  k.fillStyle = "#420A0D"; k.fillRect(0, 0, c.width, c.height);
  k.strokeStyle = "#C8A96A"; k.lineWidth = 6; k.strokeRect(18, 18, c.width - 36, c.height - 36);
  k.fillStyle = "#FFFEF7"; k.textAlign = "center"; k.textBaseline = "middle";
  k.font = `600 150px ${serif}`; k.fillText(title, 512, 170);
  k.font = `500 40px ${sans}`;
  k.fillText(sub.toUpperCase(), 512, 290);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.975), new THREE.MeshBasicMaterial({ map: tex }));
  sign.position.set(0, 2.7, -0.62);
  g.add(sign);
  box(2.7, 0.04, 0.06, brass, 0, 2.2, -0.6);

  // Sac Fraul (ivoire, anses bordeaux) et terminal de paiement sur le plateau.
  const bag = new THREE.Group();
  bag.position.set(-0.8, 1.11, 0.05);
  bag.rotation.y = 0.35;
  g.add(bag);
  const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.16), std(0xfffef7, 0.8));
  bagBody.position.y = 0.24;
  bag.add(bagBody);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 20, Math.PI), std(0x680209, 0.5));
  handle.position.set(0, 0.48, 0);
  bag.add(handle);
  box(0.16, 0.05, 0.22, ink, 0.7, 1.135, 0.05);
  box(0.12, 0.012, 0.1, std(0x2b3a3c, 0.2, 0.3), 0.7, 1.166, 0.03);

  return { group: g };
}
