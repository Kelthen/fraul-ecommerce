// Prépare les décors exportés de Blender pour le Walk : node scripts/prep-decor.mjs
// Entrée : assets-src/models/fraul_caisse.glb (export Blender de Rhamone, 25 oct. 2026).
// Sortie : public/models/caisse.glb, sans Draco (pas de décodeur à charger), géométrie quantifiée.
// Les repères (« Repere_… ») et les coordonnées de texture sont gardés. À relancer après chaque nouvel export ;
// ne jamais retoucher les fichiers de sortie à la main.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize, weld } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";

const FILES = { caisse: "fraul_caisse" };
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "draco3d.decoder": await draco3d.createDecoderModule() });

for (const [out, src] of Object.entries(FILES)) {
  const doc = await io.read(`assets-src/models/${src}.glb`);
  const root = doc.getRoot();
  // Repères vides gardés : prune ne retire que ce qui ne sert à rien (keepLeaves garde les nœuds sans mesh).
  await doc.transform(prune({ keepAttributes: true, keepLeaves: true }), dedup(), weld(), quantize());
  root.listExtensionsUsed().filter((e) => e.extensionName === "KHR_draco_mesh_compression").forEach((e) => e.dispose());
  await io.write(`public/models/${out}.glb`, doc);
  let tri = 0;
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) tri += (p.getIndices()?.getCount() ?? p.getAttribute("POSITION").getCount()) / 3;
  console.log(`public/models/${out}.glb : ${tri} triangles, ${root.listNodes().filter((n) => n.getName().startsWith("Repere")).length} repères`);
}
