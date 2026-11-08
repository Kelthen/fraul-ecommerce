// Généré par scripts/cutouts-manifest.mjs : ne pas modifier à la main.
// Photos produit détourées (fond transparent) pour le portant du Walk, rangées dans public/images/cutouts/.
// Détourage : rembg, modèle birefnet-general-lite (Rhamone, 8 nov. 2026 : « pas de cadres, comme en 3D »).

const NAMES = new Set([]);

/** Version détourée d'une photo produit si elle existe, sinon la photo elle-même. */
export function cutoutOf(src: string): string {
  const name = src.split("/").pop()?.replace(/\.(jpe?g|png|webp)$/i, "") ?? "";
  return NAMES.has(name) ? `/images/cutouts/${name}.webp` : src;
}
