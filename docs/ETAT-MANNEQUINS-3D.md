# Où sont les mannequins 3D ?

Demande de Rhamone, 14 novembre : « Tu dois être clair où sont les 3d sur le git et tout ? »

## Trois livrables distincts

| Livrable | Où | État réel |
|---|---|---|
| Mannequins actuellement utilisés | `public/models/mannequin.glb`, `public/models/mannequin-femme.glb` sur `main` | Modèles du site ; la PR #127 propose de les remplacer par des versions posées issues des modèles existants. |
| Nouveaux prototypes ivoire | Cette branche, `assets-src/models/prototypes-ivoire/` | Deux vrais maillages statiques, homme et femme, avec exports GLB et fichiers Blender. Pas intégrés au Walk. |
| Personnages habillés look 06 et look 05 | Références photo dans #128 et `assets-src/references/mannequins-3d/` dans #127 | Les photos face/dos sont en 2D. Cette PR ne fournit PAS leur reconstruction 3D. La proposition fal.ai concerne ce travail distinct. |

Les prototypes ivoire étaient jusqu’ici uniquement dans le workspace `/workspace/shared/direction-personnages/`, pas sur GitHub. Un lien local ne donnait pas accès à ces modèles au Claude d'une autre session. Cette PR corrige la transmission.

## Fichiers à récupérer dans cette branche

- [Homme — Blender](../assets-src/models/prototypes-ivoire/homme-prototype.blend)
- [Homme — GLB](../assets-src/models/prototypes-ivoire/homme-prototype.glb)
- [Femme — Blender](../assets-src/models/prototypes-ivoire/femme-prototype.blend)
- [Femme — GLB](../assets-src/models/prototypes-ivoire/femme-prototype.glb)
- [Contrôle multi-angle des deux GLB](../assets-src/models/prototypes-ivoire/controle-3d.png)

Branche : `feat/gpt/sources-mannequins-3d`. Depuis un checkout du dépôt, après `git fetch origin`, lire/récupérer cette branche ; les fichiers ne sont pas encore sur `main`. Pour un téléchargement GitHub, utiliser « Download raw file » sur chaque fichier binaire, ou cloner la branche.

## Ce qui a réellement été vérifié

- Les deux GLB se chargent avec Three.js et s'importent dans Blender 4.3.2 ; les `.blend` ont été enregistrés après import.
- Homme : 22 743 sommets, 39 208 faces ; hauteur importée environ 1,80 m. Femme : 21 751 sommets, 38 092 faces ; hauteur importée environ 1,75 m.
- Chaque GLB pèse environ 3,3 Mo ; chaque `.blend` environ 6 Mo. Ces tailles ne constituent pas une validation de performance téléphone.
- Chaque modèle contient un seul maillage, zéro squelette de déformation et zéro animation. Les habits ne sont pas des objets interchangeables séparés.
- Les fichiers Blender sont des scènes importées éditables, pas des sources paramétriques avec historique de sculpture ou rig.

## Ce qui reste à faire

- La pose de travail bras légèrement écartés est encore dans ces modèles. La proposition de poses A validée par Rhamone (homme détendu, femme main sur hanche) n’a PAS été appliquée à ces fichiers.
- Vérifier orientation, anatomie des mains, plis, intersections, contact des semelles et largeur dans les vitrines.
- Pour les poser : préparer le squelette et ses poids, corriger les déformations, puis exporter une pose statique si le Walk n'a pas besoin d’animation.
- Pour changer leurs vêtements : séparer/reconstruire corps et habits ; le maillage vêtu monobloc ne suffit pas.
- Optimiser et tester dans une seule vitrine sur un vrai téléphone avant généralisation. Ne pas remplacer les modèles de `public/models/` à l'aveugle.

## Consigne pour Rhamone et Serge

La PR #127 travaille déjà les anciens mannequins et leurs poses : choisir explicitement si les prototypes ivoire ici apportent une meilleure base avant de les substituer. Éviter deux remplacements concurrents des mêmes fichiers.

Pour le look 06 (Stüssy/Acne, Timberland) et le look 05 (Trapstar rose, Air Max), une reconstruction 3D depuis les photos reste un nouveau travail. Utiliser les deux vues comme références, contrôler le profil, et ne pas annoncer un personnage articulé simplement parce qu’un GLB a été produit. Ne pas relancer la création des prototypes ivoire en pensant qu’ils n’existent pas.

Aucun modèle de production, moteur, prix ou donnée admin n’est modifié par cette PR. Les fichiers sont des sources à examiner, pas une validation visuelle finale ni une autorisation de merge.
