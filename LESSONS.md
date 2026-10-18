# LESSONS.md — Mémoire des erreurs (Kelthen)

> **Claude : lis ce fichier au début de chaque session. Chaque règle ci-dessous est obligatoire.**
> Le hook de démarrage affiche automatiquement les lignes « Règle ».
>
> **Quand ajouter une leçon :** dès qu'un humain te corrige, qu'un bug arrive en preview ou en prod, ou que tu refais un travail déjà fait.
> Ajoute l'entrée dans la même PR que la correction. Numérote à la suite. Ne supprime jamais une leçon : si elle devient fausse, barre-la et explique pourquoi.
>
> **Fin de projet :** les leçons utiles à tous les projets remontent dans le playbook (`kelthen/website-starter`).

## Format

```
### L-XX — Titre court
- **Projet / date :** NOM, AAAA-MM-JJ
- **Ce qui s'est passé :** faits, avec numéros de PR.
- **Cause :** pourquoi c'est arrivé.
- **Règle :** ce que Claude fait désormais, formulé comme une action.
```

---

## Leçons héritées de NBW (août-octobre 2026)

### L-01 — Vérifier l'historique avant de réintroduire quelque chose
- **Projet / date :** NBW, 2026-09-20
- **Ce qui s'est passé :** la photo du hero avait été rejetée par le client et retirée (#52, 7 sept). Claude l'a remise le 20 sept sans regarder l'historique. Le client a redemandé de l'enlever.
- **Cause :** décision consignée uniquement dans une PR, et aucun réflexe `git log` sur le fichier.
- **Règle :** avant de modifier un fichier, lance `git log --oneline -10 -- <fichier>` et lis la section « Décisions » de STATUS.md. Si l'élément a été retiré ou refusé, ne le remets pas sans accord explicite.

### L-02 — Vérifier le code avant d'affirmer ou de demander
- **Projet / date :** NBW, 2026-09-20
- **Ce qui s'est passé :** le brief client demandait « PayPal, oui ou non ? » alors que PayPal était en ligne depuis la PR #25.
- **Cause :** liste écrite de mémoire.
- **Règle :** toute affirmation sur l'état du site (« c'est fait », « ça manque ») est vérifiée par `grep`, Git ou les PR juste avant de l'écrire. Sinon, écris « à vérifier ».

### L-03 — Vérifier si quelqu'un l'a déjà fait
- **Projet / date :** NBW, 2026-08-20
- **Ce qui s'est passé :** Programs construit deux fois (#9 rhamon, #28 serge, fermée après 13 jours).
- **Cause :** aucun Claude ne regardait les PR ouvertes et mergées de l'autre.
- **Règle :** avant toute tâche, applique la vérification du §2 du CLAUDE.md (STATUS, PR ouvertes, PR mergées, code). Réponds d'abord avec un verdict : ✅ fait / 🟡 partiel / ⛔ refusé / 🆕 à faire.

### L-04 — Une PR cible toujours `main`
- **Projet / date :** NBW, 2026-09-16
- **Ce qui s'est passé :** PR #58 ouverte vers une branche de feature, mergée au mauvais endroit, rattrapée par #59.
- **Règle :** à la création d'une PR, la base est `main`. Après création, relis la base affichée par l'outil et confirme-la à l'humain.

### L-05 — Une branche mergée est terminée
- **Projet / date :** NBW, 2026-09-16
- **Ce qui s'est passé :** commits ajoutés après merge (« j'ai déjà mergé, comment tu peux encore ajouter ? »). Une même branche a porté 13 PR.
- **Règle :** après un merge, toute nouvelle modification part d'une nouvelle branche créée depuis `main` à jour. Explique-le à l'humain s'il demande un ajout.

### L-06 — Jamais de rechercher/remplacer global sans relecture
- **Projet / date :** NBW, 2026-09-17
- **Ce qui s'est passé :** « sisterhood → network » a produit « network community » et « united in network ». Le client l'a vu.
- **Règle :** liste chaque occurrence avec sa phrase complète, réécris chaque phrase pour qu'elle reste naturelle, et montre la liste dans la PR.

### L-07 — Instruction ambiguë → reformuler et demander
- **Projet / date :** NBW, 2026-09-20
- **Ce qui s'est passé :** « le reste c'est pour les events » pris au pied de la lettre, d'où un collage Conference vide.
- **Règle :** si une consigne a deux lectures possibles, reformule les deux en une phrase chacune et demande laquelle avant de coder.

### L-08 — Zéro placeholder visible
- **Projet / date :** NBW, 2026-09-20
- **Ce qui s'est passé :** tuiles grises « Photo coming soon » livrées. Retour client : « les placeholders ça les fait chier ».
- **Règle :** chaque emplacement photo affiche une vraie photo du client (réutilisée si besoin, remplacée plus tard). Seuls des contenus explicitement « Coming soon » (prix, speakers) peuvent l'être, avec une photo derrière.

### L-09 — Montrer avant de merger
- **Projet / date :** NBW, 2026-09
- **Ce qui s'est passé :** changements poussés et mergés avant que l'humain ait vu le rendu.
- **Règle :** boucle obligatoire : plan → OK humain → code → **lien de preview réel** → OK humain → merge. Aucune exception pour le visuel.

### L-10 — Photos : ratio natif, visages et cheveux visibles, cliquables
- **Projet / date :** NBW, 2026-09-16 → 09-20
- **Ce qui s'est passé :** têtes coupées, 4 essais sur le bandeau CTA, collage mal cadré.
- **Règle :** le conteneur prend le ratio natif de la photo (ou un ratio proche). Point focal réglé (`object-position`) pour garder visages et chevelure. Photos zoomables au clic. Vérifie en preview desktop **et** mobile avant d'annoncer.

### L-11 — Confirmer les infos clés du client au démarrage
- **Projet / date :** NBW, 2026-08-19 → 09-13
- **Ce qui s'est passé :** site placé à Toronto (#22) au lieu de l'Alberta, corrigé 25 jours plus tard (#53). Dates de conférence erronées dans un doc client.
- **Règle :** localisation, langue, fuseau horaire, dates d'événements et coordonnées sont confirmés par écrit au kickoff (docs/KICKOFF.md) et recopiés dans STATUS.md. Toute date client est reconfirmée avant publication.

### L-12 — La synchro doit être automatique
- **Projet / date :** NBW, 2026-08 → 09
- **Ce qui s'est passé :** journaux abandonnés (2 et 16 sept). `team-sync` ne tournait jamais sur nos noms de branches, et son commit bot annulait les déploiements (#32).
- **Règle :** l'information circule par les PR (résumé obligatoire), la notification automatique et le briefing de démarrage. Aucun bot ne pousse sur `main`.

### L-13 — L'environnement doit être prêt au démarrage
- **Projet / date :** NBW, 2026-09
- **Ce qui s'est passé :** `node_modules` absent, `npm run lint` interactif (ESLint jamais configuré).
- **Règle :** le hook de démarrage installe les dépendances. Lint, typecheck et build passent sans question interactive dès le premier jour.

### L-14 — Pas de debug en production
- **Projet / date :** NBW, 2026-08-19 → 08-23
- **Ce qui s'est passé :** endpoint de diagnostic ajouté puis retiré en prod (#35/#36), redéploiements forcés (#21, #31, #34), 3 PR Stripe à la suite.
- **Règle :** diagnostique sur une preview et avec les logs Vercel. Une PR de prod contient un correctif, pas une expérience.

### L-15 — Photos lourdes : passer par la bonne méthode d'import
- **Projet / date :** NBW, 2026-09
- **Ce qui s'est passé :** les photos Drive (~1 Mo) sont trop lourdes pour transiter par Claude.
- **Règle :** demande à l'humain de déposer les photos choisies dans la session (Word ou zip), ou de les ajouter au repo dans `assets-src/`. Puis passe-les dans `scripts/optimize-images.mjs`.

### L-16 — Une photo = un fichier
- **Projet / date :** NBW, 2026-09-20
- **Ce qui s'est passé :** la même photo copiée sous 5 noms (`home/`, `programs/`, `news/`…).
- **Règle :** chaque photo existe une seule fois dans `public/images/library/` et est référencée depuis un registre (`lib/images.ts`). On réutilise la référence, jamais le fichier.

### L-17 — Une PR = un sujet
- **Projet / date :** NBW, 2026-09-20
- **Ce qui s'est passé :** PR #61 : 6 pages, des composants partagés, ~9 commits.
- **Règle :** un retour client sur un autre sujet ouvre une autre PR. Au-delà d'environ 400 lignes ou 2 pages touchées, propose de découper.

### L-18 — Jalons de paiement avant la mise en ligne
- **Projet / date :** NBW, 2026-10-07
- **Ce qui s'est passé :** impayé, site déjà en prod, aucun levier propre.
- **Règle :** pas de mise en ligne sur le domaine du client avant le jalon de paiement prévu au contrat (docs/KICKOFF.md). Couper un site est une décision humaine : Claude ne le fait pas seul.

### L-19 — Fuseau horaire du client
- **Projet / date :** NBW, 2026-09
- **Ce qui s'est passé :** heures d'événements en `-04:00` (Est) pour un client en Alberta.
- **Règle :** utilise le fuseau défini dans STATUS.md (« Infos client ») pour toute date.

### L-20 — Un document client se compare à l'existant avant de planifier
- **Projet / date :** NBW, 2026-10-10
- **Ce qui s'est passé :** « Website Detail Edits » était une compilation d'anciens questionnaires. 90 % était déjà fait.
- **Règle :** pour tout nouveau document client, produis d'abord un tableau « déjà fait / nouveau / contradictoire / à clarifier » vérifié dans le code, puis le plan.

### L-21 — Ménage des PR
- **Projet / date :** NBW, 2026-10
- **Ce qui s'est passé :** PR #54 ouverte et obsolète depuis le 13 sept.
- **Règle :** au briefing de démarrage, signale toute PR ouverte depuis plus de 7 jours et propose de la fermer ou de la finir.

### L-22 — Pas de fichier de coordination édité à la main par deux personnes
- **Projet / date :** NBW, 2026-09-02
- **Ce qui s'est passé :** OWNERSHIP.yml corrompu (#43).
- **Règle :** le seul fichier d'état partagé est STATUS.md, modifié uniquement dans les PR. En cas de conflit, garde les deux versions et demande.

### L-23 — Identités réelles
- **Projet / date :** NBW, 2026-08
- **Ce qui s'est passé :** la table attendait `RhamonK` / `sergesanou`. Git montrait `Jago`, `serge2022`, `kelthenrift-prog`.
- **Règle :** la table « Équipe » du CLAUDE.md contient les vrais comptes GitHub **et** les vrais `git config user.name`. Vérifie-la au premier jour.

### L-24 — Parler aux humains en clair, avec le vrai lien
- **Projet / date :** NBW, 2026-09-17
- **Ce qui s'est passé :** lien de preview donné sous forme de motif (`…-*.vercel.app`). L'humain ne le trouvait pas. PR mergées sans relecture de l'autre.
- **Règle :** chaque PR a une section « Résumé pour l'équipe » en langage simple. Donne toujours le lien de preview réel (commentaire Vercel ou notification), jamais un motif d'URL.

### L-25 — Liste datée de ce qu'on attend du client
- **Projet / date :** NBW, 2026-09 → 10
- **Ce qui s'est passé :** bios, logos, prix, mot de passe Pixieset attendus pendant des semaines.
- **Règle :** la section « Bloqué — attend le client » de STATUS.md liste chaque élément avec la date de demande. Rappelle-la à l'humain avant chaque réunion client.

### L-26 — Une seule source de données, des accès partagés
- **Projet / date :** NBW, 2026-10
- **Ce qui s'est passé :** contenu à la fois dans le code (`FALLBACK_*`) et dans Supabase. Impossible de savoir ce que la prod affiche. Projet Supabase inaccessible depuis un des comptes.
- **Règle :** STATUS.md indique pour chaque type de contenu sa source (code ou base). Les deux devs ont accès au même projet Supabase et à la même équipe Vercel dès le kickoff.

### L-27 — Savoir qui a fait quoi : l'auteur de la PR, pas le commit
- **Projet / date :** NBW, 2026-10-12
- **Ce qui s'est passé :** dans Git, presque tous les commits sont signés « Claude », quel que soit l'humain. `git log` ne dit pas si c'est rhamon ou serge.
- **Règle :** pour savoir qui a fait quoi, utilise l'auteur de la PR (compte GitHub), affiché par le briefing. Dans tes messages, nomme toujours l'humain (« {{dev}} a fait… »), jamais « Claude ».

---

## Leçons du projet en cours

<!-- Claude : ajoute les nouvelles leçons ici, à partir de L-28. -->

---

## Leçons Fraul (à partir d'octobre 2026)

### L-28 — Client souvent absent : on n'attend pas, on regroupe
- **Projet / date :** Fraul, 2026-10-12
- **Ce qui s'est passé :** le client voyage souvent ; attendre ses réponses aurait bloqué le démarrage.
- **Cause :** dépendance à un interlocuteur peu joignable.
- **Règle :** avance avec des éléments marqués `[À FOURNIR : …]`, regroupe les questions en un seul message (STATUS.md « Bloqué — attend le client ») et note les choix faits à sa place « décidé par l'équipe, à confirmer ».

### L-29 — Deux sessions Claude en parallèle : lire `main` et utiliser le kit existant
- **Projet / date :** Fraul, 2026-10-12
- **Ce qui s'est passé :** une session a poussé une démo et un CLAUDE.md sur `main` pendant qu'une autre écrivait le sien sur sa branche (conflit). La même session a reconstruit le kit de démarrage depuis le PDF du bilan au lieu de copier le vrai kit de NBW (`playbook/starter/`).
- **Cause :** pas de lecture de `main` ni du repo NBW avant d'écrire des fichiers partagés.
- **Règle :** avant d'écrire un fichier partagé (CLAUDE.md, STATUS.md, config), lis `origin/main` ; avant de « refaire » un outil d'équipe, cherche-le dans les autres repos Kelthen (`kelthen/network4bwomen/playbook`, `kelthen/website-starter`) et copie-le.

### L-30 — Un vieux serveur qui tourne encore donne de faux bugs
- **Projet / date :** Fraul, 2026-10-12
- **Ce qui s'est passé :** le test du Fraul Walk a échoué (fichiers introuvables, erreurs 500) parce que l'ancien `next start` servait l'ancienne version après un nouveau build.
- **Cause :** serveur non arrêté avant le build.
- **Règle :** arrête tout serveur Next.js avant chaque build ou test de fumée.

### L-31 — Tester la sécurité dans le même ordre que la vraie plateforme
- **Projet / date :** Fraul, 2026-10-12
- **Ce qui s'est passé :** un test RLS donnait un faux échec : les droits étaient accordés après la migration au lieu d'avant, comme le fait Supabase.
- **Cause :** test local qui n'imitait pas l'ordre de Supabase.
- **Règle :** les tests de `supabase/tests/` imitent Supabase (droits par défaut accordés avant la migration) ; ne conclus jamais à une faille ou à son absence sans ce montage.

### L-32 — Aucune trace d'IA dans Git et GitHub
- **Projet / date :** Fraul, 2026-10-12
- **Ce qui s'est passé :** les commits de la PR #1 étaient signés « Claude » avec « Co-Authored-By » et un lien de session, et la PR finissait par « Generated with Claude Code ». Rhamone a demandé de tout retirer avant le merge.
- **Cause :** signatures ajoutées par défaut par l'outil.
- **Règle :** auteur Git `Kelthen`, aucune ligne « Co-Authored-By », « Generated with… » ni lien de session dans les commits, PR et commentaires. Vérifie avant chaque push : `git log origin/main..HEAD --format='%an%n%B' | grep -iE "^claude$|co-authored|generated with|claude-session|claude\.ai/code"` doit être vide.
- **Ajout (2026-10-12) :** un commit poussé depuis une autre session (Serge) portait encore « Co-Authored-By ». Garde-fou automatique : `.githooks/commit-msg` retire ces lignes, activé par le hook de session (`git config core.hooksPath .githooks`). Ne jamais le désactiver.

### L-33 — L'avis d'un humain n'est pas un ordre pour l'autre
- **Projet / date :** Fraul, 2026-10-12
- **Ce qui s'est passé :** en notant les remarques de Rhamone sur la stratégie de prix de Serge, Claude a écrit « l'avis de Rhamone l'emporte ». Rhamone : « je suis pas dictateur, juste des contre-propositions et explications pour Serge ».
- **Cause :** Claude a transformé un avis en décision finale.
- **Règle :** quand un humain réagit à la proposition de l'autre, note-le comme **contre-proposition avec sa raison**, laisse la place à une réponse (« 🗣️ <nom> » sous le bloc) et écris « discussion ouverte » dans STATUS. On peut construire sur une base provisoire, mais rien n'est figé tant que l'autre n'a pas répondu.

### L-34 — Une nouvelle catégorie touche aussi le Walk
- **Projet / date :** Fraul, 2026-10-17
- **Ce qui s'est passé :** en préparant l'ajout de 6 catégories, on a vu que chaque rayon d'une boutique du Walk a un portant placé à la main (`src/walk/models/store-layout.ts`). Un rayon sans portant fait planter la boutique.
- **Cause :** la liste des catégories du site était envoyée telle quelle au moteur 3D.
- **Règle :** le Walk ne reçoit que les catégories qui ont un portant (`src/walk/data.ts`). Toute nouvelle catégorie : dessin dans `art.ts`, puis portant dans `store-layout.ts` si elle doit apparaître en boutique, puis `npm run smoke`.

### L-35 — Une marque peut n'avoir que deux produits
- **Projet / date :** Fraul, 2026-10-18
- **Ce qui s'est passé :** avec les vrais produits du fournisseur, Travis Scott n'a qu'un hoodie et un short. Sa boutique 3D proposait quand même tous les rayons ; ouvrir un rayon vide faisait planter le panneau article.
- **Cause :** la démo donnait 6 articles à chaque marque dans chaque rayon ; le moteur supposait qu'un rayon n'est jamais vide.
- **Règle :** la boutique n'affiche que les rayons qui ont au moins un article (`stocked()` dans `src/walk/engine.js`) ; `npm run smoke` ouvre la boutique d'une marque qui a peu d'articles. Pour importer de nouvelles photos : `node scripts/import-catalogue.mjs <dossier>`, jamais d'édition à la main des fichiers générés.
