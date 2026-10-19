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
| **Expéditeur** (un seul, ami de Fraul, pour tous les fournisseurs) | Reçoit les colis des fournisseurs, **regroupe tout ce qui va au même client**, expédie, donne **un seul code de suivi** | Une page web personnelle (lien sans mot de passe) |

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
5. L'expéditeur coche les colis reçus sur sa page : « FRL-123 : 1/2… 2/2 »
6. Tout est là → il expédie et saisit LE code de suivi   → site : « En transit »   (e-mail au client)
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

[ ✅ Transféré à A ]  [ ✅ Transféré à B ]  [ ⚠️ Rupture ]
```
- Une **réponse au message avec un code de suivi** l'enregistre aussi (dépannage, si l'expéditeur l'envoie à Fraul).

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

1. **Telegram** pour prévenir Fraul (gratuit, instantané, boutons) ; e-mail en secours. WhatsApp plus tard si besoin (API payante, modèles validés par Meta). — *décidé par l'équipe, à confirmer*
2. **Le code de suivi est saisi par l'expéditeur** sur sa page ; Fraul peut aussi répondre au message Telegram. — *à confirmer*
3. **« En cours de traitement » dès le paiement.** — *à confirmer*

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

-- Fraîcheur des offres (garde-fou « prix périmé »).
alter table supplier_offers add column last_checked_at timestamptz;
```
Un seul `shipments` par commande (= un code de suivi par client) ; l'adresse vient de `orders.shipping_address`, lisible par l'expéditeur seulement pour ses envois (vue limitée, comme pour le fournisseur).
