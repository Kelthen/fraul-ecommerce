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
  },
  {
    "slug": "team-wang-veste-col-montant-noire",
    "brand": "Team Wang",
    "category": "jacket",
    "name": "Veste noire col montant, bords effilochés",
    "color": "#141416",
    "image": {
      "front": "team-wang-veste-col-montant-noire-face",
      "details": [
        "team-wang-veste-col-montant-noire-detail-1",
        "team-wang-veste-col-montant-noire-detail-2",
        "team-wang-veste-col-montant-noire-detail-3",
        "team-wang-veste-col-montant-noire-detail-4",
        "team-wang-veste-col-montant-noire-detail-5",
        "team-wang-veste-col-montant-noire-detail-6"
      ]
    },
    "note": "Pas de vue de dos complète (seulement l'étiquette de nuque). Photos de 800 px : demander les originaux."
  },
  {
    "slug": "polo-ralph-lauren-bomber-velours-violet",
    "brand": "Polo Ralph Lauren",
    "category": "jacket",
    "name": "Bomber varsity en velours côtelé violet, patch « P »",
    "color": "#420A0D",
    "image": {
      "front": "polo-ralph-lauren-bomber-velours-violet-face",
      "back": "polo-ralph-lauren-bomber-velours-violet-dos",
      "details": [
        "polo-ralph-lauren-bomber-velours-violet-detail-1",
        "polo-ralph-lauren-bomber-velours-violet-detail-2",
        "polo-ralph-lauren-bomber-velours-violet-detail-3",
        "polo-ralph-lauren-bomber-velours-violet-detail-4",
        "polo-ralph-lauren-bomber-velours-violet-detail-5",
        "polo-ralph-lauren-bomber-velours-violet-detail-6",
        "polo-ralph-lauren-bomber-velours-violet-detail-7"
      ]
    }
  },
  {
    "slug": "erl-hoodie-zippe-e-california-76",
    "brand": "ERL",
    "category": "hoodie",
    "name": "Hoodie zippé marine délavé, « E » appliqué (dos « California 76 »)",
    "color": "#2B2A2C",
    "image": {
      "front": "erl-hoodie-zippe-e-california-76-face",
      "back": "erl-hoodie-zippe-e-california-76-dos",
      "details": [
        "erl-hoodie-zippe-e-california-76-detail-1",
        "erl-hoodie-zippe-e-california-76-detail-2",
        "erl-hoodie-zippe-e-california-76-detail-3",
        "erl-hoodie-zippe-e-california-76-detail-4",
        "erl-hoodie-zippe-e-california-76-detail-5"
      ]
    }
  },
  {
    "slug": "satoshi-nakamoto-pull-gaufre-blanc",
    "brand": "Satoshi Nakamoto",
    "category": "hoodie",
    "name": "Pull gaufré blanc, grand logo noir",
    "color": "#F1ECE0",
    "image": {
      "front": "satoshi-nakamoto-pull-gaufre-blanc-face",
      "back": "satoshi-nakamoto-pull-gaufre-blanc-dos",
      "details": [
        "satoshi-nakamoto-pull-gaufre-blanc-detail-1",
        "satoshi-nakamoto-pull-gaufre-blanc-detail-2",
        "satoshi-nakamoto-pull-gaufre-blanc-detail-3",
        "satoshi-nakamoto-pull-gaufre-blanc-detail-4"
      ]
    }
  },
  {
    "slug": "represent-tshirt-manches-superposees-romance",
    "brand": "Represent",
    "category": "tee",
    "name": "T-shirt manches longues superposées, ange et pégase « Romance »",
    "color": "#6B6766",
    "image": {
      "front": "represent-tshirt-manches-superposees-romance-face",
      "back": "represent-tshirt-manches-superposees-romance-dos",
      "details": [
        "represent-tshirt-manches-superposees-romance-detail-1",
        "represent-tshirt-manches-superposees-romance-detail-2",
        "represent-tshirt-manches-superposees-romance-detail-3",
        "represent-tshirt-manches-superposees-romance-detail-4",
        "represent-tshirt-manches-superposees-romance-detail-5",
        "represent-tshirt-manches-superposees-romance-detail-6",
        "represent-tshirt-manches-superposees-romance-detail-7"
      ]
    }
  },
  {
    "slug": "represent-hoodie-zippe-gnr-london",
    "brand": "Represent",
    "category": "hoodie",
    "name": "Hoodie zippé « Guns N' Roses London », croix à crânes cloutée",
    "color": "#6B6766",
    "image": {
      "front": "represent-hoodie-zippe-gnr-london-face",
      "back": "represent-hoodie-zippe-gnr-london-dos",
      "details": [
        "represent-hoodie-zippe-gnr-london-detail-1",
        "represent-hoodie-zippe-gnr-london-detail-2",
        "represent-hoodie-zippe-gnr-london-detail-3",
        "represent-hoodie-zippe-gnr-london-detail-4",
        "represent-hoodie-zippe-gnr-london-detail-5",
        "represent-hoodie-zippe-gnr-london-detail-6"
      ]
    }
  },
  {
    "slug": "represent-hoodie-zippe-owners-club",
    "brand": "Represent",
    "category": "hoodie",
    "name": "Hoodie zippé « Owners Club », dégradé terracotta",
    "color": "#9A938A",
    "image": {
      "front": "represent-hoodie-zippe-owners-club-face",
      "details": [
        "represent-hoodie-zippe-owners-club-detail-1",
        "represent-hoodie-zippe-owners-club-detail-2",
        "represent-hoodie-zippe-owners-club-detail-3",
        "represent-hoodie-zippe-owners-club-detail-4",
        "represent-hoodie-zippe-owners-club-detail-5",
        "represent-hoodie-zippe-owners-club-detail-6",
        "represent-hoodie-zippe-owners-club-detail-7"
      ]
    },
    "note": "Pas de vue de dos complète (seulement la capuche)."
  },
  {
    "slug": "represent-hoodie-taupe-1993-rep",
    "brand": "Represent",
    "category": "hoodie",
    "name": "Hoodie gris taupe « 1993 REP RESENT »",
    "color": "#6B6766",
    "image": {
      "front": "represent-hoodie-taupe-1993-rep-face",
      "back": "represent-hoodie-taupe-1993-rep-dos",
      "details": [
        "represent-hoodie-taupe-1993-rep-detail-1",
        "represent-hoodie-taupe-1993-rep-detail-2",
        "represent-hoodie-taupe-1993-rep-detail-3",
        "represent-hoodie-taupe-1993-rep-detail-4",
        "represent-hoodie-taupe-1993-rep-detail-5",
        "represent-hoodie-taupe-1993-rep-detail-6"
      ]
    }
  },
  {
    "slug": "vale-hoodie-manhattan-athl-div",
    "brand": "Vale",
    "category": "hoodie",
    "name": "Hoodie écru taché, patch « Manhattan Athl. Div » violet (VSU)",
    "color": "#C9BFAA",
    "image": {
      "front": "vale-hoodie-manhattan-athl-div-face",
      "back": "vale-hoodie-manhattan-athl-div-dos",
      "details": [
        "vale-hoodie-manhattan-athl-div-detail-1",
        "vale-hoodie-manhattan-athl-div-detail-2",
        "vale-hoodie-manhattan-athl-div-detail-3",
        "vale-hoodie-manhattan-athl-div-detail-4",
        "vale-hoodie-manhattan-athl-div-detail-5",
        "vale-hoodie-manhattan-athl-div-detail-6",
        "vale-hoodie-manhattan-athl-div-detail-7",
        "vale-hoodie-manhattan-athl-div-detail-8"
      ]
    }
  },
  {
    "slug": "vale-hoodie-chaines-croix-valley",
    "brand": "Vale",
    "category": "hoodie",
    "name": "Hoodie écru, chaînes et croix imprimées « Valley », manches dégradées",
    "color": "#C9BFAA",
    "image": {
      "front": "vale-hoodie-chaines-croix-valley-face",
      "back": "vale-hoodie-chaines-croix-valley-dos",
      "details": [
        "vale-hoodie-chaines-croix-valley-detail-1",
        "vale-hoodie-chaines-croix-valley-detail-2",
        "vale-hoodie-chaines-croix-valley-detail-3",
        "vale-hoodie-chaines-croix-valley-detail-4",
        "vale-hoodie-chaines-croix-valley-detail-5",
        "vale-hoodie-chaines-croix-valley-detail-6",
        "vale-hoodie-chaines-croix-valley-detail-7"
      ]
    }
  },
  {
    "slug": "vale-hoodie-zippe-violet-army-of-dreams",
    "brand": "Vale",
    "category": "hoodie",
    "name": "Hoodie zippé violet délavé « Valley Army of Dreams », écussons sur la manche",
    "color": "#202833",
    "image": {
      "front": "vale-hoodie-zippe-violet-army-of-dreams-face",
      "back": "vale-hoodie-zippe-violet-army-of-dreams-dos",
      "details": [
        "vale-hoodie-zippe-violet-army-of-dreams-detail-1",
        "vale-hoodie-zippe-violet-army-of-dreams-detail-2",
        "vale-hoodie-zippe-violet-army-of-dreams-detail-3",
        "vale-hoodie-zippe-violet-army-of-dreams-detail-4",
        "vale-hoodie-zippe-violet-army-of-dreams-detail-5"
      ]
    }
  },
  {
    "slug": "vale-hoodie-zippe-gris-athletic-dept-14",
    "brand": "Vale",
    "category": "hoodie",
    "name": "Hoodie zippé gris « Vale USA Athletic Dept 14 », panthère",
    "color": "#9A938A",
    "image": {
      "front": "vale-hoodie-zippe-gris-athletic-dept-14-face",
      "back": "vale-hoodie-zippe-gris-athletic-dept-14-dos",
      "details": [
        "vale-hoodie-zippe-gris-athletic-dept-14-detail-1",
        "vale-hoodie-zippe-gris-athletic-dept-14-detail-2",
        "vale-hoodie-zippe-gris-athletic-dept-14-detail-3",
        "vale-hoodie-zippe-gris-athletic-dept-14-detail-4",
        "vale-hoodie-zippe-gris-athletic-dept-14-detail-5",
        "vale-hoodie-zippe-gris-athletic-dept-14-detail-6",
        "vale-hoodie-zippe-gris-athletic-dept-14-detail-7"
      ]
    },
    "note": "Les photos de studio le montrent plus sombre (kaki) que les photos de détail (gris clair) : vérifier le vrai coloris."
  },
  {
    "slug": "vale-pull-manches-superposees-skull",
    "brand": "Vale",
    "category": "tee",
    "name": "T-shirt manches longues gaufrées superposées, « VALE » et crâne",
    "color": "#2B2A2C",
    "image": {
      "front": "vale-pull-manches-superposees-skull-face",
      "back": "vale-pull-manches-superposees-skull-dos",
      "details": [
        "vale-pull-manches-superposees-skull-detail-1",
        "vale-pull-manches-superposees-skull-detail-2",
        "vale-pull-manches-superposees-skull-detail-3",
        "vale-pull-manches-superposees-skull-detail-4",
        "vale-pull-manches-superposees-skull-detail-5"
      ]
    }
  },
  {
    "slug": "satoshi-nakamoto-hoodie-zippe-noir-delave",
    "brand": "Satoshi Nakamoto",
    "category": "hoodie",
    "name": "Hoodie zippé noir délavé troué, logo « Satoshi Nakamoto » sur la poche",
    "color": "#2B2A2C",
    "image": {
      "front": "satoshi-nakamoto-hoodie-zippe-noir-delave-face",
      "back": "satoshi-nakamoto-hoodie-zippe-noir-delave-dos",
      "details": [
        "satoshi-nakamoto-hoodie-zippe-noir-delave-detail-1",
        "satoshi-nakamoto-hoodie-zippe-noir-delave-detail-2",
        "satoshi-nakamoto-hoodie-zippe-noir-delave-detail-3",
        "satoshi-nakamoto-hoodie-zippe-noir-delave-detail-4",
        "satoshi-nakamoto-hoodie-zippe-noir-delave-detail-5",
        "satoshi-nakamoto-hoodie-zippe-noir-delave-detail-6",
        "satoshi-nakamoto-hoodie-zippe-noir-delave-detail-7"
      ]
    }
  },
  {
    "slug": "satoshi-nakamoto-hoodie-zippe-gris-damier",
    "brand": "Satoshi Nakamoto",
    "category": "hoodie",
    "name": "Hoodie zippé gris très troué, lettres rouges sur damier noir, clous et cristaux",
    "color": "#C9BFAA",
    "image": {
      "front": "satoshi-nakamoto-hoodie-zippe-gris-damier-face",
      "back": "satoshi-nakamoto-hoodie-zippe-gris-damier-dos",
      "details": [
        "satoshi-nakamoto-hoodie-zippe-gris-damier-detail-1",
        "satoshi-nakamoto-hoodie-zippe-gris-damier-detail-2",
        "satoshi-nakamoto-hoodie-zippe-gris-damier-detail-3",
        "satoshi-nakamoto-hoodie-zippe-gris-damier-detail-4",
        "satoshi-nakamoto-hoodie-zippe-gris-damier-detail-5",
        "satoshi-nakamoto-hoodie-zippe-gris-damier-detail-6",
        "satoshi-nakamoto-hoodie-zippe-gris-damier-detail-7",
        "satoshi-nakamoto-hoodie-zippe-gris-damier-detail-8"
      ]
    }
  },
  {
    "slug": "protocol-index-hoodie-zippe-army",
    "brand": "Protocol Index",
    "category": "hoodie",
    "name": "Hoodie zippé gris « ARMY », patch brodé, imprimés sur les manches",
    "color": "#9A938A",
    "image": {
      "front": "protocol-index-hoodie-zippe-army-face",
      "back": "protocol-index-hoodie-zippe-army-dos",
      "details": [
        "protocol-index-hoodie-zippe-army-detail-1",
        "protocol-index-hoodie-zippe-army-detail-2",
        "protocol-index-hoodie-zippe-army-detail-3",
        "protocol-index-hoodie-zippe-army-detail-4",
        "protocol-index-hoodie-zippe-army-detail-5",
        "protocol-index-hoodie-zippe-army-detail-6"
      ]
    }
  },
  {
    "slug": "polo-ralph-lauren-pull-zippe-cotes-creme",
    "brand": "Polo Ralph Lauren",
    "category": "jacket",
    "name": "Pull zippé col montant en maille côtelée crème, poney brodé",
    "color": "#F1ECE0",
    "image": {
      "front": "polo-ralph-lauren-pull-zippe-cotes-creme-face",
      "back": "polo-ralph-lauren-pull-zippe-cotes-creme-dos",
      "details": [
        "polo-ralph-lauren-pull-zippe-cotes-creme-detail-1",
        "polo-ralph-lauren-pull-zippe-cotes-creme-detail-2",
        "polo-ralph-lauren-pull-zippe-cotes-creme-detail-3",
        "polo-ralph-lauren-pull-zippe-cotes-creme-detail-4"
      ]
    }
  },
  {
    "slug": "team-wang-cardigan-jacquard-rouge",
    "brand": "Team Wang",
    "category": "jacket",
    "name": "Cardigan jacquard rouge, boutons dorés (existe aussi en beige)",
    "color": "#680209",
    "image": {
      "front": "team-wang-cardigan-jacquard-rouge-face",
      "back": "team-wang-cardigan-jacquard-rouge-dos",
      "details": [
        "team-wang-cardigan-jacquard-rouge-detail-1",
        "team-wang-cardigan-jacquard-rouge-detail-2",
        "team-wang-cardigan-jacquard-rouge-detail-3",
        "team-wang-cardigan-jacquard-rouge-detail-4",
        "team-wang-cardigan-jacquard-rouge-detail-5",
        "team-wang-cardigan-jacquard-rouge-detail-6",
        "team-wang-cardigan-jacquard-rouge-detail-7"
      ]
    },
    "note": "Marque supposée (aucune étiquette visible, mêmes photos de studio que les pantalons Team Wang) : à confirmer. Le coloris beige n'a qu'une photo (avec le rouge)."
  },
  {
    "slug": "team-wang-pantalon-large-cordon-genoux-dechires",
    "brand": "Team Wang",
    "category": "pants",
    "name": "Pantalon noir large à plis, cordon, genoux déchirés, ourlet effiloché",
    "color": "#141416",
    "image": {
      "front": "team-wang-pantalon-large-cordon-genoux-dechires-face",
      "back": "team-wang-pantalon-large-cordon-genoux-dechires-dos",
      "details": [
        "team-wang-pantalon-large-cordon-genoux-dechires-detail-1",
        "team-wang-pantalon-large-cordon-genoux-dechires-detail-2",
        "team-wang-pantalon-large-cordon-genoux-dechires-detail-3",
        "team-wang-pantalon-large-cordon-genoux-dechires-detail-4",
        "team-wang-pantalon-large-cordon-genoux-dechires-detail-5",
        "team-wang-pantalon-large-cordon-genoux-dechires-detail-6",
        "team-wang-pantalon-large-cordon-genoux-dechires-detail-7",
        "team-wang-pantalon-large-cordon-genoux-dechires-detail-8",
        "team-wang-pantalon-large-cordon-genoux-dechires-detail-9"
      ]
    }
  },
  {
    "slug": "team-wang-pantalon-large-poches-zippees",
    "brand": "Team Wang",
    "category": "pants",
    "name": "Pantalon noir large, taille élastique, poches zippées",
    "color": "#141416",
    "image": {
      "front": "team-wang-pantalon-large-poches-zippees-face",
      "back": "team-wang-pantalon-large-poches-zippees-dos",
      "details": [
        "team-wang-pantalon-large-poches-zippees-detail-1",
        "team-wang-pantalon-large-poches-zippees-detail-2",
        "team-wang-pantalon-large-poches-zippees-detail-3"
      ]
    }
  },
  {
    "slug": "team-wang-pantalon-plis-anneau-ourlet-effiloche",
    "brand": "Team Wang",
    "category": "pants",
    "name": "Pantalon noir à plis, anneau métallique à la ceinture, ourlet effiloché",
    "color": "#141416",
    "image": {
      "front": "team-wang-pantalon-plis-anneau-ourlet-effiloche-face",
      "back": "team-wang-pantalon-plis-anneau-ourlet-effiloche-dos",
      "details": [
        "team-wang-pantalon-plis-anneau-ourlet-effiloche-detail-1",
        "team-wang-pantalon-plis-anneau-ourlet-effiloche-detail-2",
        "team-wang-pantalon-plis-anneau-ourlet-effiloche-detail-3"
      ]
    }
  }
];
