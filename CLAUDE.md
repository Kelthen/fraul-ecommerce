# Fraul — contexte du projet (à lire avant de coder)

Langue de travail: **français**. Responsable: Rhamone (travaille souvent depuis son téléphone). Validation du plan avec Serge. Projet Kelthen.

## Le client et le but
Commerçant (Fraul) qui achète vêtements/chaussures en Chine et revend en Afrique de l'Ouest + diaspora (USA, Canada, UK, France, Belgique). Focus 100 % en ligne (boutiques physiques laissées de côté).
- **Prix personnalisés par client**, pas de prix fixe. Visiteurs anonymes: pays inconnu, prix à adapter plus tard.
- **Fournisseur** a déjà son site: on récupère ses données produits et on les republie avec nos prix (flux fournisseur, plus tard).
- **Logistique**: une personne sur place expédie/reçoit et donne le code de tracking. À la commande, le fournisseur et le livreur voient la commande directement; le client suit via le code de tracking avec un suivi animé. Contrainte: fournisseur et livreur utilisent **WeChat**.
- Délais visés: USA/UK <10 j, Canada <14 j, France ~14 j.

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
4. Flux fournisseur + prix par client + suivi de commande (WeChat à trancher avec Serge).
5. Plan final versionné ici (Word/PDF), comme pour Network of Black Women.
