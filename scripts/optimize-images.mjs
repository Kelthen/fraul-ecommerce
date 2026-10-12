// Optimise les photos du client avant de les ajouter au site (leçons L-10, L-15, L-16).
// Usage : node scripts/optimize-images.mjs <dossier-source> [dossier-cible] [--max 2000]
// Par défaut, la cible est public/images/library. Nécessite `sharp` (npm i -D sharp).
import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const maxIdx = args.indexOf("--max");
const maxSide = maxIdx >= 0 ? Number(args.splice(maxIdx, 2)[1]) : 2000;
const [src, dest = "public/images/library"] = args;

if (!src) {
  console.error("Usage : node scripts/optimize-images.mjs <dossier-source> [dossier-cible] [--max 2000]");
  process.exit(1);
}

const slug = (name) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

await mkdir(dest, { recursive: true });
const files = (await readdir(src)).filter((f) => /\.(jpe?g|png|webp|heic|tiff?)$/i.test(f));
if (files.length === 0) {
  console.error(`Aucune image trouvée dans ${src}`);
  process.exit(1);
}

let before = 0;
let after = 0;
for (const file of files) {
  const input = path.join(src, file);
  const output = path.join(dest, `${slug(path.parse(file).name)}.jpg`);
  const { width, height } = await sharp(input)
    .rotate()
    .resize(maxSide, maxSide, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(output);
  const inSize = (await stat(input)).size;
  const outSize = (await stat(output)).size;
  before += inSize;
  after += outSize;
  const ratio = (width / height).toFixed(2);
  console.log(`${file} → ${output} · ${width}×${height} (ratio ${ratio}) · ${Math.round(inSize / 1024)} Ko → ${Math.round(outSize / 1024)} Ko`);
}
console.log(`\n${files.length} photos · ${Math.round(before / 1024)} Ko → ${Math.round(after / 1024)} Ko`);
console.log("Ajoute chaque photo au registre lib/images.ts, avec un point focal si les visages ne sont pas centrés.");
