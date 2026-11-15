// Allège un mannequin habillé : sans la photo interne (chargée à part par le Walk), coordonnées de texture gardées.
// node scripts/leger-mannequin-look.mjs <mannequin habillé.glb> public/models/mannequin-look-<n>.glb
import { createRequire } from "module"; const req = createRequire(process.cwd() + "/package.json");
const { NodeIO } = req("@gltf-transform/core"); const { ALL_EXTENSIONS } = req("@gltf-transform/extensions"); const { dedup, prune, quantize, weld } = req("@gltf-transform/functions");
const [src, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
for (const m of doc.getRoot().listMaterials()) if (m.getName().startsWith("Look_")) m.setBaseColorTexture(null);
for (const t of doc.getRoot().listTextures()) t.dispose();
await doc.transform(weld(), dedup(), prune({ keepAttributes: true }), quantize());
await io.write(out, doc);
for (const me of doc.getRoot().listMeshes()) for (const p of me.listPrimitives()) console.log(out, p.listSemantics().join(","), p.getMaterial()?.getName());
