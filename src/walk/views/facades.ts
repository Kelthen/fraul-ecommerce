// Les 3 architectures de boutique du mall (Serge, 4 nov. 2026). Le type de chaque boutique : shopType (models/mall-layout.ts).
// La porte (4,8 m × 4,2 m) et les vitrines de côté restent au même endroit : mannequins et intérieur marchent partout.
// Une façade doit rester légère (une trentaine de pièces au plus avec les vitrines) : le mall peut compter des dizaines de boutiques.
import type * as T from "three";

type Opts = {
  type: number;
  bg: string;
  ceil: number;
  /** Enseigne déjà dessinée (nom ou logo). */
  sign: T.Texture;
  /** Matières faites dans Blender : pierre claire et métal champagne brossé (facultatives). */
  tex?: { stone?: T.Texture; metal?: T.Texture; env?: T.Texture };
  /** Vitrine finie dans Blender (plan #109, lot 2 : assets-src/blender/vitrine-temoin.py) : cadre biseauté et socle en
   *  pierre. Toutes les boutiques depuis le lot 5 ; sans le fichier (chargement raté), les pavés d'avant. */
  kit?: { cadre: T.Mesh; socle: T.Mesh };
};

/** Dégradés dessinés une fois (verre et lumière de la vitrine finie). */
const CACHE: Record<string, T.Texture> = {};
function painted(THREE: typeof T, key: string, w: number, h: number, draw: (x: CanvasRenderingContext2D) => void): T.Texture {
  if (CACHE[key]) return CACHE[key];
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  return (CACHE[key] = t);
}

/** Ombre douce et ronde (dessinée une fois) : sous le mannequin, sur le socle des vitrines. */
let SOFT: T.Texture | null = null;
function softShadow(THREE: typeof T): T.Texture {
  if (SOFT) return SOFT;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, "rgba(40,30,20,0.55)");
  g.addColorStop(1, "rgba(40,30,20,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return (SOFT = new THREE.CanvasTexture(c));
}

export function createFacade(THREE: typeof T, { type, bg, ceil, sign, tex, kit }: Opts) {
  const g = new THREE.Group();
  const std = (c: number, r: number, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  // Champagne brossé (cadres) et pierre claire (portique), avec la matière Blender quand elle est là.
  const champagne = () => new THREE.MeshStandardMaterial({ color: tex?.metal ? 0xffffff : 0xd4bb8a, map: tex?.metal ?? null, roughness: 0.35, metalness: 0.35, emissive: 0x3a2e1a, emissiveIntensity: 0.25, envMap: tex?.env ?? null, envMapIntensity: 0.9 });
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
  // Vitrines intégrées (plan du mall réaliste #109, Rhamone 8 nov.) : de chaque côté de la porte, une baie vitrée dont le
  // haut s'aligne sur la porte (4,2 m), creusée vers la boutique ; le mannequin est derrière le verre, sur un socle.
  const OPEN = 1.45, TOP = 4.2;
  const sides = (mat: T.Material, d = 0.4, z = 0.2) =>
    [-1, 1].forEach((s) => {
      const cx = s * 3.25;
      [-1, 1].forEach((e) => box((1.75 - OPEN) / 2, ceil, d, mat, cx + e * (1.75 + OPEN) / 4, ceil / 2, z)); // montants
      box(OPEN, ceil - TOP, d, mat, cx, TOP + (ceil - TOP) / 2, z); // au-dessus, au niveau du linteau de la porte
    });
  const niche = (frame: T.Material) => {
    if (kit) return nicheFinie(frame);
    const back = new THREE.MeshLambertMaterial({ color: 0xf4ede2 });
    const socle = std(0xece6dc, 0.35);
    // Verre : reflet doux de l'ambiance du mall (lot 1), toujours transparent pour voir le mannequin.
    const glass = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.12, depthWrite: false, envMap: tex?.env ?? null, envMapIntensity: 0.6 });
    [-1, 1].forEach((s) => {
      const cx = s * 3.25;
      box(OPEN, TOP, 0.04, back, cx, TOP / 2, -0.47); // fond
      [-1, 1].forEach((e) => box(0.04, TOP, 0.85, back, cx + e * OPEN / 2, TOP / 2, -0.04)); // joues
      box(OPEN, 0.05, 0.85, light, cx, TOP - 0.03, -0.04); // plafond lumineux, lumière chaude sur le mannequin
      box(OPEN - 0.1, 0.14, 0.7, socle, cx, 0.07, -0.08); // socle
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.6), new THREE.MeshBasicMaterial({ map: softShadow(THREE), transparent: true, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2;
      sh.position.set(cx, 0.142, -0.06);
      g.add(sh); // ombre du mannequin sur le socle
      const base = new THREE.Mesh(new THREE.PlaneGeometry(OPEN + 0.3, 1.1), new THREE.MeshBasicMaterial({ map: softShadow(THREE), transparent: true, opacity: 0.6, depthWrite: false }));
      base.rotation.x = -Math.PI / 2;
      base.position.set(cx, 0.004, 0.1);
      g.add(base); // le socle se pose sur le sol
      [-1, 1].forEach((e) => box(0.05, TOP, 0.08, frame, cx + e * (OPEN / 2 + 0.02), TOP / 2, 0.42)); // cadre champagne
      box(OPEN + 0.09, 0.05, 0.08, frame, cx, TOP, 0.42);
      box(OPEN + 0.09, 0.05, 0.08, frame, cx, 0.025, 0.42);
      box(OPEN, TOP - 0.05, 0.01, glass, cx, TOP / 2, 0.38); // verre
    });
  };

  // Vitrine finie (lot 2, posée partout au lot 5) : mêmes cotes, mais cadre biseauté et socle en pierre de Blender, verre qu'on devine (reflets
  // en biais très légers), lumière chaude qui descend sur le mannequin. Le mannequin et le fond lumineux viennent du moteur.
  const nicheFinie = (frame: T.Material) => {
    const back = new THREE.MeshLambertMaterial({ color: 0xf6eee1 });
    const pierre = new THREE.MeshStandardMaterial({ color: tex?.stone ? 0xfbf6ee : 0xece6dc, map: tex?.stone ?? null, roughness: 0.42, envMap: tex?.env ?? null, envMapIntensity: 0.5 });
    const warm = new THREE.MeshBasicMaterial({ color: 0xffe6c2 });
    const glass = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0.4, transparent: true, opacity: 0.1, depthWrite: false, envMap: tex?.env ?? null, envMapIntensity: 1 });
    const streaks = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.22,
      map: painted(THREE, "reflets", 256, 512, (x) => {
        x.fillStyle = "#000"; x.fillRect(0, 0, 256, 512);
        x.translate(128, 256); x.rotate(-0.5); // deux traînées en biais, comme le reflet d'un bandeau du plafond
        [[-60, 46, 0.18], [40, 18, 0.12]].forEach(([cx, w, a]) => {
          const g = x.createLinearGradient(cx - w, 0, cx + w, 0);
          g.addColorStop(0, "rgba(255,250,240,0)"); g.addColorStop(0.5, `rgba(255,250,240,${a})`); g.addColorStop(1, "rgba(255,250,240,0)");
          x.fillStyle = g; x.fillRect(cx - w, -400, 2 * w, 800);
        });
      }) });
    const cone = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.13,
      map: painted(THREE, "faisceau", 128, 256, (x) => { // faisceau chaud : étroit en haut, large et fondu en bas
        const g = x.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, "rgba(255,214,160,0.3)"); g.addColorStop(0.75, "rgba(255,214,160,0.06)"); g.addColorStop(1, "rgba(255,214,160,0)");
        x.fillStyle = g; x.beginPath(); x.moveTo(56, 0); x.lineTo(72, 0); x.lineTo(112, 256); x.lineTo(16, 256); x.closePath(); x.fill();
      }) });
    const shadow = new THREE.MeshBasicMaterial({ map: softShadow(THREE), transparent: true, depthWrite: false });
    [-1, 1].forEach((s) => {
      const cx = s * 3.25;
      box(OPEN, TOP, 0.04, back, cx, TOP / 2, -0.47); // fond
      [-1, 1].forEach((e) => box(0.04, TOP, 0.85, back, cx + e * OPEN / 2, TOP / 2, -0.04)); // joues
      box(OPEN - 0.06, 0.03, 0.5, warm, cx, TOP - 0.06, -0.12); // plafonnier chaud
      const f = new THREE.Mesh(kit!.cadre.geometry, frame); f.position.x = cx; g.add(f);
      const so = new THREE.Mesh(kit!.socle.geometry, pierre); so.position.x = cx; g.add(so);
      const c = new THREE.Mesh(new THREE.PlaneGeometry(1.3, TOP - 0.1), cone);
      c.position.set(cx, (TOP - 0.1) / 2 + 0.1, 0.2); g.add(c); // faisceau devant le mannequin, derrière le verre
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.6), shadow);
      sh.rotation.x = -Math.PI / 2; sh.position.set(cx, 0.142, -0.06); g.add(sh); // ombre du mannequin sur le socle
      const base = new THREE.Mesh(new THREE.PlaneGeometry(OPEN + 0.3, 1.1), shadow);
      base.rotation.x = -Math.PI / 2; base.position.set(cx, 0.004, 0.1); g.add(base); // le socle se pose sur le sol
      box(OPEN - 0.01, TOP - 0.05, 0.01, glass, cx, TOP / 2, 0.39); // verre
      const r = new THREE.Mesh(new THREE.PlaneGeometry(OPEN - 0.02, TOP - 0.06), streaks);
      r.position.set(cx, TOP / 2, 0.396); g.add(r); // reflets sur le verre
    });
  };

  if (type === 1) {
    // Verrière : côtés vitrés, grand bandeau à la couleur de la marque qui avance au-dessus de la porte.
    const metal = std(0x2a2a2d, 0.35, 0.6);
    [-1, 1].forEach((s) => box(0.06, 4.2, 0.08, metal, s * 4.1, 2.1, 0.42));
    niche(champagne());
    box(8.3, ceil - 4.2, 0.9, brand, 0, 4.2 + (ceil - 4.2) / 2, 0.45);
    box(8.3, 0.03, 0.06, light, 0, 4.18, 0.86);
    placeSign(6.2, 1.21, 5.3, 0.91);
    doorFrame(metal);
  } else if (type === 2) {
    // Portique : mur de pierre, colonnes, fronton à la couleur de la marque, vitrines encadrées, laiton.
    const stone = new THREE.MeshStandardMaterial({ color: tex?.stone ? 0xf6f1e8 : 0xe9e1d2, map: tex?.stone ?? null, roughness: 0.7 });
    const column = std(0xf5f0e6, 0.45);
    const brass = champagne();
    sides(stone);
    lintel(stone);
    niche(brass);
    [-1, 1].forEach((s) => {
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
    const metal = champagne();
    sides(brand);
    niche(champagne());
    lintel(brand);
    placeSign(4.6, 0.9, 5.2, 0.41);
    doorFrame(metal);
  }
  return g;
}
