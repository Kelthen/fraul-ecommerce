// Fraul Walk — moteur 3D du mall et des boutiques.
// Porté depuis la démo V2 (demo/fraul-demo-v2.html) en gardant le même rendu ;
// ce qui change : three.js vient du projet (plus de CDN), les données viennent
// du catalogue, le panier et la navigation sont ceux du site, et tout se nettoie
// quand on quitte la page.
import { GARMENT_PATHS as P } from "@/lib/catalog/art";
import { DARK, accentFor } from "@/lib/catalog/demo";
import { createFocusController } from "./controllers/focus";
import { connectHistory } from "./controllers/history";
import { getMode } from "./modes";
import { createConciergeDesk } from "./views/concierge";
import { createEntrance } from "./views/entrance";
import { CONCIERGE_TEXT, ENTRANCE_TEXT } from "../content/walk";
import { clamp, dist2, ease, lerp, smooth } from "./models/math";
import { RACKS as CAR, STORE_ZONES as ZONES, route } from "./models/store-layout";
import { AT_CONCIERGE, AT_EXIT, EYE, pathAt as pathAtFor, progressForShop } from "./models/walk-path";
import { daylightAt, localHour } from "./models/daylight";
import { matchCategories } from "./models/search";

let THREE = null;

/**
 * Démarre le Fraul Walk dans `root`.
 * @param {HTMLElement} root
 * @param {object} o  options : shops, allBrands, categories, getItems, formatPrice, fonts,
 *                    onAdd, onExit, onFallback, onFiche, onConcierge, startShop, startStore,
 *                    mode (forme du mall, src/walk/modes ; « t » par défaut),
 *                    hour (heure décimale pour la lumière ; par défaut l'heure locale du visiteur)
 * @returns {{ destroy(): void, closeFiche(): void, showItem(slug: string): void, refocus(): void, closeConcierge(): void }}
 */
export function startWalk(root, o) {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s) => root.querySelector(s);
  const life = new AbortController();
  const on = (el, ev, fn, opts = {}) => el.addEventListener(ev, fn, { ...opts, signal: life.signal });
  let dead = false;

  /* ===== Gabarit de marque (polices du site passées en options) ===== */
  const FONTS = {
    sansX: { fam: o.fonts.sans, w: 800, it: false },
    sansXi: { fam: o.fonts.sans, w: 800, it: true },
    sansL: { fam: o.fonts.sans, w: 300, it: false },
    serif: { fam: o.fonts.serif, w: 600, it: false },
    serifI: { fam: o.fonts.serif, w: 400, it: true },
    serifIB: { fam: o.fonts.serif, w: 600, it: true },
  };
  const word = (st) => (st.up ? st.name.toUpperCase() : st.name);
  const canvasFont = (st, px) => { const f = FONTS[st.font]; return `${f.it ? "italic " : ""}${f.w} ${px}px ${f.fam}`; };
  const CANVAS_FONTS = [`italic 800 60px ${o.fonts.sans}`, `800 60px ${o.fonts.sans}`, `300 60px ${o.fonts.sans}`, `500 30px ${o.fonts.sans}`,
    `600 60px ${o.fonts.serif}`, `italic 400 60px ${o.fonts.serif}`, `italic 600 60px ${o.fonts.serif}`];
  const styleOf = (name) => (o.allBrands.find((b) => b.name === name) || o.shops.find((b) => b.name === name)).style;
  const slugOf = (name) => (o.allBrands.find((b) => b.name === name) || {}).slug;

  const CATS = o.categories.map((c) => [c.id, c.label]);
  const catLabel = (c) => CATS.find((x) => x[0] === c)[1];
  const pcache = {};
  const products = (brand, cat) => pcache[brand + "|" + cat] || (pcache[brand + "|" + cat] = o.getItems(brand, cat));

  function addToCart(it, size) { o.onAdd(it, size); }

  /* ===== Couches : bouton retour du téléphone (controllers/history.ts) et focus (controllers/focus.ts) ===== */
  const focus = createFocusController({ root, walk: $("#walk"), store: $("#store"), dir: $("#dir"), sheets: [$("#concierge"), $("#fiche")], signal: life.signal });
  const trapUpdate = focus.update, opener = focus.opener, giveBack = focus.giveBack;
  const nav = connectHistory({ isDead: () => dead, onBack: trapUpdate, signal: life.signal });
  const hasLayer = nav.has, openLayer = nav.open, closeLayer = nav.close, dropLayer = nav.drop, sync = nav.sync;

  /* ===== Mémoire légère (ce téléphone) : gestes déjà faits, dernière boutique regardée ===== */
  // Un texte d'aide disparaît dès que le geste a été fait une fois (Rhamone : « moins de texte »).
  const MEM = "fraul.walk.v1";
  const mem = (() => { try { const m = JSON.parse(localStorage.getItem(MEM) || "{}"); return m && typeof m === "object" ? m : {}; } catch { return {}; } })();
  if (!Array.isArray(mem.seen)) mem.seen = [];
  const remember = (patch) => { Object.assign(mem, patch); try { localStorage.setItem(MEM, JSON.stringify(mem)); } catch { /* ignoré */ } };
  const seen = (g) => mem.seen.includes(g);
  function gesture(g) { root.classList.add(`seen-${g}`); if (!seen(g)) remember({ seen: [...mem.seen, g] }); }
  mem.seen.forEach((g) => root.classList.add(`seen-${g}`));
  /** Boutique où reprendre la visite (regardée il y a moins de 14 jours), sinon l'entrée du mall. */
  function resumeShop() {
    const k = typeof mem.last === "string" ? o.shops.findIndex((s) => s.name === mem.last) : -1;
    return k >= 0 && Date.now() - (Number(mem.at) || 0) < 14 * 864e5 ? k : undefined;
  }

  /* ===== Annuaire et recherche (une marque ou une pièce) ===== */
  const dir = $("#dir"), dirq = $("#dirq");
  const SHOP_NAMES = o.shops.map((s) => s.name);
  function renderDir() {
    const q = dirq.value.trim().toLowerCase();
    const list = o.allBrands.map((b) => b.name).filter((b) => b.toLowerCase().includes(q));
    const out = $("#dirList");
    out.textContent = "";
    // Une pièce tapée (« hoodie », « basket »…) : on propose d'aller droit au rayon dans chaque boutique qui en a.
    const withPhoto = (b, cat) => products(b, cat).some((it) => it.img);
    const rayons = matchCategories(q, CATS)
      .flatMap((cat) => o.allBrands.map((b) => b.name).filter((b) => products(b, cat).length).map((b) => [b, cat]))
      .sort((x, y) => Number(withPhoto(...y)) - Number(withPhoto(...x))); // les boutiques avec de vraies photos d'abord
    if (rayons.length) {
      const p = document.createElement("p"); p.className = "letter"; p.textContent = "Aller au rayon"; out.append(p);
      rayons.slice(0, 12).forEach(([b, cat]) => {
        const go = document.createElement("button"); go.type = "button"; go.className = "go"; go.dataset.b = b; go.dataset.cat = cat;
        const st = document.createElement("strong"); st.textContent = b; const sp = document.createElement("span"); sp.textContent = catLabel(cat);
        go.append(st, sp); const row = document.createElement("div"); row.className = "brand"; row.append(go); out.append(row);
      });
      if (!list.length) return;
    }
    if (!list.length) { const p = document.createElement("p"); p.className = "empty"; p.textContent = `Aucune marque ne correspond à « ${dirq.value} ».`; out.append(p); return; }
    let cur = "";
    list.forEach((b) => {
      const L = b[0].toUpperCase();
      if (L !== cur) { cur = L; const p = document.createElement("p"); p.className = "letter"; p.textContent = L; out.append(p); }
      const row = document.createElement("div"); row.className = "brand";
      const go = document.createElement("button"); go.type = "button"; go.className = "go"; go.dataset.b = b;
      const s = document.createElement("strong"); s.textContent = b; const sp = document.createElement("span"); sp.textContent = "Entrer dans la boutique";
      go.append(s, sp); row.append(go);
      const fi = SHOP_NAMES.indexOf(b);
      if (fi >= 0) { const c = document.createElement("button"); c.type = "button"; c.className = "chip"; c.dataset.walk = String(fi); c.textContent = "Dans le mall"; row.append(c); }
      out.append(row);
    });
  }
  let dirFrom = null;
  function openDir() {
    dirFrom = opener();
    dir.hidden = false; dirq.value = ""; renderDir(); trapUpdate(); dirq.focus();
    openLayer("dir", () => { dir.hidden = true; trapUpdate(); giveBack(dirFrom, $("#dirBtn")); });
  }
  const closeDir = () => closeLayer("dir");
  on($("#dirBtn"), "click", openDir);
  on($("#wSearch"), "click", openDir);
  on($("#dirClose"), "click", closeDir);
  on(dirq, "input", renderDir);
  on($("#dirList"), "click", (e) => {
    const go = e.target.closest(".go"), chip = e.target.closest(".chip");
    if (go) { const cat = go.dataset.cat; closeDir(); openStore(go.dataset.b, { fromWalk: walkOpen }).then(() => { if (cat && !storeEl.hidden) goZone(cat); }); }
    if (chip) { closeDir(); openWalk(+chip.dataset.walk); }
  });
  on(window, "keydown", (e) => { if (e.key === "Escape" && !dir.hidden) { e.stopImmediatePropagation(); closeDir(); } });

  /* ===== Fraul Finds, pièces sur demande (formulaire dessiné par React) : une couche, retour = fermer ===== */
  let conFrom = null;
  function openConcierge(brand) {
    if (hasLayer("concierge")) return;
    conFrom = opener();
    openLayer("concierge", () => { o.onConcierge(null); giveBack(conFrom, null); });
    o.onConcierge({ brand: brand || "" });
  }
  on($("#conBtn"), "click", () => openConcierge(null));
  on($("#conStopBtn"), "click", () => openConcierge(null));
  // Écouteur posé avant ceux de la boutique : Échap ferme d'abord Fraul Finds.
  on(window, "keydown", (e) => { if (e.key === "Escape" && hasLayer("concierge")) { e.stopImmediatePropagation(); closeLayer("concierge"); } });

  /* ===== three.js chargé à l'ouverture (bundle du projet, pas de CDN) ===== */
  let threeP = null;
  function ensureThree() {
    if (THREE) return Promise.resolve(true);
    if (!threeP) threeP = new Promise((res) => {
      // L'écran de chargement n'apparaît que si ça dure (plus de 200 ms) ; polices attendues 800 ms au plus.
      const L = $("#loader"), show = setTimeout(() => { L.hidden = false; }, 200);
      const done = (ok) => Promise.race([Promise.all(CANVAS_FONTS.map((f) => document.fonts.load(f))).catch(() => {}), new Promise((r) => setTimeout(r, 800))])
        .then(() => { clearTimeout(show); L.hidden = true; res(ok); });
      import("three").then((m) => { THREE = m; done(true); }).catch(() => { threeP = null; done(false); });
    });
    return threeP;
  }

  /* ===== Outils 3D partagés (textures, vêtements, mannequins) ===== */
  let GH = null;
  function G() {
    if (GH) return GH;
    const cv = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
    const T = (c) => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };
    function spaced(x, txt, cx, cy, sp) {
      const ws = [...txt].map((ch) => x.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
      let px = cx - tot / 2; [...txt].forEach((ch, i) => { x.fillText(ch, px, cy); px += ws[i] + sp; });
    }
    function fit(x, st, maxW, px) {
      const t = word(st);
      for (;;) { x.font = canvasFont(st, px); const sp = st.sp * px; const w = [...t].reduce((a, ch) => a + x.measureText(ch).width, 0) + sp * (t.length - 1); if (w <= maxW || px <= 10) return sp; px -= 2; }
    }
    function wordTex(st, { w = 1024, h = 200, bg = null, fg = st.fg, maxW = 860, px = 130, glow = false } = {}) {
      const [c, x] = cv(w, h); if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
      x.fillStyle = fg; x.textBaseline = "middle"; const sp = fit(x, st, maxW, px);
      if (glow) { x.shadowColor = fg; x.shadowBlur = 18; } spaced(x, word(st), w / 2, h / 2 + 4, sp); return T(c);
    }
    function labelTex(t, fg = "#1b1b1d") { const [c, x] = cv(1024, 192); x.fillStyle = fg; x.textBaseline = "middle"; x.font = `500 64px ${o.fonts.sans}`; spaced(x, t, 512, 100, 18); return T(c); }
    function glowTex(light = false) {
      const [c, x] = cv(256, 256); const g = x.createRadialGradient(128, 80, 6, 128, 128, 200);
      const stops = light ? ["#fffdf8", "#eee4d6", "#d6c8b5"] : ["#fff3e2", "#6b5a4c", "#1a1618"];
      g.addColorStop(0, stops[0]); g.addColorStop(0.5, stops[1]); g.addColorStop(1, stops[2]); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return T(c);
    }
    // Haut des mannequins : couleurs de la marque, nom de la marque sur la poitrine
    function clothTex(st, inv, kind) {
      const bg = inv ? st.fg : st.bg, fg = inv ? st.bg : st.fg, [c, x] = cv(512, 256);
      x.fillStyle = bg; x.fillRect(0, 0, 512, 256);
      const g = x.createLinearGradient(0, 0, 512, 0); g.addColorStop(0, "rgba(0,0,0,.28)"); g.addColorStop(0.5, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.28)");
      x.fillStyle = g; x.fillRect(0, 0, 512, 256);
      x.fillStyle = fg; x.textBaseline = "middle"; const sp = fit(x, st, kind === "hoodie" ? 150 : 120, kind === "hoodie" ? 38 : 30);
      spaced(x, word(st), 256, 98, sp); return T(c);
    }
    function backPrint(x, st, col, cx, cy, maxW) { x.save(); x.fillStyle = col; x.textBaseline = "middle"; const sp = fit(x, st, maxW, 14); spaced(x, word(st), cx, cy, sp); x.restore(); }
    function drawItem(x, type, c, a, back, st) {
      const p = new Path2D(P[type]); x.fillStyle = c; x.fill(p);
      x.save(); x.clip(p); const g = x.createLinearGradient(0, 0, 0, 110); g.addColorStop(0, "rgba(255,255,255,.12)"); g.addColorStop(0.55, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.35)"); x.fillStyle = g; x.fillRect(0, 0, 100, 110); x.restore();
      x.lineWidth = 1; x.strokeStyle = DARK.includes(c) ? "rgba(234,224,200,.22)" : "rgba(0,0,0,.25)"; x.stroke(p);
      x.strokeStyle = a; x.fillStyle = a; x.lineWidth = 2; x.lineCap = "round";
      if (type === "tee") { if (back) { x.stroke(new Path2D("M42 5 Q50 8 58 5")); backPrint(x, st, a, 50, 44, 36); } else { x.stroke(new Path2D("M42 4 Q50 13 58 4")); x.fillRect(57, 28, 9, 6); } }
      if (type === "hoodie") { if (back) { x.stroke(new Path2D("M34 10 Q50 30 66 10")); backPrint(x, st, a, 50, 54, 38); } else { x.stroke(new Path2D("M38 10 Q50 27 62 10")); x.lineWidth = 1.4; x.stroke(new Path2D("M46 22 V36 M54 22 V36")); x.globalAlpha = 0.6; x.stroke(new Path2D("M36 74 H64 L68 92 H32 Z")); x.globalAlpha = 1; } }
      if (type === "pants") { x.stroke(new Path2D("M26 13 H74")); x.globalAlpha = 0.6; x.lineWidth = 1.2; if (back) { x.strokeRect(31, 22, 12, 12); x.strokeRect(57, 22, 12, 12); } else x.stroke(new Path2D("M50 13 V30")); x.globalAlpha = 1; }
      if (type === "sneaker") { x.fill(new Path2D("M8 76 H96 V84 Q96 89 90 89 H13 Q8 89 8 84 Z")); x.stroke(new Path2D("M40 56 L46 52 M44 60 L51 55 M48 63 L56 58")); }
      if (type === "cap") { x.globalAlpha = 0.6; x.lineWidth = 1.3; x.stroke(new Path2D("M50 34 V74 M30 40 Q36 58 34 74 M70 40 Q66 58 68 74")); x.globalAlpha = 1; x.beginPath(); x.arc(50, 35, 2.6, 0, 7); x.fill(); if (back) x.fillRect(42, 66, 16, 5); else x.fillRect(40, 52, 16, 7); }
      if (type === "bag") { x.lineWidth = 3; x.stroke(new Path2D("M26 48 C26 18 74 18 74 48")); x.lineWidth = 1.6; x.stroke(new Path2D("M20 60 H80")); if (!back) x.fillRect(44, 70, 12, 8); }
    }
    // Texture produit ; hauts et hoodies dessinés par-dessus le cintre (le cintre est DANS le vêtement)
    function itemTexture(type, c, a, back, st) {
      const sneaker = type === "sneaker", hang = type === "tee" || type === "hoodie", clip = type === "pants";
      const [cn, x] = cv(256, sneaker ? 140 : hang || clip ? 320 : 282);
      const hook = () => { x.save(); x.strokeStyle = "#cfc9c0"; x.lineWidth = 5; x.lineCap = "round"; x.stroke(new Path2D("M128 62 V44 C128 32 146 32 146 20 C146 8 124 6 121 18")); x.restore(); };
      if (hang) { hook(); x.save(); x.strokeStyle = "#8a6a4e"; x.lineWidth = 8; x.lineJoin = "round"; x.stroke(new Path2D("M128 60 L30 104 H226 Z")); x.restore(); }
      x.save();
      if (hang || clip) x.translate(0, 38);
      x.scale(2.56, 2.56);
      if (sneaker) x.translate(0, -40);
      if (back && (sneaker || type === "cap")) { x.translate(100, 0); x.scale(-1, 1); }
      drawItem(x, type, c, a, back, st);
      x.restore();
      if (clip) { hook(); x.save(); x.strokeStyle = "#2b2a2c"; x.lineWidth = 7; x.lineCap = "round"; x.stroke(new Path2D("M66 60 H190")); x.fillStyle = "#2b2a2c"; x.fillRect(74, 56, 16, 24); x.fillRect(166, 56, 16, 24); x.restore(); }
      return T(cn);
    }
    // Vrai produit : sa photo dans une carte (bords blancs arrondis), sur le même cintre que les dessins.
    // La photo arrive en différé : on redessine la scène quand elle est chargée (onLoad).
    // `k` = finesse : 2 (512 px) sur le portant, 4 (1024 px) pour l'article regardé de près (Zoom).
    // Les mesures ci-dessous sont en « points » sur 256 de large, multipliés par k.
    function photoTexture(type, src, onLoad, k = 2) {
      const sneaker = type === "sneaker", hang = type === "tee" || type === "hoodie" || type === "jacket", clip = type === "pants" || type === "shorts";
      const H = sneaker ? 140 : hang || clip ? 320 : 282;
      const [cn, x] = cv(256 * k, H * k), tex = T(cn);
      x.scale(k, k); x.imageSmoothingQuality = "high";
      const top = hang || clip ? 64 : 4, card = { x: 10, y: top, w: 236, h: H - top - 6 };
      const rr = (p) => { const r = 14; x.beginPath(); x.moveTo(p.x + r, p.y); x.arcTo(p.x + p.w, p.y, p.x + p.w, p.y + p.h, r); x.arcTo(p.x + p.w, p.y + p.h, p.x, p.y + p.h, r); x.arcTo(p.x, p.y + p.h, p.x, p.y, r); x.arcTo(p.x, p.y, p.x + p.w, p.y, r); x.closePath(); };
      if (hang || clip) { x.save(); x.strokeStyle = "#cfc9c0"; x.lineWidth = 5; x.lineCap = "round"; x.stroke(new Path2D("M128 66 V44 C128 32 146 32 146 20 C146 8 124 6 121 18")); x.restore(); }
      x.save(); x.shadowColor = "rgba(0,0,0,.25)"; x.shadowBlur = 10; x.fillStyle = "#ffffff"; rr(card); x.fill(); x.restore();
      const img = new Image();
      img.onload = () => {
        const inner = { x: card.x + 6, y: card.y + 6, w: card.w - 12, h: card.h - 12 };
        const s = Math.max(inner.w / img.width, inner.h / img.height), w = img.width * s, h = img.height * s;
        x.save(); rr(inner); x.clip(); x.drawImage(img, inner.x + (inner.w - w) / 2, inner.y + (inner.h - h) / 2, w, h); x.restore();
        tex.needsUpdate = true; onLoad();
      };
      img.src = src;
      return tex;
    }
    // Mannequin de vitrine : tête ovale brillante sans visage, long cou, buste sculpté, bras posés
    function limb(g, a, b, r1, r2, mat) {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, A.distanceTo(B), 16), mat);
      m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); g.add(m); return m;
    }
    function joint(g, p, r, mat, sx = 1, sy = 1, sz = 1) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat); m.position.set(...p); m.scale.set(sx, sy, sz); g.add(m); return m; }
    function mannequin(st, variant) {
      const g = new THREE.Group(), darkSkin = variant === 1, hoodie = variant === 1;
      const skin = new THREE.MeshPhongMaterial({ color: darkSkin ? 0x1c1c1f : 0xf4f3f0, specular: darkSkin ? 0xb0b0b0 : 0x9a9a9a, shininess: 110 });
      const topCol = new THREE.Color(hoodie ? st.fg : st.bg);
      const top = new THREE.MeshLambertMaterial({ map: clothTex(st, hoodie, hoodie ? "hoodie" : "tee") });
      const sleeve = new THREE.MeshLambertMaterial({ color: topCol.clone().multiplyScalar(0.9) });
      const pants = new THREE.MeshLambertMaterial({ color: hoodie ? 0xc4c1bc : 0x1d1d20 });
      const shoe = new THREE.MeshPhongMaterial({ color: 0xf6f5f2, shininess: 30 });
      [[-1, 0], [1, 1]].forEach(([s, bent]) => {
        const hip = [s * 0.085, 0.95, 0], knee = [s * 0.09 + (bent ? 0.03 : 0), 0.5, bent ? 0.05 : 0], ank = [s * 0.1 + (bent ? 0.05 : 0), 0.09, bent ? 0.01 : 0];
        const r = hoodie ? 0.105 : 0.088;
        limb(g, hip, knee, r, r * 0.82, pants); joint(g, knee, r * 0.82, pants); limb(g, knee, ank, r * 0.82, r * 0.72, pants);
        joint(g, [ank[0], 0.045, ank[2] + 0.05], 0.06, shoe, 1.05, 0.62, 1.9);
      });
      const prof = [[0.001, 0.9], [0.13, 0.91], [0.172, 0.97], [0.168, 1.05], [0.138, 1.15], [0.142, 1.25], [0.166, 1.35], [0.172, 1.42], [0.152, 1.48], [0.085, 1.53], [0.05, 1.55]].map(([r, y]) => new THREE.Vector2(r * (hoodie ? 1.1 : 1.02), y));
      const torso = new THREE.Mesh(new THREE.LatheGeometry(prof, 40, Math.PI, Math.PI * 2), top); torso.scale.set(1, 1, 0.72); g.add(torso);
      limb(g, [0, 1.52, 0], [0, 1.66, 0.012], 0.05, 0.043, skin);
      const head = joint(g, [0, 1.78, 0.02], 0.1, skin, 0.9, 1.3, 1.02); head.rotation.x = -0.08;
      if (hoodie) joint(g, [0, 1.52, -0.1], 0.14, sleeve, 1.25, 0.62, 0.8);
      const arms = [{ s: [-0.205, 1.45, 0], el: [-0.25, 1.16, 0.015], wr: [-0.26, 0.9, 0.04] }, { s: [0.205, 1.45, 0], el: [0.34, 1.18, -0.03], wr: [0.19, 1.0, 0.04] }];
      arms.forEach((a) => {
        const mid = a.s.map((v, i) => lerp(v, a.el[i], 0.45));
        joint(g, a.s, 0.062, sleeve);
        limb(g, a.s, mid, 0.062, 0.056, sleeve);
        limb(g, mid, a.el, 0.05, 0.043, hoodie ? sleeve : skin);
        joint(g, a.el, hoodie ? 0.05 : 0.042, hoodie ? sleeve : skin);
        limb(g, a.el, a.wr, hoodie ? 0.05 : 0.04, hoodie ? 0.047 : 0.032, hoodie ? sleeve : skin);
        joint(g, [a.wr[0], a.wr[1] - 0.055, a.wr[2]], 0.042, skin, 0.7, 1.45, 1.05);
      });
      joint(g, [0, 0.012, 0], 0.24, new THREE.MeshPhongMaterial({ color: 0x2b2a2c, shininess: 60 }), 1, 0.05, 1);
      return g;
    }
    GH = { cv, T, wordTex, labelTex, glowTex, itemTexture, photoTexture, mannequin };
    return GH;
  }

  function disposeScene(scene) {
    scene.traverse((ob) => {
      if (ob.geometry) ob.geometry.dispose();
      const ms = ob.material ? (Array.isArray(ob.material) ? ob.material : [ob.material]) : [];
      ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    });
  }

  /* ===== Le mall en T =====
     Plan : docs/fraul-walk-plan-T.png. On entre par le bas du tronc, on regarde une
     boutique à la fois (vitrines toujours à droite), on fait le tour de la barre du T
     autour de la pièce centrale, puis on redescend vers la sortie. */
  const SHOPS = o.shops.map((s) => s.style);
  // Plan du mall calculé pour le nombre de boutiques (mode « t » : src/walk/modes/t.ts).
  const LAYOUT = getMode(o.mode).layout(SHOPS.length);
  const { SLOT, CEIL, STEM_X, STEM_END, BAR_X, BAR_Z } = LAYOUT.dims;
  const SLOTS = LAYOUT.slots, ENTRY = LAYOUT.entry;
  const N = Math.min(SHOPS.length, SLOTS.length);

  // Parcours : entrée → un arrêt face à chaque vitrine → sortie (src/walk/models/walk-path.ts).
  let dist = 10;
  const pathAt = (p) => pathAtFor(p, N, dist, LAYOUT);

  let MALL = null, progress = 0, curShop = 0, curKey = null, walkOpen = false, storeOpen = false;
  const walkEl = $("#walk"), track = $("#walkTrack");
  track.style.height = ((N + 2) * 90 + 100) + "vh"; // + l'arrêt Fraul Finds
  // Pour le test téléphone : nombre d'étapes et place de Fraul Finds dans le parcours.
  walkEl.dataset.stops = String(N + 2); walkEl.dataset.conAfter = String(LAYOUT.concierge.after);
  const prog = $("#prog");
  for (let k = 0; k < 9; k++) { const i = document.createElement("i"); i.append(document.createElement("b")); prog.append(i); }
  const bars = [...prog.querySelectorAll("b")];

  function setHud(i) {
    if (curKey === i) return; curKey = i;
    $("#aisle").hidden = i < 0;
    $("#outro").hidden = i !== AT_EXIT;
    $("#conStop").hidden = i !== AT_CONCIERGE;
    if (i < 0) return;
    curShop = i;
    $("#count").textContent = `Boutique ${String(i + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`;
    const b = $("#bname"); b.textContent = SHOPS[i].name; b.classList.remove("swap"); void b.offsetWidth; b.classList.add("swap");
    prepareStore(i);
    remember({ last: SHOP_NAMES[i], at: Date.now() }); // on reprendra ici au prochain passage
  }
  // Pendant qu'on regarde une vitrine, sa boutique se prépare en coulisse : en touchant, on y est tout de suite.
  let prepT = 0;
  function prepareStore(i) {
    clearTimeout(prepT);
    prepT = setTimeout(() => {
      const brand = SHOP_NAMES[i];
      if (dead || !THREE || storeOpen || curShop !== i || (STORE && STORE.brand === brand)) return;
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 0));
      idle(() => {
        if (dead || storeOpen || curShop !== i || (STORE && STORE.brand === brand)) return;
        try { if (STORE) STORE.dispose(); STORE = buildStore(styleOf(brand)); STORE.warm(); } catch { STORE = null; }
      });
    }, 600);
  }
  life.signal.addEventListener("abort", () => clearTimeout(prepT));
  function onWalkScroll() {
    progress = clamp(walkEl.scrollTop / Math.max(1, track.offsetHeight - walkEl.clientHeight), 0, 1);
    bars.forEach((b, k) => (b.style.width = clamp(progress * 9 - k, 0, 1) * 100 + "%"));
    if (progress > 0.02 && !root.classList.contains("seen-scroll")) gesture("scroll");
    const st = pathAt(progress);
    $("#intro").style.opacity = st.intro ? clamp(st.intro * 1.8 - 0.4, 0, 1) : 0;
    setHud(st.shop);
    if (MALL) MALL.kick();
  }
  on(walkEl, "scroll", onWalkScroll, { passive: true });
  function jumpToShop(k) {
    const p = progressForShop(k, N, LAYOUT);
    walkEl.scrollTop = p * (track.offsetHeight - walkEl.clientHeight);
    if (MALL) MALL.snap(); onWalkScroll();
  }
  async function openWalk(i) {
    const ok = await ensureThree();
    if (dead) return;
    walkEl.hidden = false; walkOpen = true;
    if (ok && !MALL) { try { MALL = initMall(); } catch (err) { console.error(err); walkEl.classList.add("nogl"); } }
    if (!ok) walkEl.classList.add("nogl");
    if (MALL) MALL.resize();
    if (typeof i === "number") jumpToShop(i); else { walkEl.scrollTop = 0; if (MALL) MALL.snap(); onWalkScroll(); }
  }
  const enterShop = (k) => {
    gesture("tap");
    const brand = SHOP_NAMES[k];
    if (MALL) MALL.enter(k, () => openStore(brand, { fromWalk: true })); else openStore(brand, { fromWalk: true });
  };
  on($("#wQuit"), "click", () => o.onExit());
  on($("#enter"), "click", () => enterShop(curShop));
  on($("#again"), "click", () => { walkEl.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" }); });

  function initMall() {
    const U = G(), canvas = $("#gl"), stage = $("#stage");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.outputEncoding = THREE.sRGBEncoding;
    // Lumière selon l'heure locale du visiteur (src/walk/models/daylight.ts) : jour, soir plus sombre et éclairé, jamais noir
    const DL = daylightAt(typeof o.hour === "number" ? o.hour : localHour());
    walkEl.dataset.time = DL.label;
    const SKY = DL.sky;
    renderer.setClearColor(SKY);
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(SKY, 34, 90);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 160);
    const std = (c, r = 0.8, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: c, emissiveIntensity: e });
    const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
    const add = (parent, geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m; };
    const flat = (parent, w, d, mat, x, y, z, up = true) => { const m = add(parent, new THREE.PlaneGeometry(w, d), mat, x, y, z); m.rotation.x = up ? -Math.PI / 2 : Math.PI / 2; return m; };

    scene.add(new THREE.HemisphereLight(DL.tint, 0xcfc6b8, DL.hemi));
    const sun = new THREE.DirectionalLight(0xfff6ea, DL.sun); sun.position.set(10, 30, 20); scene.add(sun);

    // Coque du mall : sols en pierre claire polie, plafond blanc, bandeaux lumineux
    const floorM = std(0xe2dbcf, 0.32, 0.08), ceilM = lam(0xfbfaf6), wallM = lam(0xefe9df), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    flat(scene, 2 * BAR_X, -BAR_Z, floorM, 0, 0, BAR_Z / 2);
    flat(scene, 2 * STEM_X, STEM_END, floorM, 0, 0, STEM_END / 2);
    flat(scene, 2 * BAR_X, -BAR_Z, ceilM, 0, CEIL, BAR_Z / 2, false);
    flat(scene, 2 * STEM_X, STEM_END, ceilM, 0, CEIL, STEM_END / 2, false);
    // Incrustations de sol (allée) couleur perle
    const inlay = std(0xe0d6c3, 0.4);
    flat(scene, 0.25, STEM_END, inlay, -2.6, 0.004, STEM_END / 2); flat(scene, 0.25, STEM_END, inlay, 2.6, 0.004, STEM_END / 2);
    [[-12, BAR_Z / 2], [12, BAR_Z / 2]].forEach(([x, z]) => flat(scene, 0.25, -BAR_Z - 12, inlay, x, 0.004, z));
    [-6, -26].forEach((z) => flat(scene, 24.25, 0.25, inlay, 0, 0.004, z));
    // Bandeaux lumineux au plafond
    [-3.5, 3.5].forEach((x) => add(scene, new THREE.BoxGeometry(0.12, 0.03, STEM_END - 2), white, x, CEIL - 0.02, STEM_END / 2));
    [-9, -23].forEach((z) => add(scene, new THREE.BoxGeometry(2 * BAR_X - 6, 0.03, 0.12), white, 0, CEIL - 0.02, z));
    // Spots
    const spotPos = [];
    for (let z = 3; z < STEM_END - 1; z += 3) for (const x of [-5, 0, 5]) spotPos.push([x, z]);
    for (let x = -30; x <= 30; x += 3) for (const z of [-3, -29]) spotPos.push([x, z]);
    for (let z = -6; z >= -26; z -= 4) for (const x of [-30, 30]) spotPos.push([x, z]);
    const spots = new THREE.InstancedMesh(new THREE.CircleGeometry(0.09, 14), new THREE.MeshBasicMaterial({ color: 0xfff8ee, side: THREE.DoubleSide }), spotPos.length);
    const dummy = new THREE.Object3D();
    spotPos.forEach(([x, z], k) => { dummy.position.set(x, CEIL - 0.03, z); dummy.rotation.set(Math.PI / 2, 0, 0); dummy.updateMatrix(); spots.setMatrixAt(k, dummy.matrix); });
    scene.add(spots);

    // Murs entre les boutiques (on bouche les espaces non occupés par une vitrine)
    function wallLine(x0, z0, x1, z1, covered) {
      const horiz = z0 === z1, a = horiz ? Math.min(x0, x1) : Math.min(z0, z1), b = horiz ? Math.max(x0, x1) : Math.max(z0, z1);
      const gaps = []; let cur = a;
      covered.sort((p, q) => p - q).forEach((c) => { const s = c - SLOT / 2, e = c + SLOT / 2; if (s - cur > 0.05) gaps.push([cur, s]); cur = Math.max(cur, e); });
      if (b - cur > 0.05) gaps.push([cur, b]);
      gaps.forEach(([s, e]) => {
        const len = e - s, mid = (s + e) / 2;
        if (horiz) add(scene, new THREE.BoxGeometry(len, CEIL, 0.4), wallM, mid, CEIL / 2, z0);
        else add(scene, new THREE.BoxGeometry(0.4, CEIL, len), wallM, x0, CEIL / 2, mid);
      });
    }
    const along = (f) => SLOTS.slice(0, N).filter(f);
    wallLine(STEM_X, 0, STEM_X, STEM_END, along((s) => s.x === STEM_X).map((s) => s.z));
    wallLine(-STEM_X, 0, -STEM_X, STEM_END, along((s) => s.x === -STEM_X).map((s) => s.z));
    wallLine(STEM_X, 0, BAR_X, 0, along((s) => s.z === 0 && s.x > 0).map((s) => s.x));
    wallLine(-BAR_X, 0, -STEM_X, 0, along((s) => s.z === 0 && s.x < 0).map((s) => s.x));
    wallLine(BAR_X, BAR_Z, BAR_X, 0, along((s) => s.x === BAR_X).map((s) => s.z));
    wallLine(-BAR_X, BAR_Z, -BAR_X, 0, along((s) => s.x === -BAR_X).map((s) => s.z));
    wallLine(-BAR_X, BAR_Z, BAR_X, BAR_Z, along((s) => s.z === BAR_Z).map((s) => s.x));

    // Entrée / sortie : portes vitrées au bas du tronc, lumière du jour derrière
    add(scene, new THREE.BoxGeometry(STEM_X - 2.6, CEIL, 0.4), wallM, -(STEM_X + 2.6) / 2, CEIL / 2, STEM_END);
    add(scene, new THREE.BoxGeometry(STEM_X - 2.6, CEIL, 0.4), wallM, (STEM_X + 2.6) / 2, CEIL / 2, STEM_END);
    add(scene, new THREE.BoxGeometry(5.2, CEIL - 3.6, 0.4), wallM, 0, 3.6 + (CEIL - 3.6) / 2, STEM_END);
    // Portes en verre « Welcome to Fraul Center » qui s'écartent à l'approche (src/walk/views/entrance.ts)
    const entrance = createEntrance(THREE, { z: STEM_END, width: 5.2, height: 3.6, lines: ENTRANCE_TEXT, serif: o.fonts.serif });
    scene.add(entrance.group);
    add(scene, new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ color: DL.night ? SKY : 0xffffff }), 0, 5, STEM_END + 14, Math.PI); // dehors : le jour, ou le ciel du soir
    flat(scene, 30, 16, std(0xe2dccf, 0.5), 0, -0.01, STEM_END + 7);
    const sign = (txt, x, z, rot) => { const m = flat(scene, 4.6, 0.86, new THREE.MeshBasicMaterial({ map: U.labelTex(txt, "#680209"), transparent: true }), x, 0.006, z); if (rot) m.rotation.z = Math.PI; };
    sign("ENTRÉE ↑", 2.8, STEM_END - 5, false);
    sign("SORTIE ↓", -2.8, STEM_END - 5, true);

    // Pièce centrale : grand « F » Fraul sur un socle, entouré d'arbres en pot
    const C = new THREE.Group(); C.position.set(0, 0, -16); scene.add(C);
    // Comptoir Fraul Finds au pied du « F », tourné vers l'entrée (src/walk/views/concierge.ts), placé par le mode
    const desk = createConciergeDesk(THREE, { ...LAYOUT.concierge.slot, ...CONCIERGE_TEXT, serif: o.fonts.serif, sans: o.fonts.sans }).group;
    scene.add(desk);
    // Le comptoir cache les vitrines derrière lui : le toucher ouvre Fraul Finds, jamais la boutique cachée.
    const deskHits = []; desk.traverse((m) => { if (m.isMesh) { m.userData.desk = true; deskHits.push(m); } });
    add(C, new THREE.CylinderGeometry(3.1, 3.3, 0.6, 48), std(0xe8e1d4, 0.35), 0, 0.3, 0);
    add(C, new THREE.CylinderGeometry(2.6, 2.6, 0.04, 48), std(0x680209, 0.4), 0, 0.62, 0);
    const fM = std(0x680209, 0.22, 0.35);
    const F = new THREE.Group(); F.position.y = 0.62; C.add(F);
    add(F, new THREE.BoxGeometry(0.75, 4.4, 0.75), fM, -0.75, 2.2, 0);
    add(F, new THREE.BoxGeometry(2.7, 0.75, 0.75), fM, 0.2, 4.03, 0);
    add(F, new THREE.BoxGeometry(2.0, 0.65, 0.75), fM, -0.15, 2.6, 0);
    const leafA = lam(0x6b7a55), leafB = lam(0x56653f), trunkM = lam(0x7a6450), potM = std(0xdcd3c4, 0.5);
    [[-5.5, -3.5], [5.5, -3.5], [-5.5, 3.5], [5.5, 3.5]].forEach(([x, z], k) => {
      const t = new THREE.Group(); t.position.set(x, 0, z); C.add(t);
      add(t, new THREE.CylinderGeometry(0.75, 0.6, 0.9, 20), potM, 0, 0.45, 0);
      add(t, new THREE.CylinderGeometry(0.08, 0.12, 2.0, 8), trunkM, 0, 1.9, 0);
      [[0, 3.1, 0, 0.95], [0.5, 2.8, 0.2, 0.7], [-0.45, 2.9, -0.2, 0.75], [0.1, 3.6, -0.3, 0.6]].forEach(([a, b, c, r], j) =>
        add(t, new THREE.SphereGeometry(r, 14, 10), (j + k) % 2 ? leafA : leafB, a, b, c));
    });

    // Boutiques : façade + enseigne + zone à toucher tout de suite ; mannequins et intérieur à l'approche
    const metal = std(0xc9c3b9, 0.3, 0.7), lightLine = new THREE.MeshBasicMaterial({ color: 0xfffaf0 });
    const glow = U.glowTex(true), pillarM = lam(0xfbf9f4);
    const hits = [], shops = [];
    SLOTS.slice(0, N).forEach((s, k) => {
      const st = SHOPS[k], g = new THREE.Group();
      g.position.set(s.x, 0, s.z); g.rotation.y = Math.atan2(s.nx, s.nz); scene.add(g);
      const facade = std(new THREE.Color(st.bg).getHex(), 0.6, 0.05, 0.05);
      [-1, 1].forEach((sd) => add(g, new THREE.BoxGeometry(1.75, CEIL, 0.4), facade, sd * 3.25, CEIL / 2, 0.2));
      add(g, new THREE.BoxGeometry(4.8, CEIL - 4.2, 0.4), facade, 0, 4.2 + (CEIL - 4.2) / 2, 0.2);
      const sm = new THREE.MeshBasicMaterial({ map: U.wordTex(st, { w: 512, h: 100, bg: st.bg, maxW: 430, px: 64 }) });
      add(g, new THREE.PlaneGeometry(4.6, 0.9), sm, 0, 5.2, 0.41);
      [-2.4, 2.4].forEach((dx) => add(g, new THREE.BoxGeometry(0.07, 4.2, 0.08), metal, dx, 2.1, 0.42));
      add(g, new THREE.BoxGeometry(4.87, 0.07, 0.08), metal, 0, 4.2, 0.42);
      add(g, new THREE.BoxGeometry(4.8, 0.02, 0.04), lightLine, 0, 0.012, 0.44);
      add(g, new THREE.BoxGeometry(0.5, CEIL, 0.7), pillarM, -SLOT / 2 + 0.05, CEIL / 2, 0.35);
      // Fond lumineux visible par la porte (l'intérieur détaillé vient à l'approche)
      const backdrop = add(g, new THREE.PlaneGeometry(4.6, 4.1), new THREE.MeshBasicMaterial({ map: glow }), 0, 2.05, -0.3);
      const hit = add(g, new THREE.PlaneGeometry(SLOT - 0.4, CEIL), new THREE.MeshBasicMaterial({ visible: false }), 0, CEIL / 2, 0.5);
      hit.userData.shop = k; hits.push(hit);
      shops.push({ g, st, s, detail: null, backdrop });
    });
    function buildDetail(sh, k) {
      const d = new THREE.Group(), st = sh.st; sh.g.add(d); sh.detail = d;
      [-1, 1].forEach((sd) => {
        add(d, new THREE.PlaneGeometry(1.35, 3.2), new THREE.MeshBasicMaterial({ map: glow }), sd * 3.25, 1.8, 0.41);
        const m = U.mannequin(st, sd > 0 ? 1 : 0); m.position.set(sd * 3.25, 0, 0.9); m.rotation.y = -sd * 0.2; d.add(m);
      });
      const fl = add(d, new THREE.PlaneGeometry(8, 6.4), lam(0xdcd0bd), 0, 0.005, -3.4); fl.rotation.x = -Math.PI / 2;
      [-1, 1].forEach((sd) => add(d, new THREE.PlaneGeometry(6.4, CEIL), lam(0xf1ece3), sd * 4, CEIL / 2, -3.4, -sd * Math.PI / 2));
      add(d, new THREE.PlaneGeometry(8, CEIL), lam(0xf6f2ea), 0, CEIL / 2, -6.6);
      add(d, new THREE.BoxGeometry(3.4, 1.6, 0.08), new THREE.MeshBasicMaterial({ color: new THREE.Color(st.bg) }), 0, 2.6, -6.55);
      add(d, new THREE.PlaneGeometry(3, 0.58), new THREE.MeshBasicMaterial({ map: U.wordTex(st, { w: 512, h: 100, maxW: 430, px: 64 }), transparent: true }), 0, 2.6, -6.5);
      add(d, new THREE.BoxGeometry(2, 0.8, 2.4), lam(0xe8e3db), 0, 0.4, -3.6);
      const m = U.mannequin(st, k % 2); m.position.set(0, 0.8, -3.6); d.add(m);
      // Vitrine vivante : les pièces phares de la marque dans deux cadres, qui changent quand on est devant
      const live = liveItems(st.name);
      if (live.length) {
        const frames = [-1, 1].slice(0, live.length > 1 ? 2 : 1).map((sd, i, all) => {
          const f = new THREE.Group(); f.position.set(all.length > 1 ? sd * 1.75 : 1.75, 0, -1.7); f.rotation.y = all.length > 1 ? -sd * 0.22 : -0.22; d.add(f);
          add(f, new THREE.BoxGeometry(1.3, 1.66, 0.06), frameM, 0, 1.85, -0.04);
          add(f, new THREE.CylinderGeometry(0.02, 0.02, 1.05, 8), frameM, 0, 0.52, -0.05);
          return add(f, new THREE.PlaneGeometry(1.2, 1.56), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 1.85, 0.001);
        });
        sh.live = { items: live, frames, k: 0 }; showLive(sh);
      }
      const GC = [0xf1ece0, 0x141416, 0x680209, 0x6b6766, 0xeae0c8, 0x202833, 0x9a938a];
      const rail = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), lam(0xffffff), 30), dm = new THREE.Object3D();
      let n = 0;
      [-1, 1].forEach((sd) => { for (let z = -1.2; z > -6.1 && n < 30; z -= 0.33, n++) { const h = 0.95 + ((n + k) % 3) * 0.1; dm.position.set(sd * 3.75, 2.75 - h / 2, z); dm.scale.set(0.05, h, 0.6); dm.updateMatrix(); rail.setMatrixAt(n, dm.matrix); rail.setColorAt(n, new THREE.Color(GC[(n * 3 + k) % GC.length])); } });
      rail.count = n; d.add(rail);
    }
    // Pièces phares d'une marque pour sa vitrine : les vraies photos d'abord, 6 au plus.
    const frameM = std(0x1b1b1d, 0.4, 0.3);
    function liveItems(brand) {
      const all = CATS.flatMap(([id]) => products(brand, id).map((it) => ({ it, cat: id })));
      return [...all.filter((x) => x.it.img), ...all.filter((x) => !x.it.img)].slice(0, 6);
    }
    /** Image d'un cadre : la photo (ou le dessin) centrée sur fond blanc, sans déformation. */
    function frameTex({ it, cat }) {
      const [c, x] = U.cv(384, 500), tex = U.T(c);
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, 384, 500);
      const draw = (src, w, h) => { const r = Math.min(344 / w, 460 / h); x.drawImage(src, (384 - w * r) / 2, (500 - h * r) / 2, w * r, h * r); tex.needsUpdate = true; kick(); };
      if (it.img) { const im = new Image(); im.onload = () => draw(im, im.naturalWidth, im.naturalHeight); im.src = it.img[0]; }
      else { const t = U.itemTexture(cat, it.c, it.a, false); draw(t.image, t.image.width, t.image.height); t.dispose(); }
      return tex;
    }
    function showLive(sh) {
      const { items, frames, k } = sh.live;
      frames.forEach((pic, i) => { const old = pic.material.map; pic.material.map = frameTex(items[(k + i) % items.length]); pic.material.needsUpdate = true; if (old) old.dispose(); });
    }
    // Toutes les 5 s, la vitrine devant laquelle on se trouve passe aux pièces suivantes.
    const liveTimer = setInterval(() => {
      const sh = shops[curShop];
      if (RM || !walkOpen || storeOpen || !sh || !sh.live || !sh.detail || !sh.detail.visible || sh.live.items.length <= sh.live.frames.length) return;
      sh.live.k = (sh.live.k + sh.live.frames.length) % sh.live.items.length; showLive(sh); kick();
    }, 5000);
    life.signal.addEventListener("abort", () => clearInterval(liveTimer));

    let lastDetail = null;
    function updateDetails(x, z) {
      if (lastDetail && Math.hypot(lastDetail[0] - x, lastDetail[1] - z) < 0.8) return;
      lastDetail = [x, z];
      shops.forEach((sh, k) => {
        const d = Math.hypot(sh.s.x - x, sh.s.z - z);
        if (d < 30 && !sh.detail) buildDetail(sh, k);
        if (sh.detail) { sh.detail.visible = d < 38; sh.backdrop.visible = !sh.detail.visible; }
      });
    }

    function resize() {
      const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight, a = w / h;
      renderer.setSize(w, h, false); camera.aspect = a; camera.fov = a < 1 ? 66 : 52; camera.updateProjectionMatrix();
      const hHalf = Math.atan(Math.tan(camera.fov * Math.PI / 360) * a);
      dist = clamp(((a < 1 ? 9.2 : 13) / 2) / Math.tan(hHalf), 7, 12); kick();
    }
    on(window, "resize", () => { if (walkOpen) resize(); });

    // Toucher une vitrine = entrer dans la boutique (le défilement ne fait jamais entrer)
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const pick = (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects([...hits, ...deskHits], false)[0]; return !h || h.distance >= 40 ? -1 : h.object.userData.desk ? DESK : h.object.userData.shop; };
    const DESK = -9;
    let down = null, px = 0, py = 0;
    on(canvas, "pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
    on(canvas, "pointerup", (e) => {
      if (!down || entering) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
      if (moved > 8) return;
      const k = pick(e); if (k === DESK) openConcierge(null); else if (k >= 0) enterShop(k);
    });
    on(canvas, "pointercancel", () => { down = null; });
    on(stage, "pointermove", (e) => {
      if (e.pointerType !== "mouse") return; const r = stage.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5;
      const k = pick(e); canvas.style.cursor = k >= 0 || k === DESK ? "pointer" : "default"; kick();
    });

    const cam = { x: ENTRY.p[0], z: ENTRY.p[1] + 6, lx: ENTRY.l[0], ly: ENTRY.l[1], lz: ENTRY.l[2] };
    let raf = 0, entering = false, snapNext = true;
    function kick() { if (!raf && !dead) raf = requestAnimationFrame(frame); }
    function frame() {
      raf = 0; if (!walkOpen || storeOpen || dead) return;
      let more = false;
      {
        const tg = pathAt(progress), k = snapNext || RM ? 1 : 0.12; snapNext = false;
        let diff = 0;
        ["x", "z", "lx", "ly", "lz"].forEach((key) => { const dv = tg[key] - cam[key]; cam[key] += dv * k; diff += Math.abs(dv); });
        if (diff > 0.004) more = true;
      }
      updateDetails(cam.x, cam.z);
      entrance.update(cam.z);
      camera.position.set(cam.x + px * 0.35, EYE - py * 0.12, cam.z);
      camera.lookAt(cam.lx - px * 0.6, cam.ly - py * 0.3, cam.lz);
      renderer.render(scene, camera);
      if (more) kick();
    }
    resize();
    return {
      kick, resize,
      snap() { snapNext = true; kick(); },
      // Entrer sans marcher (Rhamone, 18 oct. 2026 : « c'est un site, pas un film ») : un fondu rapide et on est dedans.
      // La caméra ne bouge pas : en sortant, on se retrouve face à la même vitrine.
      enter(k, cb) {
        if (entering) return;
        entering = true; $("#veil").style.opacity = 1;
        setTimeout(() => { entering = false; cb(); }, RM ? 0 : FADE_MS);
      },
      dispose() { cancelAnimationFrame(raf); disposeScene(scene); renderer.dispose(); },
    };
  }

  /* ===== La boutique (un seul gabarit pour toutes les marques) ===== */
  // Plan de la boutique (zones, portants, contournement de l'îlot) : src/walk/models/store-layout.ts.

  const storeEl = $("#store");
  let SR = null, STORE = null, sBrand = "", sCat = null, sFromWalk = false;
  let sMode = "walk", backLock = 0, storeFrom = null;
  function sUI(mode) {
    sMode = mode;
    const r = mode === "rayon";
    $("#sBottom").hidden = mode !== "hub"; $("#sInfo").hidden = !r; $("#sPrev").hidden = !r; $("#sNext").hidden = !r;
  }
  function btn(cls, text, data) { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = text; Object.assign(b.dataset, data); return b; }
  async function openStore(brand, { fromWalk = false } = {}) {
    const ok = await ensureThree();
    if (dead) return;
    if (!ok) { o.onFallback(slugOf(brand)); return; }
    try {
      if (!STORE || STORE.brand !== brand) { if (STORE) STORE.dispose(); STORE = buildStore(styleOf(brand)); }
    } catch { STORE = null; o.onFallback(slugOf(brand)); return; }
    sBrand = brand; sFromWalk = fromWalk; sCat = null;
    if (storeEl.hidden) storeFrom = opener();
    storeEl.hidden = false; storeOpen = true; trapUpdate();
    $("#sQuit").focus({ preventScroll: true });
    openLayer("store", closeStore); // sortir = retour direct devant la vitrine, sans marcher jusqu'à la porte
    $("#sTitle").textContent = `${brand} · Boutique`;
    const cats = $("#sCats"); cats.textContent = ""; rayons().forEach(([id, l]) => cats.append(btn("s-cat", l, { cat: id })));
    // On arrive directement au centre, devant le choix des rayons (plus de marche depuis la porte).
    STORE.resize(); STORE.setActive(null); STORE.place("hub"); sUI("hub");
  }
  /** Durée du fondu à l'entrée et à la sortie d'une boutique (ms). */
  const FADE_MS = 150;
  function closeStore() {
    if (storeEl.hidden) return;
    storeEl.hidden = true; storeOpen = false; trapUpdate();
    if (sFromWalk && walkOpen) { $("#veil").style.opacity = 0; if (MALL) MALL.kick(); }
    else if (!walkOpen) openWalk(Math.max(0, SHOP_NAMES.indexOf(sBrand)));
    giveBack(storeFrom, $("#enter"));
  }
  // Rayon : animé = on marche jusqu'au centre ; sinon on remet juste l'état (la boutique se ferme derrière).
  function closeRayon(anim) {
    sCat = null; STORE.setActive(null); sUI("walk");
    if (anim) STORE.walk("hub", () => sUI("hub"));
  }
  function goZone(cat) {
    gesture("rayon");
    openLayer("rayon", closeRayon);
    STORE.setActive(null); sUI("walk");
    STORE.walk(cat, () => { sCat = cat; STORE.setActive(cat); sUI("rayon"); renderChips(cat); showInfo(cat, STORE.focus(cat)); });
  }
  function renderChips(cat) {
    const c = $("#sChips"); c.textContent = "";
    c.append(btn("s-cat sm", "‹ Centre", { cat: "hub" }));
    rayons().filter((x) => x[0] !== cat).forEach(([id, l]) => c.append(btn("s-cat sm", l, { cat: id })));
  }
  // Même gabarit pour toutes les boutiques : les mêmes rayons partout, même vides (Rhamone, 19 oct.).
  const rayons = () => CATS.filter(([id]) => id in CAR);
  function showInfo(cat, k) {
    const it = STORE.item(cat, k);
    $("#iBrand").textContent = `${sBrand} · ${catLabel(cat)}`;
    // Rayon sans article pour cette marque : on le dit simplement, sans boutons d'achat.
    const empty = !it; $("#sInfo").classList.toggle("empty", empty); $("#sPrev").hidden = $("#sNext").hidden = empty;
    if (empty) { $("#iName").textContent = "Rien ici pour l'instant."; renderElse(cat); return; }
    $("#iName").textContent = it.n; $("#iPrice").textContent = o.formatPrice(it.p);
    $("#iCount").textContent = `${k + 1} / ${STORE.count(cat)}`;
    const dots = $("#iDots"); dots.textContent = "";
    it.vars.forEach((c) => { const d = btn("dot", "", { c }); d.style.background = c; d.setAttribute("aria-label", "Couleur"); d.setAttribute("aria-pressed", String(c === it.c)); dots.append(d); });
    const sizes = $("#iSizes"); sizes.textContent = "";
    it.sizes.forEach((z, i) => { const b = btn("size", z, {}); b.setAttribute("aria-pressed", String(i === Math.min(2, it.sizes.length - 1))); sizes.append(b); });
  }
  // Rayon vide : le même rayon chez d'autres marques (choix de Rhamone, 20 oct.), les vrais produits d'abord.
  function renderElse(cat) {
    const box = $("#iElse"); box.textContent = "";
    const others = SHOP_NAMES.filter((b) => b !== sBrand && products(b, cat).length > 0)
      .sort((a, b) => Number(products(b, cat).some((it) => it.img)) - Number(products(a, cat).some((it) => it.img))).slice(0, 4);
    if (!others.length) return;
    const p = document.createElement("p"); p.textContent = `${catLabel(cat)} chez :`; box.append(p);
    others.forEach((b) => box.append(btn("s-cat sm", b, { b, cat })));
  }
  on($("#iElse"), "click", (e) => {
    const b = e.target.closest(".s-cat"); if (!b) return;
    const { cat } = b.dataset; dropLayer("rayon");
    openStore(b.dataset.b, { fromWalk: sFromWalk }).then(() => { if (!storeEl.hidden) goZone(cat); });
  });
  on($("#sCats"), "click", (e) => { const b = e.target.closest(".s-cat"); if (b) goZone(b.dataset.cat); });
  on($("#sChips"), "click", (e) => {
    const b = e.target.closest(".s-cat"); if (!b) return;
    if (b.dataset.cat === "hub") closeLayer("rayon"); else goZone(b.dataset.cat);
  });
  on($("#sQuit"), "click", () => closeLayer("store"));
  // Revenir en arrière en faisant défiler (molette vers le haut, ou glisser vers le bas) :
  // dans un rayon → retour au centre ; au centre → on sort de la boutique. Jamais pour entrer.
  function storeBack() {
    if (!STORE || storeEl.hidden || sMode === "walk") return;
    const now = performance.now(); if (now < backLock) return; backLock = now + 900;
    gesture("back");
    closeLayer(hasLayer("rayon") ? "rayon" : "store");
  }
  on(storeEl, "wheel", (e) => { if (e.deltaY < -12) storeBack(); }, { passive: true });
  let tStart = null;
  on(storeEl, "touchstart", (e) => { const t = e.touches[0]; tStart = t ? { x: t.clientX, y: t.clientY } : null; }, { passive: true });
  on(storeEl, "touchend", (e) => {
    if (!tStart) return; const t = e.changedTouches[0], dx = t.clientX - tStart.x, dy = t.clientY - tStart.y; tStart = null;
    if (dy > 70 && Math.abs(dy) > 1.5 * Math.abs(dx)) storeBack();
  }, { passive: true });
  on(window, "keydown", (e) => {
    if (e.key !== "Escape" || !dir.hidden || storeEl.hidden) return;
    if (hasLayer("fiche")) closeLayer("fiche"); else if (hasLayer("zoom")) closeLayer("zoom"); else storeBack();
  });
  on($("#sPrev"), "click", () => STORE.step(-1));
  on($("#sNext"), "click", () => STORE.step(1));
  on($("#iSizes"), "click", (e) => { const b = e.target.closest(".size"); if (!b) return; $("#iSizes").querySelectorAll(".size").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); });
  on($("#iDots"), "click", (e) => { const d = e.target.closest(".dot"); if (!d || !sCat) return; const k = STORE.focus(sCat); STORE.recolor(sCat, k, d.dataset.c); showInfo(sCat, k); });
  on($("#iAdd"), "click", () => { if (!sCat || !STORE.count(sCat)) return; addToCart(STORE.item(sCat, STORE.focus(sCat)), $("#iSizes [aria-pressed=\"true\"]")?.textContent); });
  on($("#iClose"), "click", () => STORE.toggleClose());
  on($("#iPage"), "click", () => { if (sCat && STORE.count(sCat)) openFiche(STORE.item(sCat, STORE.focus(sCat))); });

  // Fiche en grand (src/walk/QuickView.tsx, dessinée par React) : une couche, le retour du téléphone la ferme.
  let ficheFrom = null;
  function openFiche(it) {
    if (STORE) STORE.unzoom();
    if (!hasLayer("fiche")) { ficheFrom = opener(); openLayer("fiche", () => { o.onFiche(null); giveBack(ficheFrom, $("#iPage")); }); }
    o.onFiche(it);
  }

  function buildStore(st) {
    const U = G();
    if (!SR) {
      const canvas = $("#sgl"), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); renderer.outputEncoding = THREE.sRGBEncoding; renderer.setClearColor(0xf3efe8);
      SR = { canvas, renderer, camera: new THREE.PerspectiveCamera(60, 1, 0.05, 80) };
    }
    const { canvas, renderer, camera } = SR, ac = new AbortController(), sig = { signal: ac.signal };
    life.signal.addEventListener("abort", () => ac.abort());
    const scene = new THREE.Scene(), V = (x, y, z) => new THREE.Vector3(x, y, z);
    const basic = (opt) => new THREE.MeshBasicMaterial(opt);
    const lamCache = {}; const lam = (c) => lamCache[c] || (lamCache[c] = new THREE.MeshLambertMaterial({ color: c }));
    const add = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; };
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8e8982, 1.0));
    const dl = new THREE.DirectionalLight(0xffffff, 0.45); dl.position.set(2, 6, 4); scene.add(dl);
    const pl = new THREE.PointLight(0xffffff, 0.5, 12, 1.5); pl.position.set(0, 3.5, -2); scene.add(pl);

    /* Surfaces à lumière « cuite » : ombres et reflets peints une fois dans les textures */
    { const [c, x] = U.cv(512, 256);
      const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, "#f4f2ee"); g.addColorStop(0.72, "#e2ded8"); g.addColorStop(0.93, "#cdc8c1"); g.addColorStop(1, "#a8a39c");
      x.fillStyle = g; x.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 7; i++) { const gx = (i + 0.5) * 512 / 7, r = x.createRadialGradient(gx, 0, 4, gx, 0, 130); r.addColorStop(0, "rgba(255,255,255,.6)"); r.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = r; x.fillRect(gx - 140, 0, 280, 150); }
      const wallM = basic({ map: U.T(c) });
      add(new THREE.PlaneGeometry(16, 4.2), wallM, -6, 2.1, -8, Math.PI / 2);
      add(new THREE.PlaneGeometry(16, 4.2), wallM, 6, 2.1, -8, -Math.PI / 2);
      add(new THREE.PlaneGeometry(12, 4.2), wallM, 0, 2.1, -16);
    }
    { const [c, x] = U.cv(512, 704), X = (v) => (v + 6) / 12 * 512, Y = (z) => (z + 16) / 16 * 704;
      x.fillStyle = "#a39f98"; x.fillRect(0, 0, 512, 704);
      for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},${(Math.random() * 0.05).toFixed(3)})`; x.fillRect(Math.random() * 512, Math.random() * 704, 2, 2); }
      [-2, 2].forEach((sx) => { const g = x.createLinearGradient(X(sx) - 44, 0, X(sx) + 44, 0); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,.3)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(X(sx) - 44, Y(-15.6), 88, Y(-0.4) - Y(-15.6)); });
      const ao = (gx0, gy0, gx1, gy1, rx, ry, rw, rh) => { const g = x.createLinearGradient(gx0, gy0, gx1, gy1); g.addColorStop(0, "rgba(24,20,18,.42)"); g.addColorStop(1, "rgba(24,20,18,0)"); x.fillStyle = g; x.fillRect(rx, ry, rw, rh); };
      ao(0, 0, 0, 44, 0, 0, 512, 44); ao(0, 704, 0, 660, 0, 660, 512, 44); ao(0, 0, 44, 0, 0, 0, 44, 704); ao(512, 0, 468, 0, 468, 0, 44, 704);
      const blob = (bx, bz, r, a) => { const g = x.createRadialGradient(X(bx), Y(bz), 0, X(bx), Y(bz), r); g.addColorStop(0, `rgba(24,20,18,${a})`); g.addColorStop(1, "rgba(24,20,18,0)"); x.fillStyle = g; x.fillRect(X(bx) - r, Y(bz) - r, 2 * r, 2 * r); };
      blob(0, -8.8, 150, 0.36); [[-2.6, -1.6], [2.6, -1.6], [-1.95, -14.6], [1.95, -14.6]].forEach(([bx, bz]) => blob(bx, bz, 30, 0.45));
      const fl = add(new THREE.PlaneGeometry(12, 16), basic({ map: U.T(c) }), 0, 0, -8); fl.rotation.x = -Math.PI / 2;
    }
    const ceil = add(new THREE.PlaneGeometry(12, 16), basic({ color: 0xf1efeb }), 0, 4.2, -8); ceil.rotation.x = Math.PI / 2;
    const white = basic({ color: 0xffffff });
    [-2, 2].forEach((sx) => add(new THREE.BoxGeometry(0.14, 0.03, 15.2), white, sx, 4.18, -8));
    const spotGeo = new THREE.CircleGeometry(0.07, 16);
    for (let z = -1.2; z > -15.5; z -= 1.6) [-4.6, 4.6].forEach((sx) => { const s = add(spotGeo, white, sx, 4.19, z); s.rotation.x = Math.PI / 2; });

    // Façade à la couleur de la marque, sol extérieur, enseigne (texte, jamais le logo)
    const facadeM = basic({ color: new THREE.Color(st.bg) });
    add(new THREE.BoxGeometry(4.4, 4.2, 0.3), facadeM, -3.8, 2.1, 0); add(new THREE.BoxGeometry(4.4, 4.2, 0.3), facadeM, 3.8, 2.1, 0);
    add(new THREE.BoxGeometry(3.2, 1.4, 0.3), facadeM, 0, 3.5, 0);
    const ext = add(new THREE.PlaneGeometry(16, 8), basic({ color: 0xebe6dd }), 0, -0.002, 4); ext.rotation.x = -Math.PI / 2;
    add(new THREE.PlaneGeometry(2.6, 0.5), basic({ map: U.wordTex(st, { glow: true }), transparent: true }), 0, 3.5, 0.16);

    // Mur du fond : panneau de la marque + étagères à sneakers éclairées
    add(new THREE.BoxGeometry(3.2, 2.4, 0.08), basic({ color: new THREE.Color(st.bg) }), 0, 2.15, -15.95);
    add(new THREE.PlaneGeometry(2.6, 0.5), basic({ map: U.wordTex(st), transparent: true }), 0, 2.4, -15.9);
    add(new THREE.PlaneGeometry(1.6, 0.15), basic({ map: U.labelTex("FRAUL · BOUTIQUE", st.fg), transparent: true, opacity: 0.6 }), 0, 1.65, -15.9);

    const decoMat = {}, deco = (type, c, a) => decoMat[type + c + a] || (decoMat[type + c + a] = new THREE.MeshLambertMaterial({ map: U.itemTexture(type, c, a, false, st), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
    const NK = [["#F1ECE0", "#2B2A2C"], ["#141416", "#F1ECE0"], ["#680209", "#F1ECE0"], ["#EAE0C8", "#420A0D"], ["#6B6766", "#141416"], ["#202833", "#EAE0C8"]];
    const shelfM = lam(0xf4f2ee), ledM = basic({ color: 0xfff6e6 }), shoeGeo = new THREE.PlaneGeometry(0.36, 0.2);
    [-1, 1].forEach((s) => {
      const cx = s * 3.75;
      [0.55, 0.95, 1.35, 1.75, 2.15].forEach((y, li) => {
        add(new THREE.BoxGeometry(3.5, 0.035, 0.34), shelfM, cx, y, -15.82);
        add(new THREE.BoxGeometry(3.5, 0.01, 0.02), ledM, cx, y - 0.025, -15.66);
        if (s < 0 && li === 2) return; // cette étagère porte le rayon sneakers interactif
        for (let k = 0; k < 4; k++) { const [c, a] = NK[(k + li * 2 + (s > 0 ? 3 : 0)) % NK.length]; const m = add(shoeGeo, deco("sneaker", c, a), cx - 1.25 + k * 0.83, y + 0.12, -15.78); if (k % 2) m.scale.x = -1; }
      });
    });

    // Portants muraux : vêtements de profil aux extrémités ; le rayon interactif au milieu
    const metalM = lam(0x1b1b1d), gData = [];
    const GC = [0xf1ece0, 0x141416, 0x680209, 0x6b6766, 0xeae0c8, 0x202833, 0x2b2a2c, 0x9a938a];
    function wallRail(side, z0, z1, long, zc) {
      const y = 1.78, rx = side * 5.62, len = z0 - z1;
      const rod = add(new THREE.CylinderGeometry(0.016, 0.016, len, 8), metalM, rx, y, (z0 + z1) / 2); rod.rotation.x = Math.PI / 2;
      [z0, z1].forEach((z) => add(new THREE.BoxGeometry(0.4, 0.03, 0.03), metalM, side * 5.8, y, z));
      let n = 0; for (let z = z0 - 0.15; z > z1 + 0.15; z -= 0.14, n++) {
        if (Math.abs(z - zc) < 2.3) continue;
        const h = (long ? 0.95 : 0.78) + ((n * 7) % 3) * 0.05; gData.push([side * 5.6, y - 0.05 - h / 2, z, 0.5, h, 0.045, GC[(n * 3 + (long ? 2 : 0)) % GC.length]]);
      }
    }
    wallRail(-1, -3.6, -9.2, false, -6.4); wallRail(-1, -9.8, -15.2, false, -12.4); wallRail(1, -8.6, -15.2, true, -11.9);

    // Mur à casquettes
    add(new THREE.BoxGeometry(0.04, 1.7, 4.6), metalM, 5.97, 1.6, -4.8);
    const crownG = new THREE.SphereGeometry(0.12, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), brimG = new THREE.CylinderGeometry(0.125, 0.125, 0.012, 20, 1, false, 0, Math.PI);
    [1.0, 2.08].forEach((y, r) => { for (let k = 0; k < 7; k++) {
      const m = lam(GC[(k + r * 3) % GC.length]), g = new THREE.Group();
      const cr = new THREE.Mesh(crownG, m); cr.scale.set(1, 0.85, 1); const br = new THREE.Mesh(brimG, m); br.position.x = 0.07;
      g.add(cr, br); g.position.set(5.82, y, -2.85 - k * 0.65); g.rotation.y = Math.PI; scene.add(g);
    } });

    // Vitrine à accessoires (îlot central)
    add(new THREE.BoxGeometry(2.4, 0.9, 1.6), lam(0xb9b4ad), 0, 0.45, -8.8);
    add(new THREE.BoxGeometry(2.44, 0.04, 1.64), lam(0x1b1b1d), 0, 0.9, -8.8);
    // Cloche en verre assez haute pour que les sacs soient bien dedans, même vus d'en haut
    const glassG = new THREE.BoxGeometry(2.3, 0.62, 1.5);
    add(glassG, new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false }), 0, 1.23, -8.8);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(glassG), new THREE.LineBasicMaterial({ color: 0x1b1b1d })); edges.position.set(0, 1.23, -8.8); scene.add(edges);

    // Mannequins habillés par le gabarit de la marque
    [[-2.6, -1.6, 0.45, 0], [2.6, -1.6, -0.45, 1], [-1.95, -14.6, 0.25, 1], [1.95, -14.6, -0.25, 0]].forEach(([x, z, r, v]) => { const m = U.mannequin(st, v); m.position.set(x, 0, z); m.rotation.y = r; scene.add(m); });

    // Signalétique
    [["T-SHIRTS", -6, -6.4], ["HOODIES", -6, -12.4], ["CHAPEAUX", 6, -4.8], ["PANTALONS", 6, -11.9]].forEach(([t, wx, z]) =>
      add(new THREE.PlaneGeometry(1.6, 0.3), basic({ map: U.labelTex(t), transparent: true }), wx - Math.sign(wx) * 0.02, 2.85, z, wx < 0 ? Math.PI / 2 : -Math.PI / 2));
    [-3.75, 3.75].forEach((x) => add(new THREE.PlaneGeometry(1.6, 0.3), basic({ map: U.labelTex("SNEAKERS"), transparent: true }), x, 2.62, -15.97));
    add(new THREE.PlaneGeometry(1.6, 0.3), basic({ map: U.labelTex("ACCESSOIRES"), transparent: true }), 0, 1.6, -9.62);

    const gm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), gData.length), dmy = new THREE.Object3D();
    gData.forEach(([x, y, z, sx, sy, sz, c], k) => { dmy.position.set(x, y, z); dmy.scale.set(sx, sy, sz); dmy.updateMatrix(); gm.setMatrixAt(k, dmy.matrix); gm.setColorAt(k, new THREE.Color(c)); });
    scene.add(gm);

    /* Rayons interactifs : les vrais articles pendent dans la scène, face et dos */
    // Article avec photo (vrai produit) : sa photo face / dos ; sinon le dessin à sa couleur.
    const prodMat = (type, c, a, back, img) => new THREE.MeshLambertMaterial({
      map: img ? U.photoTexture(type, img[back ? 1 : 0], () => kick()) : U.itemTexture(type, c, a, back, st), transparent: true, alphaTest: 0.04,
    });
    // Article regardé de près : sa photo passe en haute définition (une seule fois, à la demande, pour ménager la mémoire).
    function sharpen(m) {
      const { it, cat } = m.userData; if (!it || !it.img || m.userData.hi) return; m.userData.hi = true;
      m.children.forEach((mesh, i) => { const old = mesh.material.map; mesh.material.map = U.photoTexture(cat, it.img[i], () => kick(), 4); mesh.material.needsUpdate = true; old.dispose(); });
    }
    const cars = {};
    Object.entries(CAR).forEach(([cat, cfg]) => {
      const items = products(st.name, cat), geo = new THREE.PlaneGeometry(...cfg.size);
      const meshes = items.map((it) => {
        const g = new THREE.Group(), f = new THREE.Mesh(geo, prodMat(cat, it.c, it.a, false, it.img)), b = new THREE.Mesh(geo, prodMat(cat, it.c, it.a, true, it.img));
        b.rotation.y = Math.PI; g.add(f, b); g.userData.mats = [f.material, b.material]; g.userData.it = it; g.userData.cat = cat; scene.add(g); return g;
      });
      const real = items.findIndex((it) => it.img), start = real >= 0 ? real : Math.min(4, items.length - 1); // les vrais produits d'abord
      cars[cat] = { cat, items, meshes, cfg, f: start, target: start, last: null, swingT: -1e9, o: V(...cfg.o), d: V(...cfg.d), out: V(...cfg.out) };
    });

    /* Caméra et interactions ; on ne dessine que quand quelque chose bouge */
    const cam = { pos: V(0, 1.65, 2.8), look: V(0, 1.5, -16), walk: null };
    let raf = 0, active = null, closeAmt = 0, closeT = 0, yaw = 0, dragging = false;
    const UP = V(0, 1, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0);
    const kick = () => { if (!raf && !dead) raf = requestAnimationFrame(frame); };
    function layout(car, isActive, now) {
      const fi = Math.round(car.f), cfg = car.cfg;
      car.meshes.forEach((m, k) => {
        const d = k - car.f, ad = Math.abs(d);
        if (ad > 3.4) { m.visible = false; return; } m.visible = true;
        const w = isActive ? Math.max(0, 1 - ad) : 0, isF = isActive && k === fi;
        m.position.copy(car.o).addScaledVector(car.d, d * cfg.sp).addScaledVector(car.out, w * cfg.pull - Math.min(ad, 3) * 0.03).addScaledVector(UP, w * cfg.rise);
        let s = 1 + 0.12 * w;
        if (isF && closeAmt > 0) {
          sharpen(m);
          tmp2.subVectors(cam.look, cam.pos).normalize();
          tmp.copy(cam.pos).addScaledVector(tmp2, 1.3).add(V(0, 0.16, 0));
          m.position.lerp(tmp, closeAmt); s = lerp(s, cfg.close, closeAmt);
        }
        m.scale.setScalar(s);
        if (isF) m.lookAt(tmp.set(cam.pos.x, m.position.y, cam.pos.z)); else m.lookAt(tmp.copy(m.position).add(car.out));
        if (isF) {
          const age = (now - car.swingT) / 1000;
          if (age < 1.6) m.rotateZ(Math.sin(age * 7) * 0.08 * Math.exp(-age * 2.4));
          if (closeAmt > 0) m.rotateY(yaw * closeAmt);
        }
        const op = (1 - smooth(2.7, 3.4, ad)) * (isActive && !isF ? 1 - 0.85 * closeAmt : 1);
        m.userData.mats.forEach((mt) => (mt.opacity = op));
        m.renderOrder = isF ? 2 : 1;
      });
    }
    function frame(now) {
      raf = 0; if (dead || storeEl.hidden) return; let more = false; const w = cam.walk; // boutique préparée en coulisse : rien à dessiner
      if (w) {
        const u = clamp((now - w.t0) / w.dur, 0, 1), e = ease(u);
        const p = w.curve.getPointAt(e), tan = w.curve.getTangentAt(Math.min(e, 0.999));
        const ahead = V(p.x + tan.x * 4, 1.5, p.z + tan.z * 4);
        const look = w.fromLook.clone().lerp(ahead, smooth(0, 0.3, u)).lerp(w.toLook, smooth(0.55, 1, u));
        const bob = Math.abs(Math.sin(e * w.len / 0.72 * Math.PI)) * 0.03 * Math.sin(Math.PI * u);
        cam.pos.set(p.x, lerp(1.65, 1.6, smooth(0.7, 1, u)) + bob, p.z); cam.look.copy(look);
        if (u < 1) more = true; else { cam.walk = null; if (w.cb) w.cb(); }
      }
      if (active) {
        const c = cars[active];
        if (!dragging) { const df = c.target - c.f; if (Math.abs(df) > 0.0005) { c.f += df * (RM ? 1 : 0.16); more = true; } else c.f = c.target; }
        const fi = Math.round(c.f);
        if (fi !== c.last) { c.last = fi; c.swingT = now; yaw = 0; if (api.onFocus) api.onFocus(active, fi); }
        if (now - c.swingT < 1600) more = true;
      }
      if (Math.abs(closeT - closeAmt) > 0.002) { closeAmt += (closeT - closeAmt) * (RM ? 1 : 0.14); more = true; } else closeAmt = closeT;
      if (closeAmt > 0 && !dragging && !RM) { yaw += 0.006; more = true; }
      Object.values(cars).forEach((c) => layout(c, c.cat === active, now));
      camera.position.copy(cam.pos); camera.lookAt(cam.look);
      renderer.render(scene, camera);
      if (more) kick();
    }
    function place(zone) { const Z = ZONES[zone]; cam.walk = null; cam.pos.set(Z.p[0], 1.6, Z.p[1]); cam.look.set(...Z.look); kick(); }
    function walk(zone, cb) {
      const Z = ZONES[zone], a = [cam.pos.x, cam.pos.z];
      if (RM || dist2(a, Z.p) < 0.05) { place(zone); cb(); return; }
      const curve = new THREE.CatmullRomCurve3(route(a, Z.p).map(([x, z]) => V(x, 1.65, z)), false, "centripetal"), len = curve.getLength();
      // Trajets vers un rayon très courts (0,5 s au plus, Rhamone) : on veut voir les produits vite.
      cam.walk = { curve, len, t0: performance.now(), dur: clamp(len / 12, 0.25, 0.5) * 1000, fromLook: cam.look.clone(), toLook: V(...Z.look), cb };
      storeEl.dataset.walkMs = String(Math.round(cam.walk.dur)); // lu par le test téléphone (0,5 s au plus)
      kick();
    }
    function setClose(v) {
      if (!v !== !closeT && api.onZoom) api.onZoom(!!v);
      closeT = v; yaw = 0;
      $("#iClose").textContent = v ? "Ranger" : "Tourner";
      kick();
    }

    // Glisser : faire défiler le rayon, ou tourner l'article en gros plan. Toucher : avancer un article / fiche en grand.
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => { if (!active) return; drag = { x: e.clientX, f0: cars[active].f, y0: yaw, moved: 0 }; try { canvas.setPointerCapture(e.pointerId); } catch { /* ignoré */ } }, sig);
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return; const dx = e.clientX - drag.x; drag.moved = Math.max(drag.moved, Math.abs(dx));
      if (drag.moved > 6) {
        dragging = true;
        if (closeT) { yaw = drag.y0 + dx / 90; }
        else { const c = cars[active]; c.f = clamp(drag.f0 - dx / 95, -0.4, c.items.length - 0.6); c.target = c.f; }
        kick();
      }
    }, sig);
    const endDrag = (e) => {
      if (!drag) return; const c = cars[active];
      if (drag.moved <= 6 && e.type === "pointerup") {
        const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(c.meshes.filter((m) => m.visible), true)[0];
        if (hit) { const k = c.meshes.findIndex((m) => m === hit.object.parent); if (k === Math.round(c.f)) { if (closeT) setClose(0); else openFiche(c.items[k]); } else if (!closeT) { c.target = k; } }
      } else if (!closeT) { c.target = clamp(Math.round(c.f), 0, c.items.length - 1); gesture("swipe"); }
      drag = null; dragging = false; kick();
    };
    canvas.addEventListener("pointerup", endDrag, sig);
    canvas.addEventListener("pointercancel", endDrag, sig);

    function resize() {
      const w = storeEl.clientWidth || innerWidth, h = storeEl.clientHeight || innerHeight, a = w / h;
      renderer.setSize(w, h, false); camera.aspect = a; camera.fov = a < 1 ? 72 : 56; camera.updateProjectionMatrix(); kick();
    }
    window.addEventListener("resize", () => { if (!storeEl.hidden) resize(); }, sig);

    const api = {
      brand: st.name, place, walk, resize,
      /** Prépare l'affichage (shaders) en coulisse, pour que la première image soit immédiate à l'entrée. */
      warm() { try { place("hub"); renderer.compile(scene, camera); } catch { /* ignoré */ } },
      setActive(cat) { if (closeT && api.onZoom) api.onZoom(false); active = cat; if (cat) cars[cat].last = null; closeT = closeAmt = 0; yaw = 0; $("#iClose").textContent = "Tourner"; kick(); },
      focus: (cat) => Math.round(cars[cat].target),
      count: (cat) => cars[cat].items.length,
      item: (cat, k) => cars[cat].items[k],
      step(d) { if (!active) return; if (closeT) setClose(0); const c = cars[active]; c.target = clamp(Math.round(c.target) + d, 0, c.items.length - 1); kick(); },
      toggleClose() { if (active) setClose(closeT ? 0 : 1); },
      /** Amène l'article `slug` devant soi s'il est dans le rayon ouvert (la fiche en grand change d'article). */
      show(slug) { if (!active) return; const c = cars[active], k = c.items.findIndex((x) => x.slug === slug); if (k >= 0) { c.target = k; kick(); } },
      unzoom() { if (closeT) setClose(0); },
      recolor(cat, k, c) {
        const car = cars[cat], it = car.items[k]; it.c = c; it.a = accentFor(c);
        const [f, b] = car.meshes[k].children; [f, b].forEach((m, i) => { m.material.map.dispose(); m.material.dispose(); m.material = prodMat(cat, it.c, it.a, i === 1, it.img); });
        car.meshes[k].userData.mats = [f.material, b.material]; kick();
      },
      onFocus: (cat, k) => { if (cat === sCat) showInfo(cat, k); },
      // Zoom ouvert = une couche (retour = ranger l'article) ; rangé autrement = on retire l'entrée.
      onZoom: (v) => { if (v) openLayer("zoom", () => STORE && STORE.unzoom()); else dropLayer("zoom"); },
      dispose() { ac.abort(); cancelAnimationFrame(raf); disposeScene(scene); },
    };
    return api;
  }

  /* ===== Démarrage ===== */
  sync();
  if (o.startStore) openStore(o.startStore, { fromWalk: false });
  else openWalk(typeof o.startShop === "number" ? o.startShop : resumeShop()); // revenir : pas besoin de refaire le tour

  return {
    closeFiche: () => closeLayer("fiche"),
    closeConcierge: () => closeLayer("concierge"),
    showItem: (slug) => { if (STORE) STORE.show(slug); },
    refocus: () => trapUpdate(),
    destroy() {
      dead = true;
      life.abort();
      if (MALL) MALL.dispose();
      if (STORE) STORE.dispose();
      if (SR) SR.renderer.dispose();
    },
  };
}

