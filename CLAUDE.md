# Fraul — contexte du projet (à lire avant de coder)

Langue de travail: **français**. Responsable: Rhamone (travaille souvent depuis son téléphone). Validation du plan avec Serge. Projet Kelthen.

## Le client et le but
Commerçant (Fraul) qui achète vêtements/chaussures en Chine et revend en Afrique de l'Ouest + diaspora (USA, Canada, UK, France, Belgique). Focus 100 % en ligne (boutiques physiques laissées de côté).
- **Prix personnalisés par client** via des groupes de remise (voir « Stratégie de prix » plus bas).
- **Fournisseur** a déjà son site: on récupère ses données produits et on les republie avec nos prix (flux fournisseur, plus tard).
- **Logistique**: une personne sur place expédie/reçoit et donne le code de tracking. À la commande, le fournisseur et le livreur voient la commande directement; le client suit via le code de tracking avec un suivi animé. Contrainte: fournisseur et livreur utilisent **WeChat**.
- Délais visés: USA/UK <10 j, Canada <14 j, France ~14 j.

## Stratégie de prix (proposition Serge, 12 oct. 2026 — à valider par Rhamone)
On reste sur une **vente e-commerce classique**. Le « privé » n'est qu'une couche plus tard, pas un deuxième site.

**1. Prix catalogue par zone (calculé, pas saisi à la main)**
- Prix = coût fournisseur (¥) × taux du jour + livraison au poids de la zone + droits/taxes estimés + marge de la zone, arrondi « propre » en devise locale (89 $, pas 87,43 $).
- Le prix catalogue est volontairement **haut**: c'est la base sur laquelle les remises s'appliquent.
- Zone devinée par IP (géolocalisation Vercel) pour l'affichage + sélecteur « Livrer en : … ». **L'adresse de livraison fait foi**: prix recalculé côté serveur au paiement (pas d'abus par VPN).
- Ajouter un pays = ajouter une ligne de paramètres (devise, livraison/kg, taxes, marge).

**2. Groupes de clients = remise attachée au compte**
- Chaque client est dans un groupe avec un % de remise (ex. VIP 10 %, Fidèle 25 %, Revendeur 40 % — pourcentages à fixer).
- La remise est liée au **compte** (numéro de téléphone vérifié par code SMS/WhatsApp, un numéro = un compte) et s'applique **automatiquement** une fois connecté. **Aucun code à taper** → rien à faire fuiter.
- Fraul peut changer le groupe d'un client à tout moment depuis son tableau de bord.

**3. Lancement par la clientèle WhatsApp existante de Fraul — deux sortes de liens**
- **Lien d'invitation personnel** (distribué par Fraul): le client contacte Fraul sur WhatsApp → Fraul touche « Inviter » dans le tableau de bord, choisit le groupe → lien unique (`fraul.com/i/K7P2Q`) collé dans la conversation → le client crée son compte → groupe attaché pour toujours. **Usage unique**: partagé, il ne sert à rien.
- **Lien de parrainage** (pour faire propager le site): chaque client a le sien. Le filleul a une **petite remise fixe** (ex. −10 % sur la 1re commande), le parrain gagne du crédit. Les grosses remises restent dans les mains de Fraul, qui peut faire monter un filleul de groupe plus tard.
- **Visiteur sans lien**: prix catalogue de sa zone + « −10 % sur ta 1re commande en créant un compte » (même remise que le parrainage).
- **Pas de code promo public ni de code par zone affiché sur le site.** Exception: codes influenceurs (petite remise, durée limitée, commission).
- Plus tard: génération des liens automatisée via l'API WhatsApp Business.

**Règles**
- **Pas de faux prix barrés** (« ~~300 $~~ 180 $ » si jamais vendu à 300 $): interdit au Canada, USA, France/UE (prix de référence = plus bas des 30 derniers jours), UK. Affichage: prix catalogue, puis « Votre prix : … » une fois connecté. Faire valider par un juriste avant le lancement.
- Garder des écarts de remise défendables (fidélité, volume, revendeur).

**À décider**: liste des groupes et leurs %, % de bienvenue/parrainage, crédit du parrain, marges par zone.

## Direction visuelle
Palette "old money": ink #0A0A0C, wine #420A0D, bordeaux #680209, ivory #FFFEF7, pearl #EAE0C8, stone #8F8880. Polices: Bodoni Moda (titres) + Montserrat. Référence: LuisaViaRoma. Haut de gamme, **beau mais léger** (performance mobile d'abord).

## État actuel: `index.html` (démo V2, une seule page)
- **Accueil e-commerce normal**: Nouveautés d'abord, puis marques, catégories, invitation Fraul Walk, suivi de commande.
- **Fraul Walk** (opt-in): mall 3D (three.js r128, chargé à la demande). La caméra reste dehors face aux vitrines; on entre **uniquement par un bouton** (une seule entrée).
- **Annuaire**: 27 marques A–Z avec recherche. Cliquer une marque (n'importe où) entre directement dans sa boutique.
- **Boutique = un seul gabarit** piloté par une ligne de données (`PRESET`, `brandStyle(name)`): couleurs, enseigne, mannequins portant le nom de la marque. Nouvelle marque = génération automatique.
- **Intérieur**: vue à hauteur d'yeux (pas de vue du dessus). Catégories T-shirts / Hoodies / Pantalons / Sneakers / Chapeaux / Accessoires; toucher une catégorie fait "marcher" la caméra (style GTA) vers le rayon. Les produits défilent **dans le rayon, en haut/centre** (l'article centré sort vers le spectateur), infos **en bas** (nom, prix, couleurs, tailles, ajout panier). Toucher l'article = gros plan qui tourne (face/dos).
- Techniques de légèreté: éclairage "baked" dans des textures canvas, instancing, rendu à la demande, boutique construite par marque et libérée au changement.

## Règles et erreurs à ne pas répéter
- Ne **pas** copier les logos de marques (marques déposées): enseignes en texte.
- Le cintre est **à l'intérieur** du vêtement. Mannequins de vitrine réalistes (tête ovale brillante sans visage, pose naturelle), pas des cylindres.
- Pas de double entrée en boutique; la caméra ne regarde pas le long du couloir mais **face aux vitrines**.
- Les vrais produits seront des **photos détourées** (face/dos); le code a déjà un crochet `img`.
- Pas de modèles 3D de vêtements: le "3D" = animations au scroll. Blender: plus tard.
- Méthode: **proposer le plan, le peaufiner ensemble, puis générer et tester**. Regrouper les changements, ne pas régénérer à chaque suggestion. Ne pas lancer de générations payantes (fal.ai) sans accord.
- Tester sur viewport téléphone (Playwright + headless chromium, `--use-gl=swiftshader`) avant de dire que c'est fini.

## Prochaines étapes probables
1. Retours de Rhamone/Serge sur la démo, traités en un seul lot.
2. Vraies photos produit détourées.
3. Passer d'un fichier unique à un vrai projet (catalogue en données, panier/commande réels).
4. Flux fournisseur + prix par zone et groupes de clients (voir « Stratégie de prix ») + suivi de commande (WeChat à trancher avec Serge).
5. Plan final versionné ici (Word/PDF), comme pour Network of Black Women.
