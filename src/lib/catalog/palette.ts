// Teintes des articles (dessins provisoires et pastilles de couleur). Sans dépendance :
// lue aussi par scripts/import-catalogue.mjs pour ramener la couleur d'une photo à la teinte la plus proche.
export const COLORS = ["#F1ECE0", "#141416", "#680209", "#420A0D", "#6B6766", "#EAE0C8", "#202833", "#9A938A", "#2B2A2C", "#C9BFAA"];

/** Nom de chaque teinte, affiché au client et copié sur la commande. */
export const COLOR_NAMES: Record<string, string> = {
  "#F1ECE0": "Écru", "#141416": "Noir", "#680209": "Bordeaux", "#420A0D": "Vin", "#6B6766": "Gris anthracite",
  "#EAE0C8": "Perle", "#202833": "Marine", "#9A938A": "Pierre", "#2B2A2C": "Charbon", "#C9BFAA": "Sable",
};

export const DARK = ["#141416", "#202833", "#2B2A2C", "#420A0D", "#680209", "#6B6766", "#0A0A0C"];
export const accentFor = (c: string) => (DARK.includes(c) ? "#EAE0C8" : "#420A0D");
