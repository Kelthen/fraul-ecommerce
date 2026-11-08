# Accueil — défilé de looks

Proposition de Rhamone, 8 novembre 2026. À discuter et affiner avant réalisation.

## Intention

Retravailler l'accueil TakeUrClothes, dont le logo est conservé, pour rendre les vrais articles plus désirables et présenter des looks portés. Garder une entrée claire vers le Walk, qui reste au cœur du site.

## Expérience envisagée

- Sur l'accueil, plusieurs mannequins portant des tenues défilent horizontalement, comme dans la vidéo de référence de Viktor Oddy transmise par Rhamone.
- Quand le visiteur choisit un mannequin, il voit les articles qu'il porte et peut ouvrir leurs fiches. Le comportement doit être simple et fluide sur téléphone.
- Le visuel proposé en session est une direction de travail, pas une validation de tous les textes, images ou détails de navigation.
- Les pièces affichées doivent correspondre aux vrais articles du catalogue ; vérifier leur disponibilité et leurs liens.

## Retour sur la preview de la PR #96 — 8 novembre

Rhamone a vu la preview téléphone et ne valide pas le défilement : les grandes cartes rectangulaires à coins arrondis, où les personnages sont rognés (tête ou pieds), ne reproduisent pas l'effet de la vidéo. Revoir la mise en scène du défilé avant toute validation. Ne pas toucher à sa branche sans coordination.

### Références à regarder avant une nouvelle proposition

- [Vidéo de référence sur X](https://x.com/viktoroddy/status/2118835087366291650) : regarder le mouvement réel. Le défilé montre plusieurs personnes dans un même espace clair, un personnage au centre et les autres autour avec un effet de profondeur. En sélection, le personnage entier reste visible et la liste des pièces apparaît sur le côté sur ordinateur.
- [Maquette discutée sur téléphone](../assets-src/references/accueil-looks/proposition-mobile.png) : plusieurs personnages visibles dans un espace commun ; en choisissant un look, ses pièces apparaissent. Les textes et le libellé « Walk » de cette maquette ne sont pas validés.

### Direction à proposer

Défilement fluide des personnages dans une scène commune, en s'appuyant sur la vidéo plutôt que sur un carrousel de cartes. Un geste amène le look choisi au centre ; toucher le personnage permet d'accéder à ses articles. Garder la tête, les vêtements et les chaussures visibles sur téléphone. La vidéo montre l'ordinateur : proposer une adaptation téléphone et la montrer à Rhamone avant de modifier l'expérience. Les noms, photos, liens et prix viennent du catalogue ; ne pas inventer de prix barrés ou de remises vus dans la référence.

## Visuels validés pour travailler

Rhamone envisage soit de fournir des photos de mannequins portant les articles, soit de créer des images de mannequins à partir des photos des vrais articles. Un premier essai est fait en session avec l'ensemble Nike noir et gris. Les images produites doivent être comparées aux vraies pièces : coupe, couleurs, logos et détails peuvent changer. Pas de visuel mensonger présenté comme une photo fidèle.

Retour de Rhamone : varier les personnages comme dans la photo de référence (femmes et hommes, apparences et poses diverses). Les chaussures inventées du premier essai sont refusées : utiliser de vrais modèles Nike, New Balance ou ASICS, à identifier précisément avec leurs photos. Le texte du short généré était déformé : contrôler les inscriptions. Les essais utilisaient la copie du dépôt ; certains articles n'étaient pas présents dans le catalogue affiché sur le site le 8 novembre. Vérifier le catalogue actuel avant de sélectionner les vêtements et leurs fiches.

Le 8 novembre, Rhamone a apprécié les deux essais ci-dessous et a donné son accord pour les ajouter au dépôt afin de préparer la suite. Ils sont rangés dans `assets-src/looks/` comme références de travail, pas encore affichés sur le site :

| Image | Articles du catalogue à associer | Chaussures illustrées |
|---|---|---|
| `assets-src/looks/look-corteiz.jpg` | `/produit/corteiz-hoodie-corteiz-noir` et `/produit/corteiz-jogging-corteiz-noir` | Inspirées des Air Jordan 1 Chicago |
| `assets-src/looks/look-valley-acne.jpg` | `/produit/valley-dreams-t-shirt-valley-blanc` et `/produit/acne-studios-pant-delave-acne-studios` | Inspirées des Air Jordan 4 |
| `assets-src/looks/look-corteiz-denim-tears.jpg` | `/produit/corteiz-hoodie-corteiz-x-denim-tears` et `/produit/corteiz-pant-corteiz-x-denim` | Inspirées des Air Jordan 4 |
| `assets-src/looks/look-acne-kappa.jpg` | `/produit/acne-studios-veste-acne-studios-x-kappa-noir` et `/produit/acne-studios-pant-acne-studios-x-kappa-noir` | Inspirées des Air Jordan 4 |
| `assets-src/looks/look-gallery-acne.jpg` | `/produit/gallery-dept-gallery-dept-long-sleeve-pocket-tee` et `/produit/acne-studios-pant-delave-acne-studios` | Inspirées des Air Jordan 4 |
| `assets-src/looks/look-paly-acne.jpg` | `/produit/paly-wood-t-shirt-paly-blanc` et `/produit/acne-studios-pant-acne-studios-x-kappa-noir` | Inspirées des Air Jordan 4 |

Rhamone valide ces quatre essais supplémentaires le 8 novembre pour préparer un test à six looks. Les personnages varient ; le défilé et l'affichage des articles restent à réaliser. Ce sont des images de référence à contrôler, pas des photos fournisseur.

Les articles figuraient sur le site au moment de l'essai ; revérifier leur disponibilité avant de les montrer. Les chaussures sont une illustration : leur fidélité à un modèle réel n'a pas été vérifiée et elles ne doivent pas être présentées comme des produits vendus. Plusieurs petits textes sur le t-shirt Valley Dreams sont déformés : les corriger ou utiliser une photo fidèle avant toute mise en ligne. Comparer aussi les imprimés du t-shirt Paly Wood, les motifs Corteiz × Denim Tears et les badges et inscriptions Acne/Kappa aux photos du catalogue. Pour un look Nike Tech Fleece, Rhamone demande des Nike Air Force 1 ; pour les autres, des Jordan. Ne pas faire croire que des articles absents du catalogue sont disponibles.

## Organisation

- Étape actuelle : Rhamone valide ces deux essais et souhaite lancer la préparation de l'accueil. L'implémentation reste à préciser avec Claude, qui dirige la réalisation ; Rhamone supervise et valide la preview.
- Comparer les propositions et vérifier les PR ouvertes avant de coder pour éviter les doublons.
- Plan et visuel → accord explicite → branche et code → PR avec vraie preview → validation visuelle → accord pour merge.
- Un sujet par PR ; pas de signature d'outil ou de ligne de co-auteur. Auteur Git : Kelthen.
- Le portant du Walk et la création de tenue sont des sujets distincts à reprendre plus tard ; ne pas les intégrer à cette étape.
