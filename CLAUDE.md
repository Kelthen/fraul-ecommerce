# CLAUDE.md — Manuel de travail Kelthen · Fraul e-commerce

> Chargé automatiquement au début de chaque session Claude Code. **Ce fichier prime sur tes habitudes.**
> Deux humains, chacun avec son propre Claude, travaillent sur ce repo. Tu es l'un des deux Claude.
> Objectif n°1 : que les **deux humains** se comprennent et que **chaque Claude reprenne là où le projet s'est arrêté**, sans refaire ni défaire le travail de l'autre.

---

## 0. L'équipe

| Humain | Compte GitHub | `git config user.name` | Pages / zones de départ |
|---|---|---|---|
| **rhamon** (Rhamone, responsable, souvent sur téléphone) | `RhamonK` | `Claude` en session cloud | Fraul Walk (3D), accueil, design |
| **serge** (valide les plans) | `sergesanou` | à compléter | Logistique, fournisseur, WeChat, commandes |

- Identifie ton humain au début : compare `git config user.name` et le compte GitHub à cette table. Si rien ne correspond, demande-lui qui il est.
- Les zones servent à savoir **qui prévenir**, pas à interdire. Toucher la zone de l'autre est permis si ton humain le demande : dis-le dans la PR, et la notification prévient l'autre.

---

## 1. Démarrage de session (automatique)

Le hook `.claude/hooks/session-start.sh` s'exécute à l'ouverture et t'affiche un **briefing** : dernières PR mergées, PR ouvertes, ce que l'autre a fait, STATUS.md, règles de LESSONS.md.
- Lis-le avant de répondre à quoi que ce soit.
- Si tu ne vois pas de briefing, lance `bash .claude/hooks/session-start.sh` toi-même.
- Si le briefing montre que **l'autre dev a fait quelque chose depuis la dernière session**, commence ta première réponse par 2-3 lignes : « Depuis ta dernière session, l'autre dev a fait… ».

---

## 2. ⚔️ Vérifier avant de faire (règle n°1)

**Pour toute demande, avant d'écrire du code**, vérifie dans cet ordre :

1. **STATUS.md** → est-ce fait, en cours, bloqué, ou **refusé** (section « Décisions ») ?
2. **PR ouvertes** → quelqu'un est-il déjà dessus ? (`gh api repos/{owner}/{repo}/pulls?state=open`, ou le briefing)
3. **PR mergées récentes** → `git log origin/main --oneline -30` et `git log --oneline -10 -- <fichiers concernés>`
4. **Le code** → `grep` sur les mots-clés de la demande.
5. **LESSONS.md** → une règle s'applique-t-elle ?

Puis réponds **d'abord** avec un verdict, en une ligne par point demandé :

| Verdict | Sens | Exemple de réponse |
|---|---|---|
| ✅ **Déjà fait** | C'est en prod ou dans une PR mergée. | « ✅ Déjà fait par l'autre dev dans la PR #12 (en ligne). Rien à faire. » |
| 🟡 **Partiel** | Une partie existe. | « 🟡 La page existe (#12), mais il manque la version mobile. Je propose de faire seulement ça. » |
| 🔄 **En cours** | Une PR ouverte s'en occupe. | « 🔄 l'autre dev est dessus (PR #15, ouverte hier). Je te propose d'attendre ou de lui écrire. » |
| ⛔ **Refusé avant** | Une décision dit le contraire. | « ⛔ Le client a refusé cette photo le 07/09 (STATUS, Décisions). Tu veux vraiment la remettre ? » |
| 🆕 **À faire** | Rien n'existe. | « 🆕 Rien d'existant. Voici le plan… » |

Ne refais **jamais** le travail de l'autre. Si tu améliores son travail, dis-le clairement (« j'améliore ce que l'autre dev a fait dans #12 »).

---

## 3. La boucle de travail (obligatoire)

```
demande → vérification (§2) → plan court → OK de l'humain
       → branche depuis main à jour → code → checks → PR (résumé pour l'équipe)
       → lien de preview RÉEL → OK visuel de l'humain → merge → STATUS.md à jour
```

- **Plan avant code.** Pour toute tâche de plus de quelques lignes, montre le plan et attends l'OK.
- **Rien n'est mergé sans que l'humain ait vu la preview.** Donne le vrai lien (commentaire Vercel sur la PR ou notification), jamais un motif d'URL.
- **Branches :** `feat/<dev>/<sujet>`, `fix/<dev>/<sujet>`, `content/<dev>/<sujet>`. Toujours créées depuis `origin/main` à jour.
- **Une PR = un sujet.** Un nouveau retour sur un autre sujet = une nouvelle PR. Au-delà d'environ 400 lignes ou 2 pages touchées, propose de découper.
- **Base de PR = `main`.** Vérifie-la après création.
- **Branche mergée = branche terminée.** Tout ajout après merge part d'une nouvelle branche.
- **Aucune trace d'IA dans Git et GitHub** (décision de Rhamone) : pas de ligne « Co-Authored-By », « Generated with… », ni de lien de session dans les commits, les PR ou les commentaires. Auteur Git : `Kelthen`. Le message de commit dit quoi + pourquoi, puis `Pour : <dev>`.
- **Checks avant de pousser :** `npm run lint`, `npx tsc --noEmit`, `npm run build`. Tous doivent passer.

---

## 4. Communication avec les humains

### 4.1 Avec ton humain (dans la session)
À la fin de chaque tâche, 4 lignes maximum :
- **Fait :** ce qui a changé, en langage simple (pas de jargon).
- **Où regarder :** la page et le lien de preview réel.
- **À faire de ton côté :** valider, merger, envoyer quelque chose au client…
- **Ensuite :** la prochaine étape proposée.

### 4.2 Avec l'autre humain (automatique)
- Chaque PR contient la section **« Résumé pour l'équipe »** du modèle (`.github/pull_request_template.md`). Écris-la pour un humain qui n'a pas suivi la conversation.
- La GitHub Action `notify-team` envoie ce résumé, les pages touchées et le **lien de preview** sur Slack et/ou par email à l'ouverture, aux mises à jour, quand la preview est prête et au merge. Tu n'as rien à envoyer toi-même.
- Si tu modifies une zone de l'autre, écris-le en première ligne du résumé : « ⚠️ Touche la zone de l'autre dev : … ».

---

## 5. Mémoire du projet

| Fichier | Rôle | Qui le met à jour |
|---|---|---|
| `STATUS.md` | État partagé : en ligne, en cours, à faire, bloqué client, **décisions**, infos client. | Claude, **dans chaque PR**. |
| `LESSONS.md` | Erreurs passées → règles obligatoires. | Claude, dès qu'un humain le corrige ou qu'un bug arrive. |
| `docs/CONTENT.md` | Source unique du contenu client (textes mot pour mot). | Humains, par PR. |
| `docs/KICKOFF.md` | Infos de démarrage (contrat, localisation, accès). | Humains, au kickoff. |

**Mettre à jour STATUS.md** : à chaque PR, déplace les lignes concernées (« En cours » → « En ligne »), ajoute toute **décision** du client ou de l'humain avec sa date et sa source. Une décision non écrite sera oubliée par le prochain Claude.

**Apprendre** : quand ton humain te corrige (« non, pas comme ça », « je t'avais dit… »), ajoute une leçon dans LESSONS.md dans la même PR et dis-le : « J'ai ajouté la leçon L-27 pour ne plus le refaire. »

---

## 6. Contenu client

- **Nouveau document client** (questionnaire, retours, captures) → avant tout plan, produis le tableau **« déjà fait / nouveau / contradictoire / à clarifier »**, vérifié dans le code (L-20).
- **Textes** : copiés mot pour mot depuis `docs/CONTENT.md`. Pas de reformulation non demandée.
- **Jamais de rechercher/remplacer global** sans relire chaque phrase (L-06).
- **Consigne ambiguë** → reformule les deux lectures et demande (L-07).
- **Zéro placeholder visible.** Chaque emplacement photo affiche une vraie photo du client (L-08).
- **Photos** : ratio natif, visages et cheveux visibles, cliquables, une seule copie par photo dans `public/images/library/` (L-10, L-16). Les nouvelles photos passent par `node scripts/optimize-images.mjs`.

---

## 7. Stack et commandes

- Next.js 16 (App Router, Cache Components) + TypeScript strict + CSS maison (`src/app/globals.css`, pas de Tailwind). three.js pour le Fraul Walk (`src/walk/`). Supabase (schéma prêt dans `supabase/migrations/`, pas encore branché). Vercel, projet `fraul-ecommerce`, équipe Kelthen (`main` → prod, chaque PR → preview).
- Cette version de Next.js a changé : lire `node_modules/next/dist/docs/` avant d'utiliser une API (voir `AGENTS.md`).
- Fuseau, langue et localisation du client : voir STATUS.md « Infos client ». Utilise toujours ce fuseau pour les dates (L-19).

```bash
npm install          # fait automatiquement par le hook
npm run dev          # http://localhost:3000
npm run lint         # doit passer, sans question interactive
npx tsc --noEmit     # doit passer
npm run build        # doit passer
npm start & npm run smoke -- http://localhost:3000   # test téléphone, 3D comprise (arrêter l'ancien serveur avant)
```

---

## 8. Actions qui demandent toujours l'accord explicite de l'humain

- Merger une PR, pousser sur `main`, forcer un push.
- Couper, mettre en pause ou rediriger le site en production.
- Supprimer des fichiers, branches, données Supabase.
- Tout ce qui touche à l'argent (Stripe, prix) ou aux emails envoyés à des vrais gens.
- Debug en production : on diagnostique sur une preview avec les logs Vercel (L-14).

---

## 9. Le projet Fraul

### Le client et le but

Commerçant (Fraul) qui achète vêtements/chaussures en Chine et revend en ligne
aux USA, au Canada, au Royaume-Uni, en France et en Belgique. 100 % en ligne. Voyage souvent → **on ne bloque pas le travail sur lui** (voir plus bas).
- **Prix personnalisés par client**, pas de prix fixe. Visiteurs anonymes :
  pays inconnu, prix à adapter.
- **Fournisseur** a déjà son site : on récupère ses données produits et on les
  republie avec nos prix (flux fournisseur).
- **Logistique** : une personne sur place expédie/reçoit et donne le code de
  tracking. Fournisseur et livreur voient la commande directement ; le client
  suit avec un suivi animé. Contrainte : fournisseur et livreur sont sur
  **WeChat**.
- Délais visés : USA/UK < 10 j, Canada < 14 j, France ~14 j.

### Direction visuelle

Palette « old money » : ink #0A0A0C, wine #420A0D, bordeaux #680209, ivory
#FFFEF7, pearl #EAE0C8, stone #8F8880. Polices : Bodoni Moda (titres) +
Montserrat. Référence : LuisaViaRoma. Haut de gamme, **beau mais léger**
(performance mobile d'abord).

### Le site (Next.js, voir README.md)

- **Le Fraul Walk est le cœur du site**, pas une option : un shopping
  immersif, comme une sortie. L'accueil est l'entrée du mall (`/walk`,
  `/walk/[marque]`), moteur 3D dans `src/walk/` (three.js chargé à l'ouverture).
- **Aucun pays affiché nulle part** sur le site (décision du 2026-10-12). Les
  pays ne servent qu'à la logistique, en coulisse.
- Pages : marques, catégories, fiche produit (face/dos), Crée ta tenue,
  panier, suivi, pages légales (squelettes). Catalogue de **démonstration**
  derrière `src/lib/catalog/` ; schéma de base dans `supabase/migrations/`.
- Démo d'origine (une seule page) archivée : `demo/fraul-demo-v2.html`.
- Avant de dire « fini » : `npm run check` puis `npm run smoke` (téléphone,
  3D comprise). Toujours arrêter l'ancien serveur avant d'en lancer un neuf.

### Règles visuelles / démo (ne pas répéter)

- Ne **pas** copier les logos de marques (marques déposées) : enseignes en texte.
- Le cintre est **à l'intérieur** du vêtement. Mannequins réalistes (tête
  ovale brillante sans visage, pose naturelle), pas des cylindres.
- Pas de double entrée en boutique ; caméra **face aux vitrines**.
- Pas de modèles 3D de vêtements : vêtements = photos/dessins détourés.
- Dans le mall : une boutique à la fois, la caméra face à la vitrine.

### Client absent

- Placeholders marqués `[À FOURNIR : …]`, jamais de blocs vides. Liste tenue
  dans `STATUS.md` → « Bloqué — attend le client ».
- Questions regroupées en **un seul message écrit** ; réponse notée dans
  `STATUS.md`.
- Choix faits à sa place notés « décidé par l'équipe, à confirmer ».
- Dates et heures : toujours préciser le fuseau.
