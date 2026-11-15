// Allège un mannequin exporté par assets-src/blender/mannequins-ivoire.py : node scripts/leger-mannequin.mjs entree.glb sortie.glb
import { createRequire } from "module"; const req = createRequire(process.cwd() + "/package.json");
const { NodeIO } = req("@gltf-transform/core"); const { ALL_EXTENSIONS } = req("@gltf-transform/extensions"); const { dedup, prune, quantize, weld } = req("@gltf-transform/functions");
const [src, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
// Coordonnées de texture : seulement sur la poitrine (Tee_Marque_Texte, où le Walk peint le nom de la boutique).
for (const mesh of doc.getRoot().listMeshes())
  for (const prim of mesh.listPrimitives())
    if (prim.getMaterial()?.getName() !== "Tee_Marque_Texte") prim.setAttribute("TEXCOORD_0", null);
await doc.transform(weld(), dedup(), prune({ keepAttributes: true }), quantize());
await io.write(out, doc);
console.log(out, "ok");
