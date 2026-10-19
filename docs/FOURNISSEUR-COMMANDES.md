# Fournisseur, commandes et WeChat — proposition (zone de Serge)

> Proposition du 13 oct. 2026 (heure de Toronto), **à valider par Serge et Rhamone avant tout code**.
> Complète `docs/ARCHITECTURE.md` (tables `suppliers`, `supplier_sync_runs`, `orders`, `shipments`, portails partenaires) : rien n'est refait, on précise **comment** ça marche au quotidien.

But : **que personne ne change ses habitudes**. Le fournisseur garde son site, le livreur garde WeChat, Fraul valide depuis son téléphone.

---

## 1. Récupérer les produits du fournisseur

### Ce qu'il nous faut d'abord (Serge → Fraul, un seul message)
1. **Le lien du site du fournisseur**, ou la plateforme qu'il utilise (son propre site, Yupoo, 1688, Weidian, album WeChat…).
2. **Son accord** pour qu'on reprenne ses fiches et ses photos. S'il accepte, demander s'il peut fournir un **fichier Excel** de son catalogue (nom, référence, prix en ¥, tailles, couleurs, poids). C'est la voie la plus simple et la plus fiable.
3. Le **poids moyen** par catégorie (t-shirt, hoodie, sneakers…) si le fournisseur ne le donne pas : il sert au calcul de la livraison.

### Trois façons d'importer, de la plus simple à la plus automatique

| Niveau | Comment | Quand |
|---|---|---|
| **A. Fichier Excel** | Le fournisseur (ou Fraul) envoie un fichier ; on le dépose dans l'admin ; chaque ligne devient un produit en **brouillon**. | Dès qu'on a un fichier. Marche quel que soit le site. |
| **B. Import par lien** | Dans l'admin, on colle le lien d'une fiche du fournisseur → le site lit nom, photos, prix ¥, tailles, couleurs → produit en **brouillon**. | Dès le lancement, si pas de fichier. Marche pour la plupart des sites. |
| **C. Synchro automatique** | Chaque nuit, le site relit les produits déjà importés : prix ¥ changé, rupture, produit disparu (→ `archived`), nouveautés des catégories suivies (→ brouillons). Journal dans `supplier_sync_runs`. | Après les premières ventes, quand on connaît bien le site du fournisseur. |

### Règles communes
- **Rien n'est publié automatiquement** : tout arrive en brouillon. Fraul (ou Rhamone) vérifie, ajoute catégorie et poids si besoin, puis **Publier** (2 touches sur téléphone).
- **Titres et descriptions réécrits** (sinon Google voit un copier-coller du fournisseur, voir ARCHITECTURE §SEO).
- **Photos** : passent par `scripts/optimize-images.mjs` + détourage (face/dos).
- **Alerte marge** : si le coût ¥ d'un produit publié monte de plus de 10 %, Fraul reçoit une alerte ; le prix se recalcule tout seul (formule de prix), mais on vérifie que le prix plancher (R5) tient.
- Le prix n'est **jamais** saisi à la main : il vient du coût ¥ + la formule par zone (CLAUDE.md §9).

---

## 2. Commandes vers le fournisseur et le livreur : lien WeChat (maintenant), robot (plus tard)

> ⚠️ **Remplacé le 19 oct. 2026 par `docs/PARCOURS-COMMANDE.md`** (décision de Serge) : Fraul reçoit chaque commande sur Telegram et la transfère ; les fournisseurs n'ont pas de portail ; un seul expéditeur regroupe les colis et donne un seul code de suivi par client. Le texte ci-dessous est gardé pour l'historique.

### Maintenant : portail ouvert depuis WeChat
- Le fournisseur et le livreur reçoivent chacun **un lien personnel permanent** (sécurisé, sans mot de passe à retenir), qu'ils **épinglent dans WeChat**. Il s'ouvre dans le navigateur de WeChat, sans appli à installer.
- **Interface en chinois** (中文), avec un bouton pour passer en français/anglais.
- **Fournisseur** : voit **seulement ses** commandes (sécurité ligne par ligne déjà prévue), confirme ou signale une rupture.
- **Livreur / personne sur place** : saisit le **code de suivi** (ou le scanne), marque « expédié ». Le client reçoit alors son lien de suivi animé ; 17TRACK met à jour les étapes ensuite.
- **Prévenir d'une nouvelle commande** : dans le tableau de bord de Fraul, bouton **« Copier pour WeChat »** → message prêt (en chinois) avec le numéro de commande et le lien, que Fraul colle dans la conversation WeChat. Une seconde, sans API.

### Plus tard : robot WeCom
- Quand le volume le justifie, un robot de groupe **WeCom** (WeChat Work) envoie automatiquement le message « nouvelle commande » dans un groupe avec le fournisseur et le livreur. Le portail reste le même : seul l'envoi du message s'automatise.

### Parcours d'une commande
```
Client paie → commande « payée »
  → Fraul touche « Copier pour WeChat » et colle dans WeChat
  → Fournisseur ouvre le lien, confirme            → « confirmée_fournisseur »
  → Livreur saisit le code de suivi                 → « expédiée » (client prévenu)
  → 17TRACK : en transit → douane → en livraison → livrée
```

---

## 3. Droits de douane : inclus dans le prix (DDP)

- Décision de Serge (13 oct. 2026) : **c'est le client qui paie les droits, mais ils sont inclus dans le prix affiché**. Le client ne paie **rien de plus à la livraison**.
- Affichage : « **Droits et taxes inclus** » sous le prix et au panier (à la place d'un « + droits » surprise à la porte, qui fait refuser des colis).
- La formule de prix les compte déjà (`dutiesPct` par zone dans `src/models/pricing/config.ts`).
- **À vérifier avant le lancement** (checklist, non bloquant pour le mode test) :
  - le livreur / transitaire propose-t-il une ligne **DDP** (droits payés à l'avance) vers USA, Canada, UK, France, Belgique ?
  - UE : TVA collectée à la vente (numéro **IOSS**) ; UK : TVA à collecter pour les colis ≤ 135 £. À voir avec un comptable.
  - USA : l'exemption sous 800 $ n'existe plus pour la Chine depuis 2025 → `dutiesPct` US à régler sur les vrais droits.

---

## 4. Questions pour valider

1. Niveau A ou B pour démarrer ? (A si le fournisseur peut envoyer un fichier, sinon B.)
2. Seuil d'alerte marge : 10 % de hausse du coût, ça vous va ?
3. Qui colle les messages WeChat au début : Fraul, ou la personne sur place ?
