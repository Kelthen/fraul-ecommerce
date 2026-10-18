// Entrée du mall : deux portes en verre qui coulissent en s'écartant quand on approche.
// Le texte est gravé sur les portes : il se coupe en deux à l'ouverture (décision du 17 oct. 2026).
// Texte : src/content/walk.ts. Vitesse et distance d'ouverture : OPEN_FROM / OPEN_TO ci-dessous.
import type * as T from "three";

/** Distance (m) à laquelle les portes commencent à s'ouvrir, et où elles sont grandes ouvertes. */
const OPEN_FROM = 7;
const OPEN_TO = 3;

type Opts = { z: number; width: number; height: number; lines: [string, string]; serif: string };

export function createEntrance(THREE: typeof T, { z, width, height, lines, serif }: Opts) {
  const group = new THREE.Group();
  const half = width / 2;

  // Texte gravé : dessiné une seule fois sur toute la largeur, chaque porte en montre sa moitié.
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = Math.round((2048 * height) / width); // mêmes proportions que les deux portes réunies
  const x = c.getContext("2d")!;
  x.fillStyle = "rgba(20, 20, 22, 0.86)";
  x.textAlign = "center";
  x.textBaseline = "middle";
  const fit = (txt: string, px: number, maxW: number) => { for (;;) { x.font = `600 ${px}px ${serif}`; if (x.measureText(txt).width <= maxW || px < 40) return; px -= 4; } };
  fit(lines[0], 140, 1500);
  x.fillText(lines[0], 1024, c.height * 0.4);
  fit(lines[1], 200, 1800);
  x.fillText(lines[1], 1024, c.height * 0.4 + 200);
  const tex = (offset: number) => {
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.repeat.set(0.5, 1);
    t.offset.set(offset, 0);
    return t;
  };

  const glass = new THREE.MeshPhongMaterial({ color: 0xdfe9ea, transparent: true, opacity: 0.3, shininess: 140, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false });
  const metal = new THREE.MeshPhongMaterial({ color: 0xb9b4ad, shininess: 90 });
  const doors = [-1, 1].map((side) => {
    const d = new THREE.Group();
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(half, height), glass);
    const text = new THREE.Mesh(new THREE.PlaneGeometry(half, height), new THREE.MeshBasicMaterial({ map: tex(side < 0 ? 0 : 0.5), transparent: true, depthWrite: false }));
    text.position.z = 0.01; // gravure côté rue : lisible en arrivant
    const bar = (bx: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, height, 0.08), metal); m.position.x = bx; d.add(m); };
    bar(-half / 2); bar(half / 2);
    [height / 2, -height / 2].forEach((by) => { const m = new THREE.Mesh(new THREE.BoxGeometry(half, 0.06, 0.08), metal); m.position.y = by; d.add(m); });
    d.add(pane, text);
    d.position.set(side * half / 2, height / 2, z + 0.3);
    group.add(d);
    return { d, side };
  });

  let last = -1;
  return {
    group,
    /** Ouvre les portes selon la distance de la caméra à l'entrée (en arrivant comme en sortant). */
    update(camZ: number) {
      const t = Math.min(1, Math.max(0, (z + OPEN_FROM - camZ) / (OPEN_FROM - OPEN_TO)));
      const inside = camZ < z + OPEN_TO;
      const open = inside ? 1 : t * t * (3 - 2 * t);
      if (Math.abs(open - last) < 1e-3) return;
      last = open;
      doors.forEach(({ d, side }) => { d.position.x = side * (half / 2 + open * (half - 0.15)); });
    },
  };
}
