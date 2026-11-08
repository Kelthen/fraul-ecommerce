// Régénère src/walk/cutouts.ts d'après les photos détourées de public/images/cutouts/ (une par photo produit).
// Usage : node scripts/cutouts-manifest.mjs
import { readdirSync, writeFileSync } from "node:fs";
const names = readdirSync("public/images/cutouts").filter((f) => f.endsWith(".webp")).map((f) => f.slice(0, -5)).sort();
writeFileSync(
  "src/walk/cutouts.ts",
  `// Généré par scripts/cutouts-manifest.mjs : ne pas modifier à la main.
// Photos produit détourées (fond transparent) pour le portant du Walk, rangées dans public/images/cutouts/.
// Détourage : rembg, modèle birefnet-general-lite (Rhamone, 8 nov. 2026 : « pas de cadres, comme en 3D »).

const NAMES = new Set(${JSON.stringify(names)});

/** Version détourée d'une photo produit si elle existe, sinon la photo elle-même. */
export function cutoutOf(src: string): string {
  const name = src.split("/").pop()?.replace(/\\.(jpe?g|png|webp)$/i, "") ?? "";
  return NAMES.has(name) ? \`/images/cutouts/\${name}.webp\` : src;
}
`,
);
console.log(names.length, "photos détourées");
