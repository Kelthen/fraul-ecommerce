# Parcours d'une commande : du paiement au colis chez le client

> **Zone de Serge** (commandes, fournisseurs, expédition). Écrit le 19 oct. 2026 (heure de Toronto) avec Serge.
> **Remplace la partie 2 de `docs/FOURNISSEUR-COMMANDES.md`** (portail WeChat pour le fournisseur) : Fraul devient le relais, le fournisseur n'a pas de portail.
> S'appuie sur `docs/FOURNISSEURS-MULTIPLES.md` (offres par fournisseur, migration 0004 validée, non appliquée) et y ajoute ce qui manque (§4, §6).
> Rien n'est codé ni appliqué. Réponses de Rhamone bienvenues en « 🗣️ Rhamone ».

---

## 1. Qui fait quoi (dans la réalité)

| Qui | Rôle | Outil |
|---|---|---|
| **Client** | Commande et paie sur le site, suit son colis | Le site + e-mails |
| **Fraul** | Reçoit chaque commande, la transfère aux bons fournisseurs, gère les problèmes | **Telegram** (+ tableau de bord du site) |
| **Fournisseurs** (plusieurs, ex. 10 pour Nike) | Reçoivent de Fraul les articles à préparer, envoient leur colis à l'expéditeur | Leur habitude (WeChat) |
| **Expéditeur** (un seul, ami de Fraul, pour tous les fournisseurs) | Reçoit les colis des fournisseurs, **regroupe tout ce qui va au même client**, expédie, renvoie **un seul code de suivi** à Fraul | Sa messagerie habituelle (fiche d'expédition reçue de Fraul) ; page personnelle plus tard (niveau 2) |

Règles :
- **Un client = un seul colis = un seul code de suivi**, même si sa commande vient de plusieurs fournisseurs.
- **Les fournisseurs n'ont jamais l'adresse du client** ni nos prix de vente : seulement les articles, leur référence et le **numéro de commande Fraul à écrire sur le colis**.
- **Seul l'expéditeur a l'adresse du client.**
- **Un seul numéro partout** : `FRL-2026-000123` (messages, colis, suivi, tableau de bord).
- **Le site est la seule référence** ; Telegram ne sert qu'à prévenir.

## 2. Le parcours

```
1. Client paie                          → site : « En cours de traitement »   (e-mail au client)
2. Message Telegram à Fraul             (1 bloc pour Fraul + 1 bloc « à transférer » par fournisseur)
3. Fraul transfère chaque bloc à son fournisseur, touche « Transféré » dans Telegram
4. Chaque fournisseur envoie son colis à l'expéditeur (n° FRL écrit dessus)
   Fraul transfère aussi la FICHE D'EXPÉDITION (image) à l'expéditeur
5. L'expéditeur reçoit les colis (n° FRL dessus) ; tout est là → il colle la fiche, expédie
6. Il renvoie « FRL-123 → code » à Fraul ; Fraul le transfère au bot, vérifie la carte,
   touche ✅ Confirmer                                     → site : « En transit »   (e-mail au client après 15 min)
7. Suivi automatique du transporteur (17TRACK) : douane, en livraison… → « Livrée »
```

### Ce que voit le client (4 étapes seulement)
**Payée → En cours de traitement → En transit (suivi) → Livrée.**
Le détail interne (transmise aux fournisseurs, colis reçus 1/2…) reste dans le tableau de bord de Fraul.
« Temps réel » = mis à jour à chaque scan du transporteur (départ, douane, livraison), pas un point GPS : on l'écrit honnêtement sur la page de suivi.

### Le message Telegram à Fraul (exemple)
```
🛍 Nouvelle commande FRL-2026-000123 — payée 358 USD (marge estimée : …)
Client : prénom + ville (l'adresse complète est sur la page de l'expéditeur)

── À transférer au fournisseur A ──  (en chinois, sans prix)
订单 FRL-2026-000123 · 请寄给发货人
• Tech Fleece noir · L · 1 pc · réf A-88213 · [lien] · [photo]
• Hoodie Trapstar noir · M · 1 pc · réf A-77102 · [lien] · [photo]

── À transférer au fournisseur B ──
订单 FRL-2026-000123 · 请寄给发货人
• Casquette … · taille unique · 1 pc · réf B-501 · [lien] · [photo]

── Fiche d'expédition (image, à transférer à l'expéditeur) ──
FRL-2026-000123 (très grand + code-barres)
Nom, adresse complète, téléphone du client (caractères latins, intitulés en chinois)
2 colis attendus : fournisseur A (2 articles) · fournisseur B (1 article)

[ ✅ Transféré à A ]  [ ✅ Transféré à B ]  [ 📦 Fiche envoyée ]  [ ⚠️ Rupture ]
```

### Codes de suivi : ne jamais se tromper de client (décision de Serge, 19 oct. : le code passe par Fraul)
1. L'expéditeur envoie **toujours le couple** « FRL-123 → code » (le n° est sur la fiche collée au colis).
2. Fraul **transfère ce message au bot** (un ou plusieurs couples d'un coup). Fraul ne choisit jamais la commande à la main.
3. Pour chaque couple, le bot affiche une **carte de vérification** : code → FRL-123 · prénom + initiale · ville · nombre d'articles + photos. Rien n'est enregistré avant **✅ Confirmer**.
4. Le site **refuse** : code déjà utilisé sur une autre commande (unique), n° de commande inconnu ou ayant déjà un code, format de code inconnu.
5. Au **premier scan du transporteur** (17TRACK), si le pays de destination ne correspond pas à la commande → alerte à Fraul.
6. **15 minutes pour corriger** : l'e-mail « En transit » part au client après ce délai ; bouton « Annuler » pendant ce temps.

## 3. Grandir sans que Fraul soit débordé

| Niveau | Quand | Ce qui change |
|---|---|---|
| **1. Lancement** | jusqu'à ~20 commandes/jour (estimation) | 1 message Telegram par commande, comme ci-dessus |
| **2. Croissance** | au-delà | **1 récap par fournisseur et par jour** (ex. 18 h heure de Chine) au lieu d'un message par commande ; l'expéditeur colle ses codes en lot (« FRL-123 → code ») |
| **3. Gros volume** | plus tard | Le récap part **directement** aux fournisseurs (robot WeCom) ; Fraul (ou un assistant, rôle `ops`) ne gère plus que les problèmes |

Le niveau 2 est prévu dès la construction : passer de 1 à 2 = un réglage, pas un recodage.

**Tableau de bord de Fraul, 3 piles :** « à transférer », « en attente de colis / de suivi », « en retard ».
**Alertes automatiques** : commande non transférée sous 24 h ; colis d'un fournisseur pas reçu par l'expéditeur sous X jours ; pas de code de suivi sous X jours ; colis bloqué chez le transporteur.

## 4. Plusieurs fournisseurs : ne jamais se tromper d'article ni de prix

S'appuie sur `supplier_offers` (migration 0004, `docs/FOURNISSEURS-MULTIPLES.md`). Rappel et ajouts :
- Chaque variante (produit × taille × couleur) a **son code Fraul** et **ses offres** : fournisseur, sa référence, son lien, son prix ¥, stock, délai, **date de dernière vérification**.
- **Prix client** = calculé sur le fournisseur de référence : un seul prix, qui ne dépend pas du fournisseur choisi.
- **À la commande**, le site propose l'offre la moins chère en stock dans le délai ; Fraul confirme. Fournisseur, référence et coût réel sont **figés sur la ligne** (`offer_id`, `supplier_id`, `unit_cost`) : si un prix change ensuite, la commande garde les bons chiffres. Contrôle du **prix plancher** avec le coût réel avant l'envoi.
- ➕ **Ajouts de Serge (19 oct.)** :
  - offre **non vérifiée depuis X jours** → signalée ;
  - **hausse de prix** d'un fournisseur → alerte à Fraul ;
  - variante **sans aucune offre en stock** → **masquée automatiquement** sur le site ;
  - commande **découpée par fournisseur** automatiquement (un bloc « à transférer » chacun).

## 5. Choix par défaut (à confirmer par Serge)

1. ✅ **Telegram** pour prévenir Fraul (gratuit, instantané, boutons) ; e-mail en secours. — *confirmé par Serge le 19 oct.*
2. ✅ **Le code de suivi passe par Fraul** au lancement : l'expéditeur l'envoie à Fraul, Fraul l'envoie au site avec un bouton (vérification ci-dessus). Page de l'expéditeur au niveau 2. — *confirmé par Serge le 19 oct.*
3. **L'adresse arrive chez l'expéditeur par la fiche d'expédition** (image transférée par Fraul). — *proposition, à confirmer*
4. **« En cours de traitement » dès le paiement.** — *à confirmer*

## 6. Proposition SQL (à ajouter après la 0004, **non appliquée**)

```sql
-- Colis attendus par l'expéditeur : un par (commande × fournisseur).
create type parcel_status as enum ('expected', 'received', 'missing');
create table order_parcels (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders (id) on delete cascade,
  supplier_id uuid not null references suppliers (id),
  status      parcel_status not null default 'expected',
  forwarded_at timestamptz,          -- Fraul a transféré le bloc au fournisseur
  received_at  timestamptz,          -- l'expéditeur a coché le colis
  unique (order_id, supplier_id)
);
alter table order_parcels enable row level security;
create policy "équipe gère" on order_parcels for all using (public.is_team()) with check (public.is_team());
-- L'expéditeur voit et coche les colis des commandes qui lui sont attribuées (via shipments.handled_by).
create policy "expédition voit ses colis" on order_parcels for select
  using (exists (select 1 from shipments s where s.order_id = order_parcels.order_id and s.handled_by = auth.uid()));
create policy "expédition coche ses colis" on order_parcels for update
  using (exists (select 1 from shipments s where s.order_id = order_parcels.order_id and s.handled_by = auth.uid()))
  with check (exists (select 1 from shipments s where s.order_id = order_parcels.order_id and s.handled_by = auth.uid()));

-- Un code de suivi ne peut servir qu'à une seule commande.
create unique index shipments_tracking_unique on shipments (tracking_code) where tracking_code is not null;

-- Fraîcheur des offres (garde-fou « prix périmé »).
alter table supplier_offers add column last_checked_at timestamptz;
```
Un seul `shipments` par commande (= un code de suivi par client) ; l'adresse vient de `orders.shipping_address`, lisible par l'expéditeur seulement pour ses envois (vue limitée, comme pour le fournisseur).
