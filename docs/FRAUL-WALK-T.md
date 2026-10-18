# Fraul Walk en T — plan à valider

> Statut : **CONSTRUIT** (2026-10-12), d'après le dessin de Rhamone. Choix par défaut
> ci-dessous à confirmer.
> **Mis à jour le 2026-10-18** : le T est devenu un **mode de mall** parmi d'autres à venir, et il compte
> désormais **une vitrine par marque** (31 aujourd'hui). Voir « Modes de mall » plus bas.
> Plan vu du dessus : `docs/fraul-walk-plan-T.png`.

## Ce que j'ai compris

- Le mall a la forme d'un **T**. On **entre et on sort par le bas** du tronc
  (les deux flèches).
- On se promène **comme à pied** : on regarde **une boutique à la fois**, la
  caméra se tourne face à sa vitrine, puis on avance jusqu'à la suivante.
- On **fait le tour** : on monte le tronc, on fait le tour de la barre du T,
  puis on redescend de l'autre côté du tronc jusqu'à la sortie. Les vitrines
  restent **toujours du même côté** (à droite), donc on voit chaque boutique
  exactement une fois.
- Au **milieu de la barre** (le rouge du dessin) : une **pièce centrale**, un
  grand « F » Fraul sculpté sur un socle, entouré d'arbres en pot.
- Le dessin comptait environ 25 vitrines : le T a été construit pour nos 27 marques
  de départ. **Toutes les marques** ont leur boutique dans le mall : avec 31 marques
  (ajout de Travis Scott, Saint Michael, ERD, Polo Ralph Lauren), le T s'allonge tout seul.

## Le parcours

Avec les 31 marques d'aujourd'hui :

| Étape | Boutiques |
|---|---|
| On monte le tronc (côté droit) | 1 à 5 |
| Barre, mur du bas à droite | 6 à 8 |
| Bout droit | 9 à 11 |
| Mur du haut | 12 à 20 |
| Bout gauche | 21 à 23 |
| Barre, mur du bas à gauche | 24 à 26 |
| On redescend le tronc (l'autre côté) | 27 à 31, puis sortie |

(Plan de départ à 27 : tronc 4 + 4, mur du haut 7.)

## Entrée (2026-10-18)

- Au bas du tronc : **deux portes en verre** avec « WELCOME TO / FRAUL CENTER » gravé dessus. Elles
  s'écartent quand on approche (le texte se coupe en deux), en entrant comme en sortant.
- Fichiers : `src/walk/views/entrance.ts` (portes, distance d'ouverture) et `src/content/walk.ts` (texte).

## Fraul Finds, pièces sur demande (2026-10-18)

- Arrêt du parcours **vers la 10e boutique** (après le 2e arrêt du bout droit de la barre), face au comptoir « Fraul Finds · Sur demande » posé à droite du grand « F » ; le toucher ouvre le formulaire (il passe devant les vitrines cachées derrière) (`concierge` dans le plan du mode ; `AT_CONCIERGE` dans `src/walk/models/walk-path.ts`). Comptoir 3D : `src/walk/views/concierge.ts` ; enseigne : `CONCIERGE_TEXT` dans `src/content/walk.ts`.
- « Demande une pièce » ouvre le formulaire par-dessus le mall (couche « concierge » : le retour du téléphone la ferme). Même formulaire sur `/sur-demande`.

## Comment on s'y déplace

- **Glisser / faire défiler** = avancer ou reculer le long du parcours. La
  caméra s'arrête face à chaque vitrine et tourne aux angles du T.
- Boutons **‹ ›** = boutique précédente / suivante.
- **Entrer dans la boutique** = la même boutique 3D qu'aujourd'hui (rayons,
  articles qui sortent du rayon, ajout au panier).
- La pièce centrale reste visible depuis toute la barre, comme repère.

## Technique (pour que ça reste fluide sur téléphone)

- Le T est construit une fois. Les boutiques **loin de la caméra** sont
  simplifiées (sans mannequins ni enseigne détaillée) et seules les plus
  proches sont dessinées en détail.
- Même gabarit de boutique qu'aujourd'hui (une ligne de données par marque).
- Le parcours est une courbe : défiler = avancer sur la courbe ; les arrêts
  sont les vitrines, une par marque.

## Modes de mall (2026-10-18)

- La **forme** du mall est un « mode ». Les modes sont dans `src/walk/modes/` :
  - `t.ts` : le mode T (seul mode pour l'instant). Sa fonction `layoutT(n)` place n vitrines.
  - `index.ts` : la liste des modes et `DEFAULT_MODE` (le mode utilisé par le site).
- Le **nombre de boutiques** vient de la liste des marques (`WALK_BRANDS`,
  `src/lib/catalog/brands.ts`). Rien n'est écrit en dur ailleurs.
- Quand il y a plus de 27 marques, le T grandit à tour de rôle : une vitrine de chaque
  côté du tronc (le tronc s'allonge de 8,5 m), puis deux au mur du haut (la barre
  s'élargit). 29 marques = tronc 5 + 5 ; 31 = tronc 5 + 5 et mur du haut 9 ; 35 = tronc 6 + 6 et mur du haut 11.
- Mesures communes (largeur d'une vitrine, hauteur sous plafond) : `src/walk/models/mall-layout.ts`.
- **Ajouter une autre forme** (ex. un mall en L ou en cercle) : un nouveau fichier dans
  `src/walk/modes/` avec sa fonction `layout(n)`, plus la construction de ses murs et de son sol
  dans le moteur (aujourd'hui `engine.js` sait construire le T). Puis une ligne dans `MODES`.

## Gestes (décidés par Rhamone)

- **Toucher une vitrine** = entrer dans la boutique (le défilement en avant n'entre jamais).
- Dans la boutique, **défiler en arrière** (molette vers le haut, ou glisser vers le bas) :
  dans un rayon → retour au centre ; au centre → sortie. Le bouton « Sortir » reste là.

## Choix par défaut, à confirmer

1. **Sens du tour** : vitrines toujours **à droite** (comme sur le plan) ?
2. **Pièce centrale** : grand « F » sculpté + arbres en pot ? Ou plutôt une
   fontaine, une grande plante, un écran du drop en cours ?
3. **Ordre des marques** : alphabétique, ou les marques phares au début du
   tronc (là où tout le monde passe) ?
