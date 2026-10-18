// Scène 3D de « Crée ta tenue » : le mannequin, la lumière, et une caméra qui va se placer sur la
// pièce choisie (cadrages : src/models/outfit/camera.ts). Glisser = tourner le mannequin,
// pincer ou molette = zoomer. On ne dessine que quand quelque chose bouge (batterie du téléphone).
import type * as T from "three";
import { DIST_MAX, DIST_MIN, OVERVIEW, SHOTS, type Shot } from "@/models/outfit/camera";
import type { WearSlot } from "@/models/outfit/slots";
import { createMannequin, type Worn } from "./mannequin";

export type OutfitScene = {
  dress: (worn: Worn) => void;
  /** Cadre une pièce (zoom), ou la vue d'ensemble avec `null`. */
  focus: (slot: WearSlot | null) => void;
  destroy: () => void;
};

export function createOutfitScene(THREE: typeof T, host: HTMLElement): OutfitScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = THREE.sRGBEncoding;
  host.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = "none";

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(35, 1, 0.05, 30);
  scene.add(new THREE.HemisphereLight(0xfffdf8, 0x8f8880, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 0.75);
  key.position.set(1.5, 3, 2.5);
  const rim = new THREE.DirectionalLight(0xeae0c8, 0.35);
  rim.position.set(-2, 2, -2);
  scene.add(key, rim);

  const man = createMannequin(THREE);
  scene.add(man.root);

  // État de la caméra : courant (cur) et visé (goal). La caméra glisse de l'un vers l'autre.
  const cur: Shot = { target: [...OVERVIEW.target], dist: OVERVIEW.dist, yaw: OVERVIEW.yaw };
  let goal: Shot = { target: [...OVERVIEW.target], dist: OVERVIEW.dist, yaw: OVERVIEW.yaw };

  let raf = 0;
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  function frame() {
    raf = 0;
    const k = 0.14;
    let moving = false;
    const step = (a: number, b: number) => { const d = b - a; if (Math.abs(d) > 1e-4) moving = true; return a + d * k; };
    cur.dist = step(cur.dist, goal.dist);
    cur.yaw = step(cur.yaw, goal.yaw);
    cur.target = cur.target.map((t, i) => step(t, goal.target[i])) as Shot["target"];
    man.root.rotation.y = cur.yaw;
    // Le point visé est donné dans le repère du mannequin : on le fait tourner avec lui.
    const [x, y, z] = cur.target, c = Math.cos(cur.yaw), s = Math.sin(cur.yaw);
    const wx = x * c + z * s, wz = -x * s + z * c;
    cam.position.set(wx, y + cur.dist * 0.08, wz + cur.dist);
    cam.lookAt(wx, y, wz);
    renderer.render(scene, cam);
    if (moving) kick();
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    cam.aspect = w / Math.max(h, 1);
    cam.updateProjectionMatrix();
    kick();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // Gestes : un doigt tourne le mannequin, deux doigts zooment ; molette = zoom.
  const pts = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  const el = renderer.domElement;
  const onDown = (e: PointerEvent) => { el.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); };
  const onMove = (e: PointerEvent) => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    if (pts.size === 1) {
      goal.yaw += (e.clientX - p.x) * 0.012;
      cur.yaw = goal.yaw;
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) zoom(pinch / d);
      pinch = d;
    }
    p.x = e.clientX;
    p.y = e.clientY;
    kick();
  };
  const onUp = (e: PointerEvent) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; };
  const onWheel = (e: WheelEvent) => { e.preventDefault(); zoom(Math.exp(e.deltaY * 0.0015)); };
  function zoom(f: number) {
    goal.dist = Math.min(DIST_MAX, Math.max(DIST_MIN, goal.dist * f));
    kick();
  }
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.addEventListener("wheel", onWheel, { passive: false });

  return {
    dress(worn) { man.dress(worn); kick(); },
    focus(slot) {
      const s = slot ? SHOTS[slot] : OVERVIEW;
      goal = { target: [...s.target], dist: s.dist, yaw: s.yaw };
      kick();
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("wheel", onWheel);
      man.dress({});
      scene.traverse((o) => {
        const m = o as T.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) (m.material as T.Material).dispose();
      });
      renderer.dispose();
      el.remove();
    },
  };
}
