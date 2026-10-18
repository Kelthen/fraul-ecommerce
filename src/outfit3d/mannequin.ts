// Mannequin de « Crée ta tenue » : mêmes proportions que les mannequins du Walk (tête ovale brillante
// sans visage, pose naturelle), avec une pièce de vêtement 3D simple par emplacement, teintée de la
// couleur du produit. Les vraies photos sont affichées à côté, dans la carte de la pièce.
import type * as T from "three";
import type { CategoryId } from "@/lib/catalog/types";
import type { WearSlot } from "@/models/outfit/slots";

export type Worn = Partial<Record<WearSlot, { category: CategoryId; color: string }>>;

type V3 = [number, number, number];

/** Repères du corps (mètres, pieds au sol). Le poignet gauche porte la montre. */
export const BODY = {
  hip: 0.95, knee: 0.5, ankle: 0.09,
  neck: 1.53, head: [0, 1.78, 0.02] as V3,
  shoulderL: [-0.205, 1.45, 0] as V3, elbowL: [-0.245, 1.16, 0.02] as V3, wristL: [-0.265, 0.9, 0.05] as V3,
  shoulderR: [0.205, 1.45, 0] as V3, elbowR: [0.245, 1.16, 0.02] as V3, wristR: [0.265, 0.9, 0.05] as V3,
};
const LEGS: { hip: V3; knee: V3; ankle: V3 }[] = [-1, 1].map((s) => ({
  hip: [s * 0.085, BODY.hip, 0], knee: [s * 0.09, BODY.knee, 0.01], ankle: [s * 0.1, BODY.ankle, 0],
}));
const ARMS = [
  { s: BODY.shoulderL, e: BODY.elbowL, w: BODY.wristL },
  { s: BODY.shoulderR, e: BODY.elbowR, w: BODY.wristR },
];
const TORSO: [number, number][] = [[0.001, 0.9], [0.13, 0.91], [0.172, 0.97], [0.168, 1.05], [0.138, 1.15], [0.142, 1.25], [0.166, 1.35], [0.172, 1.42], [0.152, 1.48], [0.085, 1.53], [0.05, 1.55]];

export function createMannequin(THREE: typeof T) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  const clothes = new THREE.Group();
  root.add(body, clothes);
  const skin = new THREE.MeshPhongMaterial({ color: 0xf4f3f0, specular: 0x9a9a9a, shininess: 110 });
  const v = (p: V3) => new THREE.Vector3(...p);
  const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  function limb(g: T.Group, a: V3, b: V3, r1: number, r2: number, mat: T.Material) {
    const A = v(a), B = v(b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, A.distanceTo(B), 18), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    g.add(m);
    return m;
  }
  function ball(g: T.Group, p: V3, r: number, mat: T.Material, s: V3 = [1, 1, 1]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
    m.position.set(...p);
    m.scale.set(...s);
    g.add(m);
    return m;
  }
  function torso(g: T.Group, mat: T.Material, scale: number, from: number, to: number, depth = 0.72) {
    const prof = TORSO.filter(([, y]) => y >= from && y <= to).map(([r, y]) => new THREE.Vector2(Math.max(r, 0.001) * scale, y));
    const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), mat);
    m.scale.set(1, 1, depth);
    g.add(m);
    return m;
  }

  // Corps nu (toujours là) : jambes, buste, cou, tête, bras.
  LEGS.forEach((l) => {
    limb(body, l.hip, l.knee, 0.088, 0.072, skin);
    ball(body, l.knee, 0.072, skin);
    limb(body, l.knee, l.ankle, 0.072, 0.052, skin);
    ball(body, [l.ankle[0], 0.05, l.ankle[2] + 0.04], 0.055, skin, [1, 0.6, 1.8]);
  });
  torso(body, skin, 1.0, 0.9, 1.56);
  limb(body, [0, 1.52, 0], [0, 1.66, 0.012], 0.05, 0.043, skin);
  ball(body, BODY.head, 0.1, skin, [0.9, 1.3, 1.02]).rotation.x = -0.08;
  ARMS.forEach((a) => {
    ball(body, a.s, 0.06, skin);
    limb(body, a.s, a.e, 0.058, 0.045, skin);
    ball(body, a.e, 0.044, skin);
    limb(body, a.e, a.w, 0.042, 0.032, skin);
    ball(body, [a.w[0], a.w[1] - 0.06, a.w[2]], 0.04, skin, [0.7, 1.45, 1.05]);
  });
  ball(body, [0, 0.012, 0], 0.26, new THREE.MeshPhongMaterial({ color: 0x2b2a2c, shininess: 60 }), [1, 0.05, 1]);

  /** Habille le mannequin : une forme simple par pièce, à la couleur du produit. */
  function dress(worn: Worn) {
    clothes.children.slice().forEach((c) => {
      clothes.remove(c);
      c.traverse((o) => {
        const m = o as T.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) (m.material as T.Material).dispose();
      });
    });
    const cloth = (c: string, shiny = 8) => new THREE.MeshPhongMaterial({ color: new THREE.Color(c).convertSRGBToLinear(), shininess: shiny });
    const g = (slot: WearSlot) => {
      const grp = new THREE.Group();
      grp.name = slot;
      clothes.add(grp);
      return grp;
    };

    if (worn.top) {
      const m = cloth(worn.top.color), t = g("top");
      torso(t, m, 1.06, 0.9, 1.53);
      ARMS.forEach((a) => limb(t, a.s, lerp3(a.s, a.e, 0.55), 0.068, 0.06, m));
      ARMS.forEach((a) => ball(t, a.s, 0.068, m));
    }
    if (worn.layer) {
      const m = cloth(worn.layer.color), t = g("layer");
      const coat = worn.layer.category === "jacket";
      torso(t, m, coat ? 1.2 : 1.15, coat ? 0.9 : 0.9, 1.53, 0.78);
      if (coat) limb(t, [0, 0.72, 0], [0, 0.95, 0], 0.2, 0.19, m); // pan de veste sous la taille
      ARMS.forEach((a) => {
        ball(t, a.s, 0.075, m);
        limb(t, a.s, a.e, 0.075, 0.064, m);
        ball(t, a.e, 0.062, m);
        limb(t, a.e, lerp3(a.e, a.w, worn.watch ? 0.7 : 0.86), 0.06, 0.052, m); // manche relevée si montre
      });
      if (worn.layer.category === "hoodie") ball(t, [0, 1.55, -0.1], 0.11, m, [1.15, 0.7, 0.75]); // capuche rabattue
      else ball(t, [0, 1.52, -0.02], 0.1, m, [1.3, 0.35, 1]); // col
    }
    if (worn.bottom) {
      const m = cloth(worn.bottom.color), t = g("bottom");
      const short = worn.bottom.category === "shorts";
      torso(t, m, 1.08, 0.9, 0.98);
      LEGS.forEach((l) => {
        const end = short ? lerp3(l.hip, l.knee, 0.8) : l.ankle;
        limb(t, l.hip, short ? end : l.knee, 0.1, short ? 0.088 : 0.084, m);
        if (!short) {
          ball(t, l.knee, 0.084, m);
          limb(t, l.knee, [l.ankle[0], l.ankle[1] + 0.02, l.ankle[2]], 0.084, 0.066, m);
        }
      });
    }
    if (worn.socks) {
      const m = cloth(worn.socks.color), t = g("socks");
      LEGS.forEach((l) => limb(t, [l.ankle[0], 0.06, l.ankle[2]], lerp3(l.ankle, l.knee, 0.45), 0.058, 0.064, m));
    }
    if (worn.shoes) {
      const m = cloth(worn.shoes.color, 30), sole = new THREE.MeshPhongMaterial({ color: 0xf6f5f2 }), t = g("shoes");
      LEGS.forEach((l) => {
        ball(t, [l.ankle[0], 0.06, l.ankle[2] + 0.045], 0.068, m, [1.05, 0.72, 1.95]);
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.27), sole);
        s.position.set(l.ankle[0], 0.0125, l.ankle[2] + 0.045);
        t.add(s);
      });
    }
    if (worn.cap) {
      const m = cloth(worn.cap.color), t = g("cap");
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m);
      dome.position.set(0, 1.83, 0.015);
      dome.scale.set(0.98, 0.9, 1.05);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.012, 24, 1, false, -Math.PI / 2, Math.PI), m);
      brim.position.set(0, 1.835, 0.07);
      brim.scale.set(1, 1, 1.25);
      t.add(dome, brim);
    }
    if (worn.glasses) {
      const lens = new THREE.MeshPhongMaterial({ color: 0x141416, shininess: 120, specular: 0x777777 });
      const frame = cloth(worn.glasses.color, 60), t = g("glasses");
      [-1, 1].forEach((s) => {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.034, 0.008), lens);
        l.position.set(s * 0.033, 1.785, 0.115);
        t.add(l);
        limb(t, [s * 0.06, 1.79, 0.112], [s * 0.088, 1.79, 0.02], 0.004, 0.004, frame); // branches
      });
      limb(t, [-0.008, 1.792, 0.117], [0.008, 1.792, 0.117], 0.004, 0.004, frame); // pont
    }
    if (worn.neck) {
      const m = new THREE.MeshPhongMaterial({ color: new THREE.Color(worn.neck.color).convertSRGBToLinear(), shininess: 140, specular: 0xffffff }), t = g("neck");
      // Posé par-dessus ce qui est porté : plus le vêtement est épais, plus le collier avance.
      const front = worn.layer ? 0.15 : worn.top ? 0.125 : 0.11;
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.006, 8, 40), m);
      chain.position.set(0, 1.49, front - 0.06);
      chain.rotation.x = Math.PI / 2 - 0.45;
      t.add(chain);
      ball(t, [0, 1.435, front + 0.022], 0.016, m); // pendentif, au bas de la chaîne
    }
    if (worn.watch) {
      const strap = cloth(worn.watch.color, 40), t = g("watch");
      const w = BODY.wristL, e = BODY.elbowL;
      const at = lerp3(e, w, 0.9);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 10, 28), strap);
      band.position.set(...at);
      band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v(w).sub(v(e)).normalize());
      // Boîtier acier + cadran sombre, tournés vers l'extérieur du bras (vers -x pour le bras gauche).
      const metal = new THREE.MeshPhongMaterial({ color: 0xcfcac2, shininess: 160, specular: 0xffffff });
      const face = new THREE.MeshPhongMaterial({ color: 0x141416, shininess: 120, specular: 0x666666 });
      const box = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.012, 32), metal);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.002, 32), face);
      box.position.set(at[0] - 0.046, at[1], at[2]);
      glass.position.set(at[0] - 0.0525, at[1], at[2]);
      box.rotation.z = glass.rotation.z = Math.PI / 2;
      t.add(band, box, glass);
    }
  }

  return { root, dress };
}
