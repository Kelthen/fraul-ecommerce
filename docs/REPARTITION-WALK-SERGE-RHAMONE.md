# Walk — répartition code / Blender

**Décision de Rhamone, 9 novembre 2026** : « tout ce qui ne concerne pas blender […] le claude de Serge puisse les faire » ; « moi je ferai les bails de blender ». Cette répartition remplace les anciennes attributions des lots : **Serge et son Claude prennent le code du site ; Rhamone réalise les assets Blender et supervise les validations visuelles.**

## Reprendre sans refaire

- Lire `AGENTS.md`, `CLAUDE.md`, les décisions de `STATUS.md`, puis ce document. La PR #114 contient déjà la visite 360°, des interactions, l'écran des looks et la sortie par la porte : ce n'est pas une nouvelle fonctionnalité à recréer. Vérifier son dernier commit et ce qui a rejoint `main` avant de travailler.
- Dossier de référence : [plan du mall](PLAN-MALL-REALISTE.md) et [revue des produits](REVUE-PRESENTATION-PRODUITS.md). Les visuels validés sont liés dans ces notes ; ne pas remplacer les photos réelles par les illustrations de conception.
- #109 reste le dossier de préparation en brouillon, pas une base de code à fusionner. Les captures PC récentes existent dans la conversation mais les PNG ne sont pas encore joints au dépôt ; les réclamer pour la comparaison exacte, sans bloquer la lecture du code ou la préparation des cas de test.
- **Un seul responsable de `src/walk/engine.js` pendant cette phase : le côté Serge.** Le côté Rhamone prépare modèles et textures sans éditer en parallèle ce moteur. Annoncer dans #114 la branche de reprise et le commit de départ ; ne pas pousser sur la branche d'un autre sans coordination. Une nouvelle branche de réalisation part de `origin/main` à jour et reprend les changements non mergés de #114 de manière coordonnée, sans les réécrire ou les perdre. Pas de force-push ni de merge automatique.

## Lot Serge : code, présentation, interactions et intégration

Ces tâches ne nécessitent pas d'attendre de nouveaux modèles Blender. Utiliser les assets actuels pour les prototypes.

| Priorité | Travail confié au côté Serge | Points d'entrée / résultat attendu |
|---|---|---|
| S1 | Cadrage des accessoires et sneakers dès la sélection ; taille adaptée au viewport ; dégager le mannequin et les articles derrière. | `engine.js`, `src/walk/models/store-layout.ts`, `src/walk/walk.css`. Produit entier entre titre et achat, grand et lisible, sans recouvrement. Ceinture, portefeuille, G-Shock, Lanvin, chaîne et bracelet ; lunettes sans régression. |
| S2 | Choix de photo de présentation par article ; original conservé ; détourage seulement s'il est fidèle ; fonds contrastés pour bijoux. | Chargement/texture, `knockOut()`, `opaqueBox()`, composants de galerie à repérer. Comparer les originaux avant de retenir une photo, éviter les fonds supprimés de force. Tester la G-Shock composée et une photo isolée. Toute extension admin/données doit être exposée séparément ; cette attribution n'autorise pas une migration ou une modification de prix. |
| S3 | Écran des looks : photo de la marque, personnage entier avec marge, cadre stable, défilement et sélection corrects. | `engine.js`, `src/components/home/LooksStrip.tsx`, `src/models/home/looks.ts`, source de looks publiée. Tester environ 5–8 % de marge, plusieurs ratios, un/plusieurs/aucun look, photos distantes, réduction des animations. Pas de duplication manuelle du catalogue. |
| S4 | Finitions des contrôles 360°, menu Rayons discret, clics directs et retour de fiche sans perdre son point de vue. | Reprendre #114, ne pas réimplémenter ce qui fonctionne. Séparer glissement/clic, collisions et occlusion, retour téléphone et clavier. Rayons reste un raccourci facultatif. |
| S5 | Continuité intérieure/galerie et sortie au clic ; caméra et raccords d'échelle ; texte anglais du tableau. | `engine.js`, `src/walk/models/mall-layout.ts`, `src/walk/modes/t.ts`, `src/content/walk.ts`. Vrai voisinage du mall visible, pas de fond blanc ; toucher la porte retourne devant la même boutique. « Thank you. See you soon. », sans emoji. Réutiliser le gabarit extérieur validé. |
| S6 | Cintres : ancrages, synchronisation photo/support et animation ; supprimer les doublons avec le cintre photographié. | `hook()`/`hanger()`, placement et animation dans `engine.js`, mesures de `store-layout.ts`. Repos → sélection → retour, contact crochet/barre, 45° et espacement préservés. La géométrie raffinée vient de Rhamone, mais l'accrochage et le mouvement sont du code. |
| S7 | Réglages WebGL et intégration des assets livrés : couleurs, lumière, reflets, transparence, ombres, chargement et performances. | `engine.js`, vues `facades.ts`, `concierge.ts`, `entrance.ts`, `caisse.ts`, `src/walk/models/daylight.ts`, scripts de préparation/export existants. Ne pas confondre texture Blender et encodage/lumière du moteur. Pas de refonte de palette ou d'architecture sans visuel. |
| S8 | Données des pancartes promotionnelles et contenus de marque ; affichage conditionnel. | Réutiliser les sources réelles existantes à identifier. Sans promotion active fiable, masquer la pancarte ; 30 % dans l'image est illustratif. Pas de changement de prix, marges ou règles commerciales. Tableau supplémentaire au-dessus du mannequin encore à visualiser. |

**Ordre de livraison** : S1–S2 ensemble sur quelques produits témoins ; S3 ; corrections restantes de S4–S5 ; S6–S7 au rythme des assets ; S8 quand une source réelle est disponible. Ne pas regrouper toutes les corrections dans une grosse PR. Les points déjà fonctionnels sont vérifiés, pas refaits. Les photos détourées/recadrages et réglages d'interface relèvent du côté Serge, pas du lot Blender.

## Lot Rhamone : modélisation et assets Blender

| Asset | Travail réservé à Rhamone | Référence / contrainte |
|---|---|---|
| Duo de mannequins | Reprendre corps, mains, vêtements, raccord taille, chaussures et poses. | [Duo validé](../assets-src/references/mall-realiste/mannequins-duo-valide.png) : homme détendu, femme main sur hanche, léger déhanché ; proportions, vêtement ample, aucune intersection. Source existante `assets-src/models/fraul_mannequin.glb`. |
| Portants et cintres | Tube, fixations, biseaux, cintre noir, crochet court et variante à pinces. | [Finitions validées](../assets-src/references/mall-realiste/portant-cintres-finitions.png). Fournir repère d'accrochage ; conserver cotes et circulation. Ne pas refaire tous les vêtements en 3D. |
| Comptoirs et vitrines | Finitions de géométrie, épaisseurs et biseaux du plateau, cadres, socles, seuils. | Garder les volumes et assets déjà réalisés, notamment vitrine ERD. Pas de nouveau mall ni de changement d'implantation. L'écart d'ouverture intérieur/extérieur doit être résolu avec les cotes partagées par Serge avant export. |
| Signalétique | Support du tableau, cadre d'écran et présentoir promotionnel. | [Disposition validée](../assets-src/references/mall-realiste/interieur-ecran-sortie-valide.png). Faces d'affichage séparées : les textes, photos et taux restent dynamiques dans le site. Ne pas cuire une remise ou une marque dans la texture. |
| Matières et végétation | UV, textures pierre/sol/métal, détails de l'olivier et du pot si nécessaire. | Reprendre `assets-src/blender/` et les livrables existants ; pas de reconstruction inutile. Reflets et éclairage WebGL sont finalisés par Serge. |

Rhamone fournit les modèles ; **Serge assure leur chargement, placement et comportement dans le site**. L'optimisation d'export ou l'adaptation des scripts peut être faite côté Serge sans reprendre la conception du modèle.

## Contrat de livraison entre les deux côtés

- Par asset : source `.blend` ou script Blender reproductible dans `assets-src/`, export GLB et textures identifiés, dimensions, origine, axes et noms de matériaux documentés. Mètres ; glTF avec Y vertical ; tester un réimport pour éviter les doubles rotations.
- Repères utiles : crochet/barre pour le cintre, sol/pieds pour le mannequin, face d'affichage pour écran/tableau, emprise au sol pour mobilier/collisions. Ne pas demander au code de deviner un point d'accrochage à partir de marges de photo.
- Garder matériaux et pièces nommés ; communiquer les changements de noms au moteur. Préserver les modèles existants jusqu'à validation du remplacement. Indiquer poids, triangles et textures ; comparer avant/après optimisation, sans annoncer une fluidité garantie.
- Les différences de pipeline homme/femme et les retouches de tee actuelles doivent être contrôlées pour ne pas redéformer les nouveaux modèles. Serge adapte les scripts, Rhamone vérifie les silhouettes résultantes.
- Le côté qui produit un asset poste son chemin et son commit dans #114. Serge confirme son intégration et fournit la preview. Aucun changement silencieux de dimensions sur un module déjà raccordé.

## Validation commune

Rhamone valide les visuels et previews, y compris ceux produits côté Serge. Un principe validé n'est pas un rendu final validé. Les fonds de bijoux, le réglage précis des marges et le tableau supplémentaire doivent être montrés sur des cas réels avant généralisation.

Pour chaque livraison : capture avant/après au même viewport et même état, test téléphone/PC, résultats de `npm run check` et des contrôles Walk pertinents, séquence des gestes si interaction. Ne pas attendre Blender pour corriger les positions des produits, les photos ou les menus. Ne pas généraliser un rendu refusé. Auteur Git Kelthen, sans signature supplémentaire ; aucune fusion sans validation humaine.
