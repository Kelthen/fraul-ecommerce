# Walk — finitions luxe et vitrines intégrées

> Direction validée par Rhamone le 8 novembre 2026 : « on garde l'architecture actu », « un sol tres moderne, bcp de luxe dans l'ensemble », « les vitrines au même niveau que la grande porte d'entrée de la boutique ». Go : « voila lets go ».
> Plan de réalisation, pas une modification du site. Première livraison : une zone témoin modélisée dans Blender et vérifiée dans le navigateur. Validation visuelle avant généralisation et merge de la réalisation.

## Lire et démarrer

1. Regarder la référence ci-dessous et les mesures (§ Dimensions).
2. Lire les règles du dépôt, puis seulement les parties concernées de `facades.ts`, `mall-layout.ts`, `initMall()` / `buildDetail()` dans `engine.js` et `daylight.ts`.
3. Vérifier les PR ouvertes : #107 touche le détourage et le moteur du Walk ; conserver ce travail lors de l'intégration. #108 concerne les looks, sujet séparé. État vérifié au départ de ce plan, à revérifier avant de coder.
4. Construire une boutique témoin du type « enseigne », avec son morceau d'allée, en réutilisant les objets existants. Fournir une vue de face et une vue depuis l'allée avant d'étendre aux deux autres types.

## Références et limites

![Cible approuvée : matières luxe et vitrines alignées](../assets-src/references/mall-realiste/cible-vitrines-alignees.png)

- **Cette image valide** : sol ivoire poli à grands formats et joints fins, reflets doux, pierre claire, métal champagne brossé, couleurs des boutiques conservées, éclairage chaud des vitrines, mannequins derrière le verre. Vitrines latérales intégrées au plan de la façade ; leur haut s'aligne sur le haut de l'entrée. Entrée centrale dégagée.
- **Elle ne remplace pas les cotes ni les trois architectures** : les colonnes du portique Trapstar ont été simplifiées dans l'image ; garder les colonnes, leurs bases, chapiteaux et frontons du code. Ne pas recopier cette simplification.
- Les vêtements et inscriptions de la maquette ne valident aucun nouvel article ou logo. Réutiliser modèles de mannequins et données de marques du site ; les photos produits restent celles du catalogue.
- [Capture de départ](../assets-src/references/mall-realiste/existant-facade.png) : version locale `b0ef763`, `/walk?heure=14`, viewport 1440 × 900, premier arrêt. Les fichiers `facades.ts` et `mall-layout.ts` sont inchangés dans la base de ce plan `05754ea`. Cette capture n'est pas une capture de la production actuelle.
- Les anciennes propositions avec boutique entièrement redessinée ou vitrines étroites en saillie sont écartées. La cible ci-dessus est l'unique référence d'ambiance à utiliser.

## Existant et périmètre

| État | À respecter |
|---|---|
| Déjà construit | Mall paramétrique, trois façades, cycle jour/soir, vitrines avec photos changeantes, mannequins et caisse GLB. |
| Amélioration validée | Matières, reflets, ombres et vitrines latérales vitrées alignées sur l'entrée, sans changer le parcours ni les volumes généraux. |
| Décision antérieure maintenue | Décors Blender de remplacement refusés le 28 octobre : aucun nouveau mall monolithique, aucune refonte du plan. Blender sert ici aux finitions et modules conformes à l'architecture existante. |
| Hors de ce lot | Accueil, défilé de looks, portant, création de tenues, catalogue, paiement, navigation. Aucun passant animé ni musique automatique. |

## Dimensions et raccordement

Source : `src/walk/models/mall-layout.ts` et `src/walk/views/facades.ts`, base `05754ea`. Les unités de scène sont traitées comme des mètres. Relire les valeurs si ces fichiers évoluent.

| Repère | Mesure existante / contrainte |
|---|---|
| Emplacement d'une boutique (`SLOT`) | 8,50 m ; façade d'environ 8,30 m, conserver les raccords entre boutiques. |
| Hauteur du mall (`CEIL`) | 6,40 m. |
| Ouverture centrale | 4,80 m de large × 4,20 m de haut. Conserver le passage. |
| Axes des baies latérales | X = −3,25 m et +3,25 m dans le repère local de la boutique. |
| Largeur nominale de chaque baie | 1,75 m ; largeur vitrée utile à ajuster aux cadres et colonnes existants. |
| Alignement supérieur | Y = 4,20 m pour les deux vitrines et le cadre de l'entrée. |
| Plan de façade | Cadre de porte actuellement centré à Z = +0,42 m, épaisseur 0,08 m. Aligner la face extérieure des nouveaux cadres sur celle du cadre de porte ; verre légèrement en retrait. |
| Sens de profondeur | Z positif vers l'allée, Z négatif vers la boutique ; vitrine creusée vers l'intérieur. Aucun caisson avancé dans l'allée. |
| Colonnes du portique | Axes X = ±2,62 m, Z = +0,72 m ; rayon 0,17 m, bases/chapiteaux 0,50 m. Les conserver, adapter la baie autour. |

Élévation de principe : **vitrine gauche — entrée libre — vitrine droite**, sommet commun à 4,20 m. Le socle du mannequin reste bas ; sa hauteur et la profondeur de niche sont des réglages techniques à vérifier avec les dimensions réelles du GLB, pas des cotes validées dans l'image.

Dans `engine.js`, `buildDetail()` place aujourd'hui les mannequins à X = ±3,25, Z = +0,90, devant des fonds à Z = +0,41. **Il faut reculer les mannequins et remplacer les panneaux opaques concernés pour créer de vraies niches** : ajouter une vitre devant les panneaux actuels les masquerait. Mesurer la boîte englobante de chaque mannequin, conserver son échelle, vérifier mains et chaussures derrière la vitre et pieds sur le socle.

L'origine du module reste au sol, au centre de la façade. Blender : mètres, Z vertical ; export glTF vers Y vertical. Vérifier les axes après réimport pour éviter une double rotation. L'emplacement et l'orientation globaux restent calculés par `SLOTS` et `shopType(k)`.

## Matières et lumière

| Élément | Cible visible | Point de départ technique, à régler sur la preview |
|---|---|---|
| Sol | Grandes dalles ivoire polies, veinage presque imperceptible, joints fins, reflet doux des vitrines. | Texture répétable, relief discret ; métal = 0, rugosité environ 0,20–0,30. Éviter sol jaune, mouillé ou miroir. |
| Murs | Pierre claire avec grain fin et angles propres. | Métal = 0, rugosité environ 0,55–0,75 ; petits biseaux sur les arêtes visibles. |
| Encadrements | Champagne brossé, profils fins. | Matière métallique, rugosité environ 0,25–0,40 ; préserver les largeurs d'ouverture. |
| Verre | Transparent, contours et reflets légers, tenue lisible. | Tester la méthode compatible avec le moteur actuel avant de multiplier les vitres ; vérifier tri de transparence et visibilité des objets derrière. |
| Bordeaux / marques | Bordeaux satiné, couleurs propres aux enseignes conservées. | Garder la couleur dynamique de chaque marque ; ne pas figer noms et logos dans une texture commune. |
| Éclairage | Allée claire, spots doux sur les mannequins, ombres sous socles et dans les angles. | Garder les lignes de plafond existantes et `daylightAt()`. Ajuster lumière et exposition avant de multiplier les sources. |

La version actuelle utilise Three.js 0.128 : vérifier les matériaux/extensions réellement pris en charge par son chargeur GLB. Un matériau Blender complexe ou un éclairage Cycles ne se transfère pas automatiquement. Les surfaces statiques peuvent recevoir des textures de matière et d'occlusion précalculées ; éviter de cuire une lumière de plein jour qui annulerait le cycle soir/nuit.

## Réalisation Blender en trois étapes

1. **Gabarit et vitrines.** Reprendre les cotes du code, réutiliser les mannequins GLB, créer les niches latérales et cadres séparés. Garder objets, matières et origine clairement nommés (`Facade`, `Vitrine_G`, `Vitrine_D`, `Verre_G`, `Verre_D`, `Socle_G`, `Socle_D`, `Repere_Enseigne`). Regrouper les opérations MCP dans un script reproductible, sans recréer toute la scène à chaque ajustement. Montrer vue de face et vue depuis l'allée.
2. **Matières et lumière.** Appliquer le tableau ci-dessus, préparer UV et textures exportables. Réutiliser caisse et mannequins ; ne pas modéliser une nouvelle collection de vêtements. Produire un rendu au cadrage de référence, puis un GLB de la zone témoin. Garder enseigne, mannequins et produits indépendants du décor pour éviter les doublons et garder les données dynamiques.
3. **Vérification navigateur.** Intégrer seulement la zone témoin sur une branche de réalisation depuis `main` à jour. Comparer même angle, même heure et même viewport, puis téléphone. Ajuster les reflets selon le coût mesuré. Après validation de Rhamone, appliquer les finitions aux trois styles en gardant leurs différences et la génération paramétrique du mall.

Livrables de réalisation : `.blend` éditable et script dans `assets-src/`, GLB et textures optimisés dans `public/`, captures avant/après, lien réel de preview. Cette PR de plan contient seulement la note et les références ; aucun de ces livrables 3D n'est encore produit. Auteur des commits : Kelthen, sans signature supplémentaire.

## Réussite et contrôles

- Au téléphone, chaque mannequin apparaît **entier derrière le verre**, de part et d'autre de la grande entrée ; vitres au même niveau et même hauteur que l'entrée, socles ancrés au sol, aucun élément en travers du passage.
- Les trois types « enseigne / verrière / portique » restent reconnaissables ; colonnes du portique conservées. La marque provient des données, pas du numéro d'une boutique.
- Matériaux et lumière évoquent la cible ; aucune prétention d'identité pixel par pixel entre image, Blender et navigateur. Présenter tout écart visible avant de généraliser.
- Conserver les vitrines changeantes et le jour/soir existants pour donner de la vie. Aucun nouveau mouvement décoratif ajouté à ce lot.
- Réutiliser géométries/textures et charger les détails proches de la caméra comme aujourd'hui. Mesurer poids téléchargé, nombre d'appels de rendu et fluidité avant/après sur le même appareil ; éviter un reflet planaire et une ombre dynamique par boutique. Viser au moins 30 images/s sur le téléphone de test, à mesurer, sans le présenter comme garanti.
- Tester jour (`?heure=14`) et soir (`?heure=19`), téléphone et PC ; pas de mannequins cachés, surfaces qui clignotent ou verre opaque. Le verre ne change pas la cible tactile : toucher une vitrine ouvre toujours sa boutique ; entrée/sortie et retour téléphone conservés (L-44, L-45, L-49).
- Avant la PR de réalisation : `npm run check`, puis contrôles Walk téléphone/PC avec `npm run smoke`. Inclure les résultats et les limites matérielles du test. Rhamone valide la preview avant merge.

La PR de plan reste en brouillon et sera fermée quand le travail sera livré, conformément à la décision du 8 novembre ; les décisions et références utiles doivent être reprises dans la PR de réalisation.
