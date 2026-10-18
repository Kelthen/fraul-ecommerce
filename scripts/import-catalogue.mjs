// Importe un dossier de photos classées (catalogue.json + images/) dans le site.
// Usage : node scripts/import-catalogue.mjs <dossier>
//
// 1. Copie chaque photo sous un nom unique (<marque>-<produit>-<vue>) puis la passe dans
//    scripts/optimize-images.mjs (une seule copie dans public/images/library, leçons L-10, L-16).
// 2. Écrit le registre des photos (src/lib/images.ts) et les produits réels
//    (src/lib/catalog/supplier.ts). Ces deux fichiers sont générés : on relance le script, on ne les édite pas.
//
// Un « ensemble » (vues veste-… et pantalon-…) devient deux produits ; la vue « ensemble » sert de
// photo de détail aux deux. Les coûts sont FICTIFS (démo) tant que le fournisseur n'a pas donné ses prix.
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { COLORS } from "../src/lib/catalog/palette.ts";

const src = process.argv[2];
if (!src) {
  console.error("Usage : node scripts/import-catalogue.mjs <dossier contenant catalogue.json>");
  process.exit(1);
}
const LIB = "public/images/library";

/** Catégorie du site d'après la colonne « catégorie du site » du classement. */
function categoryOf(label) {
  const l = label.toLowerCase();
  if (l.includes("short")) return "shorts";
  if (l.includes("manteau") || l.includes("veste")) return "jacket";
  if (l.startsWith("pantalon")) return "pants";
  if (l.startsWith("hoodie") || l.includes("sweat")) return "hoodie";
  if (l.startsWith("t-shirt") || l.includes("polo")) return "tee";
  throw new Error(`Catégorie inconnue : « ${label} » (ajoute-la dans categoryOf)`);
}

/** Teinte de la palette la plus proche du centre de la photo (le fond, sur les bords, est ignoré). */
async function garmentColor(file) {
  const img = sharp(file);
  const { width, height } = await img.metadata();
  const box = { left: Math.round(width * 0.35), top: Math.round(height * 0.35), width: Math.round(width * 0.3), height: Math.round(height * 0.3) };
  const { data } = await img.extract(box).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const d = (h) => rgb(h).reduce((a, v, i) => a + (v - data[i]) ** 2, 0);
  return COLORS.reduce((best, h) => (d(h) < d(best) ? h : best));
}

const PART_NAME = { veste: "veste", pantalon: "pantalon" };
const catalogue = JSON.parse(await readFile(path.join(src, "catalogue.json"), "utf8"));

// 1. Copie sous des noms uniques, puis optimisation par le script du projet.
const stage = await mkdtemp(path.join(tmpdir(), "fraul-photos-"));
for (const p of catalogue)
  for (const ph of p.photos) await copyFile(path.join(src, ph.file), path.join(stage, `${p.brand_slug}-${p.slug}-${ph.view}.jpg`));
execFileSync("node", ["scripts/optimize-images.mjs", stage, LIB, "--max", "1600"], { stdio: "inherit" });
await rm(stage, { recursive: true });
await mkdir(LIB, { recursive: true });

// 2. Registre des photos et produits.
const images = {};
const products = [];
for (const p of catalogue) {
  const reg = async (ph) => {
    const id = `${p.brand_slug}-${p.slug}-${ph.view}`;
    const file = path.join(LIB, `${id}.jpg`);
    const { width, height } = await sharp(file).metadata();
    images[id] = { src: `/images/library/${id}.jpg`, w: width, h: height, quality: ph.quality };
    return id;
  };
  const ensemble = p.photos.find((ph) => ph.view === "ensemble");
  const parts = [...new Set(p.photos.map((ph) => ph.view.split("-")[0]).filter((k) => k in PART_NAME))];
  const groups = parts.length
    ? parts.map((k) => ({ suffix: k, photos: p.photos.filter((ph) => ph.view.startsWith(`${k}-`)) }))
    : [{ suffix: "", photos: p.photos.filter((ph) => ph !== ensemble) }];
  const base = p.product.replace(new RegExp(`^${p.brand}\\s*(—\\s*)?`), "").trim();
  for (const g of groups) {
    const front = g.photos.find((ph) => ph.view.endsWith("face"));
    const back = g.photos.find((ph) => ph.view.endsWith("dos"));
    if (!front) continue; // une pièce sans photo de face garde son dessin : on ne l'importe pas
    const hex = await garmentColor(path.join(src, front.file));
    products.push({
      slug: [p.brand_slug, p.slug, g.suffix].filter(Boolean).join("-"),
      brand: p.brand,
      category: categoryOf(front.site_category),
      name: g.suffix ? `${base} (${PART_NAME[g.suffix]})` : base,
      color: hex,
      image: { front: await reg(front), back: back ? await reg(back) : undefined, details: ensemble ? [await reg(ensemble)] : [] },
      note: p.note || undefined,
    });
  }
}

const header = "// FICHIER GÉNÉRÉ par scripts/import-catalogue.mjs — ne pas modifier à la main, relancer le script.\n";
await writeFile(
  "src/lib/images.ts",
  `${header}// Registre unique des photos (leçon L-16) : une photo = un fichier dans public/images/library.\n\n` +
    `export type LibraryImage = { src: string; w: number; h: number; quality: string };\n\n` +
    `export const IMAGES = ${JSON.stringify(images, null, 2)} as const satisfies Record<string, LibraryImage>;\n\n` +
    `export type ImageId = keyof typeof IMAGES;\n`,
);
await writeFile(
  "src/lib/catalog/supplier.ts",
  `${header}// Produits réels classés par Rhamone à partir des captures du fournisseur (test de rendu, pas de mise en ligne).\n` +
    `// Coûts FICTIFS (démo) : ils viennent de la catégorie, en attendant les prix du fournisseur.\n` +
    `import type { CategoryId } from "./types";\nimport type { ImageId } from "../images";\n\n` +
    `export type SupplierProduct = {\n  slug: string;\n  brand: string;\n  category: CategoryId;\n  name: string;\n  /** Couleur dominante de la photo de face (sert au dessin de repli et aux pastilles). */\n  color: string;\n` +
    `  image: { front: ImageId; back?: ImageId; details: ImageId[] };\n  note?: string;\n};\n\n` +
    `export const SUPPLIER_PRODUCTS: SupplierProduct[] = ${JSON.stringify(products, null, 2)};\n`,
);
console.log(`\n${products.length} produits, ${Object.keys(images).length} photos → src/lib/catalog/supplier.ts, src/lib/images.ts`);
