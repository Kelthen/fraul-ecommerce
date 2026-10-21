# STATUS.md — État partagé du projet Fraul e-commerce

> **Seul fichier d'état du projet.** Lu au démarrage de chaque session, mis à jour **dans chaque PR**.
> Écrit pour des humains : phrases courtes, pas de jargon. Une ligne = un élément.

_Dernière mise à jour : 2026-10-21 par rhamon (fiche : « Fermer » après un retour au Walk)_

> **Serge / Claude de Serge : commencez par `docs/POUR-SERGE.md`** (ce qui vous attend dans votre zone + nos demandes d'avis, 18 oct. 2026).

**Preview :** https://fraul-ecommerce.vercel.app (Vercel, équipe Kelthen ; Google bloqué tant que le site n'est pas lancé)

---

## Infos client (confirmées au kickoff)

| Clé | Valeur | Confirmé le |
|---|---|---|
| Client | Fraul (commerçant, vêtements et chaussures achetés en Chine) | 2026-10-12 |
| Localisation affichée | **Aucune** : aucun pays affiché sur le site | 2026-10-12 (Rhamone) |
| Pays de livraison (logistique, non affiché) | USA, Canada, Royaume-Uni, France, Belgique | 2026-10-12 (Rhamone) |
| Fuseau horaire | [À FOURNIR] | |
| Langue du site | Français (anglais prévu) | 2026-10-12 |
| Email / téléphone publics | [À FOURNIR] | |
| Domaine | [À FOURNIR] | |
| Source des données | Code : 23 vrais produits avec photos (`src/lib/catalog/supplier.ts`, généré par `scripts/import-catalogue.mjs` depuis le classement de Rhamone, coûts **fictifs**) + catalogue de démo (`src/lib/catalog/demo.ts`). Base Supabase créée mais vide et pas encore branchée | 2026-10-18 |
| Base de données | Supabase, projet `fraul` (`rqrdccsxyyufqlenmpct`, USA Est), plan gratuit, organisation « kelthenrift-prog's Org » — Serge pas encore membre | 2026-10-13 |

## ✅ En ligne (preview, pas encore en production)

- Règles de démarrage + kit NBW (CLAUDE.md, STATUS.md, LESSONS.md, briefing, modèle de PR, notifications, script photos) — rhamon
- Architecture cible — `docs/ARCHITECTURE.md`
- Site Next.js : accueil = entrée du mall, marques, catégories, fiche produit, Crée ta tenue, panier, suivi, pages légales (squelettes)
- Fraul Walk en T : **une boutique par marque (31)**, le T s'allonge tout seul ; la forme du mall est un « mode » (`src/walk/modes/`, le T aujourd'hui), version claire, toucher la vitrine pour entrer, défiler en arrière pour sortir — `docs/FRAUL-WALK-T.md`
- Schéma de base de données vide, sécurité ligne par ligne testée — `supabase/migrations/`
- Supabase : migration **0003 emplacements de tenue** appliquée (cap, glasses, neck, watch, layer, socks), alignée sur `src/lib/catalog/types.ts` — serge
- Projet Supabase `fraul` créé (USA Est, gratuit) ; migrations 0001 (schéma) et 0002 (sécurité des fonctions) appliquées ; contrôle de sécurité Supabase : seul reste le suivi public par lien, voulu — rhamon
- Page Marques : grille de pastilles rectangulaires aux coins légèrement arrondis (3 par ligne sur téléphone, 6 sur ordinateur), nom de la marque en texte avec le style de son enseigne, recherche gardée, lien « Voir la boutique » (boutique dans le Walk) sous chaque marque. Composant unique `BrandTile` (variante `grid` ; l'accueil garde ses pavés) — rhamon
- **Fraul Finds, une pièce sur demande** (chantier D, ex-« Conciergerie ») : nouvel arrêt du mall **vers la 10e boutique** (au bout droit de la barre, on se retourne vers le centre), face à un comptoir au pied du grand « F » (« Fraul Finds · Sur demande ») ; **toucher le comptoir** ou le bouton « Demande une pièce » → formulaire par-dessus le mall (le retour du téléphone le ferme). Aussi : lien « Une pièce introuvable ? » sous chaque vitrine, page `/sur-demande` (lien dans le pied de page). Formulaire : article, marque, taille, lien, e-mail, précisions ; vérifié (champ piège anti-robot, longueurs, liens https) ; **démo : rien n'est envoyé**. Proposition pour Serge : `docs/FOURNISSEURS-MULTIPLES.md` (plusieurs fournisseurs par article, personne de l'expédition, table des demandes ; SQL proposé, non appliqué) — rhamon
- **Vitrines vivantes + heure du jour** (chantier F) : dans chaque vitrine du mall, deux cadres montrent les pièces phares de la marque (vraies photos d'abord, sinon dessins) et changent toutes les 5 s quand on est devant (rien qui bouge si le téléphone demande moins d'animations). **Lumière selon l'heure locale du visiteur** : jour comme aujourd'hui ; dès 17 h elle baisse et se réchauffe ; à 19 h plus sombre et éclairé (vitrines et plafonniers restent allumés) ; la nuit, sombre mais jamais noir. Essai à une autre heure sur la preview : `/walk?heure=19` — rhamon
- **Envies** (chantier E, 1re partie) : bouton cœur **« Envie »** sur la fiche produit et dans la fiche en grand du mall ; cœur avec le nombre dans l'en-tête ; page **« Mes envies »** (`/envies`, « Gardé de côté ») : les pièces gardées, du plus récent au plus ancien, retirables d'un geste. Gardées sur le téléphone pour l'instant (synchro avec le compte quand les comptes seront branchés ; prix toujours recalculé, jamais figé). Dans la fiche en grand, « Ajouter au panier » → « Au panier » pour que tout tienne sur un téléphone — rhamon
- **Comptes (démo, front-end seulement)** (chantier E, 2e partie) : icône compte dans l'en-tête → `/compte` (aussi `/connexion`). Créer un compte : e-mail + mot de passe (10 caractères mini, refus des mots de passe courants ou contenant l'e-mail) → **code à 6 chiffres par e-mail** (démo : code affiché, aucun e-mail envoyé ; 5 erreurs = une minute d'attente). Se connecter, mot de passe oublié (code puis nouveau mot de passe). « Mon compte » : commandes (vide), e-mails (nouveautés **décochées par défaut**), se déconnecter. Aucun mot de passe gardé, même dans le navigateur. Branchement (Supabase Auth, Turnstile, limites) : zone de Serge, `docs/POUR-SERGE.md` §2.4 — rhamon
- **Fiche en grand** (chantier B) : dans une boutique du Walk, toucher l'article devant soi (ou « En grand ») ouvre sa fiche par-dessus la boutique : toutes ses photos (face, dos, autant de détails qu'il y en a), on glisse de l'une à l'autre, compteur « 2 / 6 », miniatures, toucher pour zoomer ; taille, « Au panier », « Fiche complète ». En dessous, **12 propositions au plus, 3 par rangée** : autres articles du même rayon de la marque, « Complète la tenue » (autres rayons de la marque), puis les autres boutiques. Toucher une proposition l'affiche et le portant suit. Le retour du téléphone ferme la fiche. Mêmes galerie et propositions sur la fiche produit. « Zoom » s'appelle maintenant « Tourner » (gros plan 3D) — rhamon
- **Entrer / sortir sans attendre** : toucher une vitrine → fondu de 0,15 s → directement au centre de la boutique, devant les rayons (plus de zoom ni de marche ; la boutique regardée se prépare en coulisse) ; « Sortir » ou le retour du téléphone → retour immédiat face à la même vitrine ; trajet vers un rayon : 0,5 s au plus. Chargement du mall : plus d'attente minimale, écran (habit qui tourne, proposition) seulement si ça dure plus de 0,2 s. Mesuré dans le navigateur de test (3D sans carte graphique, bien plus lent qu'un téléphone) : entrer 4,4 s → 0,8 s, rayon 2,6 s → 1,4 s, sortir 3,7 s → instantané — rhamon
- **Raccourcis du mall** : bouton **« Chercher »** en haut du mall (une marque, ou une pièce : « hoodie », « basket », « sac »… mène droit au rayon de chaque boutique qui en a, vraies photos d'abord) ; **en revenant, on reprend à la dernière boutique regardée** (14 jours, sur ce téléphone), pas besoin de refaire le tour ; **moins de texte** : chaque aide (« Touche la vitrine », « Choisis un rayon », « Glisse… », « Fais défiler vers l'arrière… ») disparaît dès que le geste a été fait une fois — rhamon
- Boutiques du Walk : photos des vrais produits nettes (512 px sur le portant, 1024 px quand on zoome ; la finesse reste limitée par la photo d'origine) — rhamon
- Boutiques du Walk : les vrais produits s'affichent avec leur photo sur le cintre (carte produit, face / dos), en premier dans le rayon et en grand avec « Zoom » ; vitrine à accessoires rehaussée, les sacs sont bien dans le verre — rhamon
- Photos réelles (test de rendu, pas pour la mise en ligne) : 35 captures du fournisseur classées par Rhamone → 23 produits (les ensembles Tech Fleece et Polo Ralph Lauren sont séparés en veste + pantalon, la photo « ensemble » sert de détail). Fiche produit : face / dos / détail, toucher pour agrandir. En tête des Nouveautés de l'accueil. Dans le Walk, la photo s'affiche dans une carte sur le cintre (pas encore détourée) — rhamon
- Entrée du mall : deux portes en verre « WELCOME TO / FRAUL CENTER » qui s'écartent à l'approche (le texte se coupe en deux), en entrant comme en sortant — `src/walk/views/entrance.ts`, texte dans `src/content/walk.ts` — rhamon
- 4 nouvelles marques : Travis Scott, Saint Michael, ERD, Polo Ralph Lauren (style d'enseigne, seulement leurs vrais produits), **dans l'annuaire et dans le mall** (boutiques 28 à 31). Une boutique 3D n'affiche que les rayons qui ont des articles — rhamon
- Catégories : 12 au lieu de 6 (ajout Vestes et manteaux, Shorts, Chaussettes, Lunettes, Montres, Bijoux ; « Chapeaux » → « Casquettes », ancien lien redirigé ; « Hoodies » → « Hoodies et sweats »). Dessins provisoires, coûts de démo. Dans le Walk, seuls les rayons qui ont un portant s'affichent (nouveaux portants : plus tard) — rhamon
- Prix par zone et par groupe, mode test, page /test/prix (PR #2) ; MVC étape 1 : modèles du Walk (PR #5)
- PR #1 mergée : fondations, Walk, bouton retour, plan MVC, stratégie de prix notée
- Walk : le bouton retour du téléphone ferme la couche ouverte (annuaire, zoom, rayon, boutique) puis quitte le mall ; focus gardé dans la fenêtre ouverte, Échap ferme, focus rendu au bouton d'origine — testé dans `npm run smoke`

- **Rayons du Walk : la photo en grand** (retour de Rhamone, 19 oct.) : l'article choisi vient près de soi et occupe environ 70 % de la largeur ; nom sur une ligne, plus petit ; plus de « Glisse pour défiler… » ; rayon sneakers recentré (l'article choisi était décalé à gauche) ; **chaque boutique propose les mêmes 6 rayons**, même vides : un rayon vide dit « Rien ici pour l'instant. » et propose le même rayon chez d'autres marques (choix b de Rhamone, 20 oct.) ; **plus de lien Fraul Finds ni d'aide « défiler pour sortir » dans les boutiques** (même gabarit partout ; Fraul Finds reste dans le mall) ; en haut de la boutique, **un retour ← (sortir) et une loupe (chercher)** au lieu du bouton « Sortir » (Rhamone, 20 oct.) — rhamon
- **Walk sur PC** (retour de Rhamone, 21 oct.) : image limitée à ~2,4 millions de points (un grand écran ne fait plus ramer la carte graphique ; téléphone inchangé) ; si la carte graphique décroche, l'affichage repart seul, sinon version sans 3D au lieu d'un écran blanc ; une molette qui fait sortir d'une boutique ne fait plus défiler le mall vers une autre boutique. Test PC (1920 et 2560 px) ajouté au test automatique. Garde-fou Git : un commit signé « Claude » est refusé, l'auteur est toujours Kelthen — rhamon
- **Retour au Walk après une autre page** (ex. « Fiche complète » puis retour) : on revient vraiment dans la boutique et le rayon où l'on était, et tout répond (avant : écran figé, « Fermer » ne marchait plus ; vu par Rhamone le 21 oct.) — rhamon
- **Suivi de commande côté client** (zone de Rhamone, `docs/PARCOURS-COMMANDE.md` §7 de la PR #26) : page `/suivi` en **4 étapes** (Payée → En cours de traitement → En transit → Livrée), une **phrase qui change** sur l'étape en cours, **livraison prévue en fourchette** (« entre le 21 et le 24 oct. »), ligne « plus disponible, remboursée » si une pièce manque ; **4 e-mails** (Payée, En transit, Livrée, Article indisponible) visibles sur `/suivi/e-mails`, **jamais envoyés** ; **Mon compte → Mes commandes** ; dans **Mes envies**, une pièce qui n'est plus en vente reste affichée « Plus disponible » avec un lien vers Fraul Finds. Démo : 3 commandes d'exemple (FRL-1042, FRL-1031, FRL-1017). Délais par zone « décidé par l'équipe, à confirmer » (`src/models/orders/tracking.ts`) — rhamon

## 🔄 En cours

| Quoi | Qui | Branche / PR | Depuis |
|---|---|---|---|
| Super centre, chantiers C à F : Caisse à la sortie + sac qui se remplit, Fraul Finds « Sur demande » (+ proposition fournisseurs multiples pour Serge), envies puis comptes, vitrines vivantes, heure du jour | rhamon | une PR par chantier | 2026-10-18 |

## 🆕 À faire (par priorité)

1. Plan MVC validé par Serge le 13 oct. (`docs/PLAN-MVC.md`) → étapes 1 et 2 en ligne (PR #5, #6) ; ensuite étapes 3 et 4 (vues 3D, contrôleurs du mall)
2. Rhamone essaie la preview et confirme les choix par défaut du mall (voir Décisions)
3. Brancher Slack : secret `SLACK_WEBHOOK_URL` dans GitHub (voir `playbook/README.md`) — rhamon
4. Plan en 6 chantiers de Rhamone (17 oct.), une PR chacun, dans cet ordre : ✅ catégories → ✅ photos du fournisseur (+ 4 marques dans l'annuaire) → ✅ modes de mall (31 boutiques) → ✅ portes vitrées d'entrée → ✅ page Marques en pastilles → Crée ta tenue en 3D (prototype puis version complète) → comptes, suivi et e-mails — rhamon
5. Docs : retirer WhatsApp de CLAUDE.md §9, ARCHITECTURE.md (texte proposé dans la conversation du 17 oct.) — rhamon
6. Plusieurs fournisseurs + Fraul Finds : **Serge a validé le 18 oct.** avec 2 corrections de sécurité, intégrées dans `docs/FOURNISSEURS-MULTIPLES.md` (migration **0004**). Reste : écrire les tests RLS listés, puis appliquer la 0004 (Rhamone ou Serge)
7. Plus tard : retirer `customers.whatsapp` et le canal `whatsapp` (validé par Serge le 18 oct.)
8. Supabase : inviter Serge dans l'organisation, puis brancher le site (variables d'environnement dans Vercel) — rhamon
9. Paiement Stripe en mode test
10. Vraies photos produit détourées (via `scripts/optimize-images.mjs`)
11. Fournisseur + commandes + WeChat : valider `docs/FOURNISSEUR-COMMANDES.md` (3 questions en fin), puis obtenir de Fraul le lien du site fournisseur — Serge

## ⏳ Bloqué — attend le client

| Élément attendu | Demandé le | Relancé le |
|---|---|---|
| Logo, textes, liste des produits et prix | — | — |
| Photos produits | — | — |
| Factures fournisseur des marques (à archiver, non bloquant) | — | — |
| Pays de l'entreprise (avant lancement ; Stripe Atlas possible) | — | — |
| Photos en meilleure qualité (originaux) : Trapstar hoodie noir, hoodie logo rouge, polo noir/or, short gris, doudoune longue ; Polo Ralph Lauren (les deux ensembles). Vues manquantes : Tech Fleece marron (ensemble, dos), Polo Inter (4 vues). Saint Michael : mention © à recadrer avant mise en ligne. Short Travis Scott : vue de dos à confirmer | 2026-10-18 | — |
| Lien du site du fournisseur (ou plateforme : Yupoo, 1688…), son accord pour reprendre fiches et photos, fichier Excel s'il en a un | 2026-10-13 | — |
| Ligne de livraison DDP (droits payés) chez le livreur/transitaire ; IOSS (UE) et TVA UK avec un comptable — avant lancement | 2026-10-13 | — |
| Prix : liste des groupes et leurs %, % de bienvenue/parrainage, crédit du parrain, marges par zone, marge minimale (R5) | 2026-10-12 | — |

## 🧭 Décisions (ne pas revenir dessus sans accord)

| Date | Décision | Source |
|---|---|---|
| 2026-10-19 | **Parcours de commande validé par Rhamone** (✅ avec ses ajouts : phrase + fourchette de livraison, fiche minimale par lien qui expire avec image en secours, bot verrouillé sur le compte de Jean Paul, blocs à copier en chinois/bilingue). **Plan B (retards, changement de fournisseur, remboursements) et paiement des fournisseurs : à la fin** (Serge). Alerte à Fraul à 4 jours si un colis fournisseur manque. | Serge + Rhamone |
| 2026-10-19 | **Parcours d'une commande** (`docs/PARCOURS-COMMANDE.md`) : le site envoie chaque commande à **Fraul sur Telegram** ; Fraul transfère à chaque fournisseur un bloc sans prix ni adresse client ; les fournisseurs envoient leurs colis à **un seul expéditeur** (ami de Fraul) qui **regroupe** et donne **un seul code de suivi par client**. Client : Payée → En cours de traitement → En transit → Livrée. Niveaux 1 à 3 pour grandir sans déborder Fraul. Remplace le portail fournisseur WeChat. **Telegram confirmé ; le code de suivi passe par Fraul** (couple « FRL → code », carte de vérification, ✅ Confirmer, code unique) ; l'adresse arrive chez l'expéditeur par une **fiche d'expédition** transférée par Fraul. | Serge |
| 2026-10-19 | **Parcours de commande (PR #26 de Serge) : ✅ de Rhamone sur l'ensemble.** Telegram sert **seulement à Jean Paul** (CEO de Fraul) : il reçoit chaque commande et transfère les blocs aux fournisseurs et à l'expéditeur **sur WeChat** ; le bot ne répond qu'à son compte. **WeChat traduit tout seul** : pas de version chinoise, mais des blocs courts, avec le code article du fournisseur, une photo, tailles et quantités en chiffres. Livraison affichée en **fourchette** ; alerte à Jean Paul si un fournisseur n'a pas livré l'expéditeur **après 4 jours** ; plan B (changer de fournisseur, 3 choix au client, remboursement) et argent (remboursements, paiement des fournisseurs) **à la fin**. Répartition : Rhamone = suivi client et e-mails ; Serge = bot Telegram, tableau de bord des commandes, fiche d'expédition. | Rhamone + Serge (#26) |
| 2026-10-18 | « Conciergerie » trop banal : le comptoir s'appelle **Fraul Finds**, avec « **Sur demande** » en sous-titre ; page `/sur-demande`. **Vocabulaire du site : cool, classe, posé, jamais vieillot** (règle L-43). Bouton pour garder un article : **« Envie »** (liste « Mes envies »). | Rhamone |
| 2026-10-18 | **Serge valide** : emplacements de tenue (`outfit_slot` + cap, glasses, neck, watch, layer, socks) appliqué le 18 oct. (migration 0003) ; **plus de WhatsApp, tout par e-mail** (remplace R3), avec un lien d'invitation **copiable** pour que Fraul puisse aussi le coller dans WhatsApp, `phone` reste facultatif ; e-mails : service Supabase en test, **Resend** au lancement. | Serge |
| 2026-10-18 | **Plusieurs fournisseurs (#18) : ✅ sur le principe.** Offre proposée par le site, **confirmée par Fraul** au début ; prix affiché sur le **fournisseur de référence** ; expédition via le lien WeChat qui ouvre un compte `courier` sans mot de passe. **Avant d'appliquer sa migration (à numéroter 0004) :** le fournisseur ne doit pas voir `unit_price`/`unit_cost` (vue limitée) et chaque livreur ne voit que ses envois (remplacer les politiques « livreur » de 0001). Détail : commentaire de Serge sur la #18. | Serge |
| 2026-10-18 | Bouton pour garder une pièce : **« Envie »**, liste **« Mes envies »**. | Rhamone |
| 2026-10-18 | **« C'est un site, pas un film »** : le Walk doit épater sans saouler. Entrer et sortir d'une boutique sans marcher (fondu 0,15 s), trajets vers les rayons de 0,5 s au plus, chargement sans attente inutile ; écran de chargement à redessiner (idée de Rhamone : un habit qui tourne). Règle pour la suite : aucune animation de plus d'une seconde entre un toucher et les produits (L-45). | Rhamone |
| 2026-10-18 | Validé par Rhamone : **recherche en haut du mall**, **reprise à la dernière boutique** (pas besoin de refaire le tour), **moins de texte**. Photos détourées : Rhamone négocie avec le fournisseur, on verra après. Écran de chargement : Rhamone veut le redessiner (idée : un habit qui tourne, 0,2 s). | Rhamone |
| 2026-10-18 | **Plusieurs fournisseurs** (ex. 10 pour Nike) et **une personne à part pour l'expédition**. Pour chaque article, on doit retrouver en interne quel fournisseur le vend ; le client ne voit jamais les fournisseurs. Proposition à écrire pour Serge (zone fournisseur / SQL). | Rhamone |
| 2026-10-18 | **« Super centre »** : on fait la **Caisse à la sortie** (près des portes) + **sac qui se remplit**, la **Conciergerie au centre = « Demande un article »** (on va le chercher chez les fournisseurs), les **vitrines vivantes** (photo du produit phare), l'**heure du jour** (lumière selon l'heure locale du visiteur : à 19 h, plus sombre et éclairé, jamais noir). Plus tard : drop au centre, Penderie, « devenir partenaire ». Non : musique automatique, passants animés, faux compteurs (« 12 personnes regardent »), mini-plan. | Rhamone |
| 2026-10-18 | Ordre des prochains chantiers : A photos nettes → B fiche en grand dans la boutique → C Caisse + sac → D Conciergerie « Demande un article » (+ proposition fournisseurs multiples pour Serge) → E envies puis comptes → F vitrines vivantes ; heure du jour à placer. | Rhamone |
| 2026-10-18 | Page Marques : pastilles **rectangulaires**, coins légèrement arrondis (pas de cercles) ; le lien sous chaque marque s'appelle **« Voir la boutique »** (au lieu de « Dans le mall »). | Rhamone |
| 2026-10-17 | **Plus de WhatsApp sur le site** (connexion, vérification, relances) : tout passe par e-mail. Bienvenue limitée par e-mail, adresse et carte. Les liens d'invitation de Fraul partent par e-mail depuis son tableau de bord. **Remplace R3, validé par Serge le 13 oct. : discussion ouverte**, Serge peut répondre. | Rhamone |
| 2026-10-17 | **Connexion : e-mail + mot de passe, avec code par e-mail** (vérification de l'e-mail, mot de passe oublié). Sécurité partout : RLS, captcha (Turnstile) et limitation des essais, protection contre l'injection de prompt si un assistant IA est ajouté (ARCHITECTURE §4-5). | Rhamone |
| 2026-10-17 | Pas de logos de marques : nom en texte avec le style d'enseigne (inchangé). | Rhamone |
| 2026-10-17 | **Crée ta tenue en 3D**, avec une liste 2D toujours utilisable (3D chargée à la demande). Zoom automatique sur la pièce choisie (montre → poignet, lunettes → visage, collier → cou…), puis le client choisit : « Vue d'ensemble », pincer, tourner. | Rhamone |
| 2026-10-17 | Catégorie **Bijoux** ajoutée (emplacement cou dans la tenue). | Rhamone |
| 2026-10-17 | Le mall devra accueillir **plusieurs modes** (formes) ; le T est le premier. Le nombre de boutiques vient de la liste des marques. | Rhamone |
| 2026-10-17 | **Entrée du mall : portes en verre qui coulissent en deux**, avec « Welcome to Fraul Center » gravé sur les portes (le texte s'ouvre avec elles). | Rhamone |
| 2026-10-13 | **Supabase en plan gratuit** (2 projets actifs max) : le projet `kelthen-social-publishing` est **mis en pause** pour faire place à `fraul`. Le relancer obligera à en mettre un autre en pause. | Rhamone |
| 2026-10-13 | **Plan MVC validé** : on garde Next.js, rangement MVC, Walk = cœur du site avec liste en repli, `/marques/:slug`, on démarre par l'étape 1. | Serge |
| 2026-10-13 | **Droits de douane payés par le client mais inclus dans le prix affiché (DDP)** : « Droits et taxes inclus », rien à payer à la livraison. | Serge |
| 2026-10-13 | **WeChat : lien portail maintenant** (lien personnel épinglé dans WeChat, interface en chinois, bouton « Copier pour WeChat »), **robot WeCom plus tard**. Détail : `docs/FOURNISSEUR-COMMANDES.md`. | Serge |
| 2026-10-13 | **Lancement sur USA, Canada, Royaume-Uni, France, Belgique seulement.** L'Afrique (dont l'Afrique de l'Ouest) est mise de côté pour le moment, à revoir plus tard. | Serge |
| 2026-10-13 | **Serge valide R1 à R6.** Précisions : devise affichée en code (USD/CAD/GBP/EUR) car « $ » est ambigu ; marge minimale de test 20 %. **À corriger dans la PR #2 avant merge :** l'arrondi toujours vers le bas fausse les remises sur les petits prix (VIP = Fidèle à 29 sur un article à 39) → arrondi au plus proche. Détail dans CLAUDE.md §9. ✅ Corrigé dans la PR #2 (mergée le 13 oct.) : arrondi au plus proche, code de devise, « Droits et taxes inclus ». | Serge |
| 2026-10-12 | **Stratégie de prix de Serge : accord de Rhamone sur l'ensemble** (CLAUDE.md §9). Ses points R1 à R6 sont des **contre-propositions ouvertes** : Serge peut répondre ; Rhamone commence à construire sur cette base en attendant. | Serge + Rhamone, discussion ouverte |
| 2026-10-12 | Contre-propositions de Rhamone (détail et raisons dans CLAUDE.md §9) : ⛔ R1 pas de sélecteur « Livrer en » (aucun pays affiché) · ➕ R2 ligne « Prix final confirmé selon l'adresse de livraison » · ➕ R3 code WhatsApp d'abord, bienvenue limitée par numéro/adresse/carte · ⛔ R4 connecté = seulement son prix · ➕ R5 prix plancher · ➕ R6 lancement zones + 2-3 groupes + invitations. | Rhamone |
| 2026-10-12 | Réécriture de `main` pour retirer les anciens « Co-Authored-By » : **mise de côté** (compliquée, Serge devrait resynchroniser). Les nouveaux commits sont nettoyés automatiquement par `.githooks/commit-msg`. | Rhamone |
| 2026-10-12 | **Aucune trace d'IA** dans Git et GitHub : pas de « Co-Authored-By », « Generated with… », lien de session ; auteur des commits = Kelthen. | Rhamone |
| 2026-10-12 | Pas de vocabulaire « 3D / shopping immersif » ni de chiffres (« 27 marques ») en accueil : on parle vente (authenticité, drops, suivi, paiement sécurisé). | Rhamone |
| 2026-10-12 | Kit de démarrage = celui de NBW (`playbook/`), branches `feat/<dev>/<sujet>`, modèle de PR avec résumé pour l'équipe. | Rhamone |
| 2026-10-12 | Pas de mini-plan du T affiché dans le mall. | Rhamone |
| 2026-10-12 | Site **en clair** (blanc ivoire dominant, autres couleurs en accent) : le sombre ne met pas les vêtements en valeur. | Rhamone |
| 2026-10-12 | Walk : **toucher la vitrine = entrer** ; **défiler en arrière = sortir** (rayon → centre → sortie) ; le défilement en avant n'entre jamais. | Rhamone |
| 2026-10-12 | Mall en T : vitrines à droite, « F » sculpté + arbres au centre, marques phares en premier. | équipe, à confirmer |
| 2026-10-12 | **Le Fraul Walk est le cœur du site** (shopping immersif), pas une option. | Rhamone |
| 2026-10-12 | **Aucun pays affiché** sur le site (jugé discriminatoire). | Rhamone |
| 2026-10-12 | Mall en forme de **T** : entrée/sortie en bas, une boutique à la fois, on fait le tour ; élément central au milieu. | Rhamone |
| 2026-10-12 | On démarre en sur mesure (option A) ; base vide, données de démo. | Rhamone |
| 2026-10-12 | On construit tout d'abord en **mode test** (Stripe test, éventuelle boutique de dev Shopify) ; les démarches administratives (entreprise, compte Stripe réel, taxes, juridique) passent dans la checklist **avant lancement**, non bloquantes. | Rhamone |
| 2026-10-12 | Produits authentiques, confirmé par Rhamone. Garder les factures fournisseur (Stripe peut les demander). | Rhamone |
| 2026-10-12 | Afrique de l'Ouest retirée du projet : pays servis = USA, Canada, UK, France, Belgique. Plus de mobile money. | Rhamone |
| 2026-10-12 | Les deux CLAUDE.md (règles d'équipe + contexte client) fusionnés en un seul. | équipe, à confirmer |
| 2026-10-12 | On ne bloque pas le démarrage sur le client (voyage souvent) ; placeholders marqués et questions regroupées. | équipe |
