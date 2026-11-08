# Walk — plan pour les vêtements sur portant

Discussion avec Rhamone, 8 novembre 2026. Proposition à affiner avant réalisation ; Claude dirige la réalisation, Rhamone supervise et valide la preview.

## Intention et référence

Rapprocher la présentation du mouvement du portant dans la [vidéo de référence](https://x.com/AmirMushich/status/2114790481066615068) : les pièces sont vues de côté, une pièce sort du rang et se présente de face. Rhamone souhaite les pièces légèrement moins serrées qu'aujourd'hui, mais légèrement plus rapprochées que dans la première maquette. [Maquette d'espacement discutée](../assets-src/references/portant/portant-espacement.jpg) : elle illustre l'espacement seulement ; elle ne valide pas un changement de décor, une boutique fictive ou le mélange des catégories. Respecter les règles existantes du cintre (LESSONS L-53).

## Existant vérifié

- `src/walk/models/store-layout.ts` règle les positions des rayons ; `side` existe pour tee, hoodie et jacket. Pants et shorts ont déjà un rayon mais pas ce traitement de côté.
- `src/walk/engine.js` construit les vues de côté et anime la pièce sélectionnée ; les photos de face/dos et la fiche sont déjà reliées au catalogue. Les vues de côté des hauts sont actuellement des silhouettes dessinées à la couleur de la photo, pas des photos réelles de profil.
- La vraie photo de l'article choisi apparaît dans un cadre dans la preview actuelle. Rhamone souhaite étudier une présentation ressemblant davantage à la vidéo ; la fidélité aux photos produit reste essentielle.

## Plan proposé

1. Tester l'espacement sur un seul rayon, à partir du code existant, sans dépasser la longueur du rail ni changer l'architecture de la boutique. Évaluer aussi peu et beaucoup de produits, sur téléphone.
2. Étendre le principe aux vêtements suspendus : t-shirts, hoodies, vestes, pantalons et shorts ; choisir une suspension réaliste propre aux hauts et aux bas. Chaque rayon ne montre que ses produits réels.
3. Conserver la photo réelle pour la pièce sélectionnée ; étudier le détourage et un affichage de secours fidèle lorsqu'il n'est pas disponible. Ne pas afficher un dessin généré comme s'il s'agissait du véritable article.
4. Peaufiner la transition : les vêtements défilent, la pièce choisie s'écarte puis se présente de face ; informations, tailles et panier restent accessibles. Glisser au doigt puis toucher une pièce est une proposition de comportement à confirmer avec Rhamone.
5. Vérifier si Blender apporte quelque chose pour le rail et les cintres ; ne l'utiliser que si un prototype léger améliore le rendu. Ne pas créer un modèle 3D par article sans décision préalable.
6. Tester chaque rayon modifié sur téléphone et ordinateur : sélection, retour, fiche, panier, photos issues de Supabase et performance. Exécuter `npm run check` puis le smoke du projet ; montrer la vraie preview à Rhamone.

La maquette montre des catégories regroupées et un décor différent : ce sont des approximations de l'image, pas des changements demandés. Les questions de prix et l'assortiment existant ne font pas partie du sujet.
