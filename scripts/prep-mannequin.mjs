// Prépare le mannequin exporté de Blender pour le Walk : node scripts/prep-mannequin.mjs
// Entrée : assets-src/models/fraul_mannequin.glb (export Blender de Rhamone, 25 oct. 2026).
// Sortie : public/models/mannequin.glb, léger pour téléphone (≈ 22 000 triangles au lieu de 166 000, sans Draco).
// À relancer après chaque nouvel export ; ne jamais retoucher le fichier de sortie à la main.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize, simplifyPrimitive, weld } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { MeshoptSimplifier } from "meshoptimizer";

const [src = "assets-src/models/fraul_mannequin.glb", out = "public/models/mannequin.glb"] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "draco3d.decoder": await draco3d.createDecoderModule() });
const doc = await io.read(src);
const root = doc.getRoot();

// Le tee sur cintre de l'export n'est pas utilisé : dans un rayon, les vêtements sont de côté (L-53).
for (const n of root.listNodes()) if (["Tee_Suspendu", "Tee_Suspendu_Poitrine_Marque", "Cintre_Crochet", "Cintre_Ecrou", "Cintre_Epaules"].includes(n.getName())) n.dispose();

// Si la couleur du jean s'est perdue à l'export (réglage Blender par nœuds : il sort blanc), on la remet (noir délavé).
for (const m of root.listMaterials()) if (m.getName() === "Jean_Noir_Delave" && m.getBaseColorFactor()[0] > 0.5) m.setBaseColorFactor([0.03, 0.032, 0.04, 1]);

// Tee un peu plus long et plus ample en bas : il couvre la taille du jean (plus de bande blanche du corps).
const tee = root.listNodes().find((n) => n.getName() === "Tee_Mannequin")?.getMesh();
for (const p of tee ? tee.listPrimitives() : []) {
  const a = p.getAttribute("POSITION"), v = [0, 0, 0];
  for (let i = 0; i < a.getCount(); i++) {
    a.getElement(i, v);
    const t = Math.max(0, (1.12 - v[1]) / (1.12 - 0.985));
    if (t > 0) { v[1] -= 0.045 * t; v[0] *= 1 + 0.03 * t; v[2] = 0.01 + (v[2] - 0.01) * (1 + 0.03 * t); a.setElement(i, v); }
  }
}

await doc.transform(prune({ keepAttributes: true }), dedup(), weld()); // garder les coordonnées de texture du panneau de poitrine

// Simplification pièce par pièce (part des triangles gardés).
await MeshoptSimplifier.ready;
const KEEP = { Mannequin_Corps: 0.17, Pantalon: 0.12, Tee_Mannequin: 0.25, Basket_Dessus_1: 0.3, "Basket_Dessus_-1": 0.3 };
for (const n of root.listNodes()) {
  const r = KEEP[n.getName()];
  if (r) for (const p of n.getMesh().listPrimitives()) simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: r, error: 0.002 });
}

await doc.transform(prune({ keepAttributes: true }), quantize());
// Pas de Draco sur le site (son décodeur pèse plus que le gain) : géométrie quantifiée à la place.
root.listExtensionsUsed().filter((e) => e.extensionName === "KHR_draco_mesh_compression").forEach((e) => e.dispose());
await io.write(out, doc);

let tri = 0;
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) tri += p.getIndices().getCount() / 3;
console.log(`${out} : ${tri} triangles`);
