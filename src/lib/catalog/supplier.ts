// FICHIER GÉNÉRÉ par scripts/import-catalogue.mjs — ne pas modifier à la main, relancer le script.
// Produits réels classés par Rhamone à partir des captures du fournisseur (test de rendu, pas de mise en ligne).
// Coûts FICTIFS (démo) : ils viennent de la catégorie, en attendant les prix du fournisseur.
import type { CategoryId } from "./types";
import type { ImageId } from "../images";

export type SupplierProduct = {
  slug: string;
  brand: string;
  category: CategoryId;
  name: string;
  /** Couleur dominante de la photo de face (sert au dessin de repli et aux pastilles). */
  color: string;
  image: { front: ImageId; back?: ImageId; details: ImageId[] };
  note?: string;
};

export const SUPPLIER_PRODUCTS: SupplierProduct[] = [
  {
    "slug": "nike-techfleece-noir-gris-veste",
    "brand": "Nike",
    "category": "hoodie",
    "name": "Tech Fleece 3.0 — Noir / Gris chiné (veste)",
    "color": "#9A938A",
    "image": {
      "front": "nike-techfleece-noir-gris-veste-face",
      "back": "nike-techfleece-noir-gris-veste-dos",
      "details": [
        "nike-techfleece-noir-gris-ensemble"
      ]
    }
  },
  {
    "slug": "nike-techfleece-noir-gris-pantalon",
    "brand": "Nike",
    "category": "pants",
    "name": "Tech Fleece 3.0 — Noir / Gris chiné (pantalon)",
    "color": "#2B2A2C",
    "image": {
      "front": "nike-techfleece-noir-gris-pantalon-face",
      "back": "nike-techfleece-noir-gris-pantalon-dos",
      "details": [
        "nike-techfleece-noir-gris-ensemble"
      ]
    }
  },
  {
    "slug": "nike-techfleece-anthracite-blanc-veste",
    "brand": "Nike",
    "category": "hoodie",
    "name": "Tech Fleece 3.0 — Anthracite / Blanc (veste)",
    "color": "#9A938A",
    "image": {
      "front": "nike-techfleece-anthracite-blanc-veste-face",
      "back": "nike-techfleece-anthracite-blanc-veste-dos",
      "details": [
        "nike-techfleece-anthracite-blanc-ensemble"
      ]
    }
  },
  {
    "slug": "nike-techfleece-anthracite-blanc-pantalon",
    "brand": "Nike",
    "category": "pants",
    "name": "Tech Fleece 3.0 — Anthracite / Blanc (pantalon)",
    "color": "#6B6766",
    "image": {
      "front": "nike-techfleece-anthracite-blanc-pantalon-face",
      "back": "nike-techfleece-anthracite-blanc-pantalon-dos",
      "details": [
        "nike-techfleece-anthracite-blanc-ensemble"
      ]
    }
  },
  {
    "slug": "nike-techfleece-marron-veste",
    "brand": "Nike",
    "category": "hoodie",
    "name": "Tech Fleece 3.0 — Marron foncé (veste)",
    "color": "#2B2A2C",
    "image": {
      "front": "nike-techfleece-marron-veste-face",
      "details": []
    },
    "note": "Il manque des vues : l'album du fournisseur en compte 5, on en a 2 (ensemble et dos absents)."
  },
  {
    "slug": "nike-techfleece-marron-pantalon",
    "brand": "Nike",
    "category": "pants",
    "name": "Tech Fleece 3.0 — Marron foncé (pantalon)",
    "color": "#2B2A2C",
    "image": {
      "front": "nike-techfleece-marron-pantalon-face",
      "details": []
    },
    "note": "Il manque des vues : l'album du fournisseur en compte 5, on en a 2 (ensemble et dos absents)."
  },
  {
    "slug": "nike-polo-inter-blanc-raye",
    "brand": "Nike",
    "category": "tee",
    "name": "Polo Inter (blanc rayé)",
    "color": "#EAE0C8",
    "image": {
      "front": "nike-polo-inter-blanc-raye-face",
      "back": "nike-polo-inter-blanc-raye-dos",
      "details": []
    },
    "note": "Polo avec l'écusson d'un club de foot. L'album en compte 6 vues, on en a 2."
  },
  {
    "slug": "trapstar-hoodie-noir",
    "brand": "Trapstar",
    "category": "hoodie",
    "name": "Hoodie noir uni",
    "color": "#141416",
    "image": {
      "front": "trapstar-hoodie-noir-face",
      "details": []
    },
    "note": "Photo très petite : demander l'original."
  },
  {
    "slug": "trapstar-hoodie-logo-rouge",
    "brand": "Trapstar",
    "category": "hoodie",
    "name": "Hoodie noir, logo rouge / blanc",
    "color": "#141416",
    "image": {
      "front": "trapstar-hoodie-logo-rouge-face",
      "details": []
    },
    "note": "Photo très petite : demander l'original."
  },
  {
    "slug": "trapstar-hoodie-cough-syrup",
    "brand": "Trapstar",
    "category": "hoodie",
    "name": "Hoodie « Cough Syrup »",
    "color": "#2B2A2C",
    "image": {
      "front": "trapstar-hoodie-cough-syrup-face",
      "details": []
    }
  },
  {
    "slug": "trapstar-tshirt-its-a-secret-noir",
    "brand": "Trapstar",
    "category": "tee",
    "name": "T-shirt noir « It's a Secret »",
    "color": "#202833",
    "image": {
      "front": "trapstar-tshirt-its-a-secret-noir-face",
      "details": []
    }
  },
  {
    "slug": "trapstar-polo-noir-or",
    "brand": "Trapstar",
    "category": "tee",
    "name": "Polo noir / or",
    "color": "#141416",
    "image": {
      "front": "trapstar-polo-noir-or-face",
      "details": []
    },
    "note": "Photo petite : demander l'original."
  },
  {
    "slug": "trapstar-short-noir-arche",
    "brand": "Trapstar",
    "category": "shorts",
    "name": "Short noir, logo arche blanc",
    "color": "#2B2A2C",
    "image": {
      "front": "trapstar-short-noir-arche-face",
      "details": []
    }
  },
  {
    "slug": "trapstar-short-gris-arche",
    "brand": "Trapstar",
    "category": "shorts",
    "name": "Short gris chiné, logo arche noir / turquoise",
    "color": "#C9BFAA",
    "image": {
      "front": "trapstar-short-gris-arche-face",
      "details": []
    },
    "note": "Photo petite : demander l'original."
  },
  {
    "slug": "trapstar-doudoune-longue",
    "brand": "Trapstar",
    "category": "jacket",
    "name": "Doudoune longue (noir / marine)",
    "color": "#202833",
    "image": {
      "front": "trapstar-doudoune-longue-face",
      "back": "trapstar-doudoune-longue-dos",
      "details": []
    },
    "note": "Photos très petites : demander les originaux."
  },
  {
    "slug": "travis-scott-hoodie-etoile-delave",
    "brand": "Travis Scott",
    "category": "hoodie",
    "name": "Hoodie noir délavé, étoile rose",
    "color": "#2B2A2C",
    "image": {
      "front": "travis-scott-hoodie-etoile-delave-face",
      "back": "travis-scott-hoodie-etoile-delave-dos",
      "details": []
    }
  },
  {
    "slug": "travis-scott-short-delave-flammes",
    "brand": "Travis Scott",
    "category": "shorts",
    "name": "Short délavé, impression flammes",
    "color": "#2B2A2C",
    "image": {
      "front": "travis-scott-short-delave-flammes-face",
      "back": "travis-scott-short-delave-flammes-dos",
      "details": []
    },
    "note": "La vue de dos est probable (même album, mêmes poches) : à confirmer."
  },
  {
    "slug": "saint-michael-sweat-universal-purity",
    "brand": "Saint Michael",
    "category": "hoodie",
    "name": "Sweat col rond délavé « Universal Purity »",
    "color": "#6B6766",
    "image": {
      "front": "saint-michael-sweat-universal-purity-face",
      "back": "saint-michael-sweat-universal-purity-dos",
      "details": []
    },
    "note": "Une mention © apparaît en bas de l'image : à recadrer avant mise en ligne."
  },
  {
    "slug": "erd-hoodie-zip-patchs",
    "brand": "ERD",
    "category": "hoodie",
    "name": "Hoodie zippé délavé à patchs",
    "color": "#6B6766",
    "image": {
      "front": "erd-hoodie-zip-patchs-face",
      "back": "erd-hoodie-zip-patchs-dos",
      "details": []
    }
  },
  {
    "slug": "polo-ralph-lauren-sweat-marine-logo-blanc-veste",
    "brand": "Polo Ralph Lauren",
    "category": "hoodie",
    "name": "Sweat zippé + jogging marine (logo blanc) (veste)",
    "color": "#202833",
    "image": {
      "front": "polo-ralph-lauren-sweat-marine-logo-blanc-veste-face",
      "details": []
    },
    "note": "Photos petites : demander les originaux."
  },
  {
    "slug": "polo-ralph-lauren-sweat-marine-logo-blanc-pantalon",
    "brand": "Polo Ralph Lauren",
    "category": "pants",
    "name": "Sweat zippé + jogging marine (logo blanc) (pantalon)",
    "color": "#9A938A",
    "image": {
      "front": "polo-ralph-lauren-sweat-marine-logo-blanc-pantalon-face",
      "details": []
    },
    "note": "Photos petites : demander les originaux."
  },
  {
    "slug": "polo-ralph-lauren-sweat-marine-logo-rose-veste",
    "brand": "Polo Ralph Lauren",
    "category": "hoodie",
    "name": "Sweat zippé + jogging marine (logo rose) (veste)",
    "color": "#202833",
    "image": {
      "front": "polo-ralph-lauren-sweat-marine-logo-rose-veste-face",
      "details": []
    },
    "note": "Photos petites : demander les originaux."
  },
  {
    "slug": "polo-ralph-lauren-sweat-marine-logo-rose-pantalon",
    "brand": "Polo Ralph Lauren",
    "category": "pants",
    "name": "Sweat zippé + jogging marine (logo rose) (pantalon)",
    "color": "#6B6766",
    "image": {
      "front": "polo-ralph-lauren-sweat-marine-logo-rose-pantalon-face",
      "details": []
    },
    "note": "Photos petites : demander les originaux."
  }
];
