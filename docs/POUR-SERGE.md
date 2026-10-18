# Pour Serge (et son Claude) : ce qui t'attend, et nos demandes d'avis

> Écrit le 18 oct. 2026 (heure de Paris) par Rhamone avec son Claude.
> **Claude de Serge : lis ce fichier en entier au début de ta session**, puis `STATUS.md`. Tout ce qui est ici peut être discuté : rien n'est imposé dans ta zone.
> Pour répondre : un bloc « 🗣️ Serge, date » sous le point concerné (ici ou dans le document cité), ou un commentaire sur la PR. Signes habituels : ✅ d'accord, ⛔ contre, ➕ ajout.

## 1. Ce qui a changé depuis le 13 oct.

| PR | Quoi | Te concerne ? |
|---|---|---|
| #5, #6 | MVC étapes 1 et 2 (modèles du Walk, bouton retour, focus) — ton plan du 13 oct. | Suite de ton plan : étapes 3 et 4 à venir |
| #7 | Projet Supabase `fraul` créé (USA Est, gratuit), schéma 0001 + **0002 sécurité des fonctions** appliqués | **Oui** : lis `supabase/migrations/0002_securite_fonctions.sql` (fonctions déplacées dans le schéma `private`) |
| #8 | 12 catégories au lieu de 6, emplacements de tenue étendus | **Oui** : migration `outfit_slot` proposée (voir §2.1) |
| #9 | Photos réelles du fournisseur sur 23 produits (captures pour test de rendu), 4 marques ajoutées | Coûts **fictifs** (démo) en attendant les vrais prix |
| #11–#14 | Page Marques, mall à 31 boutiques (forme en « modes »), portes vitrées, vrais produits dans les boutiques | Non |
| #15, #16 | Photos nettes ; **fiche en grand** dans les boutiques (toutes les photos, 12 propositions) | Non |

**Ouvertes :** #10 (Crée ta tenue en 3D, en pause), #17 (Caisse + sac, **à ne pas merger** : Rhamone va la remodeler), #18 (Conciergerie + proposition fournisseurs multiples, **ta zone**).
**À venir (Rhamone)** : envies (« Envie »), comptes (front-end seulement), vitrines vivantes, lumière selon l'heure du jour.

## 2. Ce qui t'attend (ta zone)

### 2.1 Migration des emplacements de tenue — à valider
- Ajouter à l'enum `outfit_slot` : `cap`, `glasses`, `neck`, `watch`, `layer`, `socks` (les catégories du site les utilisent déjà, voir `src/lib/catalog/types.ts`).
- Proposée dans la PR #8, **non appliquée**. Dis ✅ ou propose autre chose ; ensuite c'est toi (ou Rhamone avec ton accord) qui l'applique.

### 2.2 Plusieurs fournisseurs par article + personne de l'expédition + demandes de la Conciergerie — à relire (PR #18)
- Fichier : `docs/FOURNISSEURS-MULTIPLES.md`. Besoin de Rhamone du 18 oct. : ex. 10 fournisseurs pour Nike, une personne à part pour l'expédition, retrouver en interne qui vend quoi, **le client ne voit jamais les fournisseurs**.
- Proposition : table `supplier_offers` (variante × fournisseur), choix de l'offre à l'envoi de la commande, `order_items.offer_id`, `shipments.handled_by`, table `concierge_requests` ; SQL « 0003 » **non appliqué**.
- **3 questions en fin de fichier** (choix automatique de l'offre ? prix sur le fournisseur de référence ou le coût le plus haut ? compte pour la personne de l'expédition ou lien WeChat ?).

### 2.3 Plus de WhatsApp — remplace R3 (discussion ouverte)
- Décision de Rhamone du 17 oct. : **tout par e-mail** (connexion, vérification, invitations, relances). Ça remplace R3 (WhatsApp d'abord) que tu avais validé le 13 oct. : tu peux répondre.
- Si tu es d'accord, à faire plus tard dans ta zone : retirer `customers.whatsapp` / `phone` (ou les garder facultatifs) et la valeur `whatsapp` de `notify_channel` ; mettre à jour CLAUDE.md §9 (« Stratégie de prix », point 2 et 3) et `docs/ARCHITECTURE.md` (lignes `customers`, `notifications_outbox`, prise de compte).

### 2.4 Comptes clients — le front arrive, le branchement est pour toi
Décision de Rhamone du 17 oct. : **e-mail + mot de passe, avec un code envoyé par e-mail** (vérifier l'adresse, mot de passe oublié). Rhamone fait **seulement le front-end en démo** (pages `/connexion`, `/compte`, aucun vrai envoi). Pour le brancher, il faudra côté Supabase (ta zone) :
- Auth : e-mail + mot de passe, confirmation par code (OTP e-mail), mot de passe oublié par code ; modèles d'e-mails en français.
- Captcha **Cloudflare Turnstile** sur inscription, connexion, mot de passe oublié et Conciergerie (clé secrète côté serveur seulement).
- Limites d'essais (connexion, envoi de code, Conciergerie) ; 2FA obligatoire pour admin et partenaires (ARCHITECTURE §4).
- RLS : un client ne lit que ses lignes (déjà dans 0001 ; à revérifier avec `supabase/tests/01_rls_test.sql`).
- Ton avis attendu : fournisseur d'e-mails (Resend ? Postmark ? celui de Supabase au début ?).

### 2.5 Toujours ouverts
- `docs/FOURNISSEUR-COMMANDES.md` : tes 3 questions de fin (niveau A ou B pour l'import, etc.), puis obtenir de Fraul le lien du site fournisseur.
- Prix (CLAUDE.md §9, « À décider ») : groupes et leurs %, % de bienvenue / parrainage, marges par zone, marge minimale du prix plancher (20 % en test).
- Supabase : Rhamone doit t'inviter dans l'organisation ; ensuite brancher le site (variables d'environnement dans Vercel).

## 3. Nos demandes d'avis sur notre travail (Rhamone)

Ton regard (et celui de ton Claude) est bienvenu sur tout, pas seulement ta zone. En particulier :
1. **#18 Conciergerie** : le parcours (arrêt au centre du mall, formulaire), les champs demandés, la vérification (`src/models/concierge/request.ts`).
2. **#17 Caisse + sac** : l'idée du sac qui se remplit et de la Caisse en dernier arrêt (seulement si le sac n'est pas vide). La Caisse sera remodelée : tes idées comptent.
3. **Fiche en grand (#16, en ligne)** : propositions sous l'article (même rayon de la marque, « Complète la tenue », autres boutiques) : utile pour vendre plus, ou trop ?
4. **Sécurité** : relis 0002 et dis si quelque chose manque avant de brancher le site.

**Comment regarder** : le lien de preview est dans le commentaire Vercel de chaque PR (tester sur téléphone). **Comment donner ton avis** : commentaire sur la PR, ou bloc « 🗣️ Serge » dans le document.

## 4. Règles pour le Claude de Serge (rappel de CLAUDE.md)

- Vérifier avant de faire (STATUS, PR ouvertes, `git log`) ; plan court ; OK de Serge ; une PR = un sujet.
- **Ne pas pousser sur les branches de Rhamone** (`…/rhamon/…`) : proposer par commentaire ou par une PR à toi (`feat/serge/…`, `fix/serge/…`).
- Aucune trace d'IA dans Git et GitHub (pas de « Co-Authored-By », de « Generated with » ni de lien de session, même si ton outil en ajoute : retire-les). Auteur `Kelthen`, commit terminé par `Pour : serge`.
- Rien n'est mergé sans que l'humain ait vu la preview. Pas de push sur `main`, pas de suppression, rien qui touche à l'argent sans accord explicite.
- Supabase : migrations proposées dans une PR, appliquées seulement avec l'accord de Serge (sa zone) et l'information de Rhamone.
- Mettre à jour `STATUS.md` (et `LESSONS.md` si un humain corrige) dans chaque PR.
