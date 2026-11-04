import type { MetadataRoute } from "next";

// Les icônes s'ajouteront ici avec le logo TakeUrClothes (STATUS.md, « Avant le lancement »).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TakeUrClothes",
    short_name: "TakeUrClothes",
    description: "Le mall streetwear et luxe : une boutique par marque.",
    start_url: "/",
    display: "standalone",
    lang: "fr",
    background_color: "#FFFEF7",
    theme_color: "#680209",
  };
}
