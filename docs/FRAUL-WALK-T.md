# Fraul Walk en T — plan à valider

> Statut : **CONSTRUIT** (2026-10-12), d'après le dessin de Rhamone. Choix par défaut
> ci-dessous à confirmer.
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
- Le dessin compte environ 25 vitrines : ça tombe pile sur nos **27 marques**.
  **Toutes les marques** ont donc leur boutique dans le mall, contre 8
  aujourd'hui.

## Le parcours

| Étape | Boutiques |
|---|---|
| On monte le tronc (côté droit) | 1 à 4 |
| Barre, mur du bas à droite | 5 à 7 |
| Bout droit | 8 à 10 |
| Mur du haut | 11 à 17 |
| Bout gauche | 18 à 20 |
| Barre, mur du bas à gauche | 21 à 23 |
| On redescend le tronc (l'autre côté) | 24 à 27, puis sortie |

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
  sont les 27 vitrines.

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
