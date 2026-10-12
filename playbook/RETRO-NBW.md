# Retour d'expérience — Network of Black Women (NBW)

> Projet : site de NBW (Next.js + Supabase + Stripe + Vercel), agence Kelthen.
> Période : 17 août → 10 octobre 2026. 62 PR, 2 développeurs (rhamon, serge), chacun avec son propre Claude.
> Rédigé le 12 octobre 2026 par le Claude de rhamon, à partir de l'historique Git, des 62 PR, des fichiers de coordination et de la conversation de travail.
>
> **Limite :** je n'ai pas accès aux sessions du Claude de Serge ni au projet Supabase de NBW. Ce qui concerne Serge vient uniquement de Git et des PR.

---

## 1. Le résumé en 6 lignes

1. **Le site a été livré et il est beau.** Les problèmes viennent du *process*, pas de la technique.
2. **Les deux Claude ne savaient pas ce que l'autre avait fait.** Résultat : du travail en double, et des décisions annulées puis réintroduites.
3. **Le système de synchro (journaux, verrous, TEAM-STATUS) reposait sur la discipline.** Il a été abandonné en 2 semaines.
4. **On a souvent codé ou mergé avant que l'humain ait vu le résultat.** D'où beaucoup d'allers-retours (photos, placeholders, hero).
5. **Le contenu client est arrivé en 4 versions, dont une erronée** (Toronto au lieu de l'Alberta). Chaque version a été traitée « à la main » sans comparaison systématique avec l'existant.
6. **Rien n'était prévu côté business** (jalons de paiement). En octobre, le client n'a pas payé et on n'avait aucun levier propre.

---

## 2. Chronologie

| Phase | Dates | Ce qui s'est passé | Problèmes apparus |
|---|---|---|---|
| **Setup** | 17 août | PR #1-#3 : docs, structure, CLAUDE.md « loi partagée » avec zones rhamon/serge, journaux, verrous, TEAM-STATUS auto. | Guide très lourd. Les identités dans la table (`sergesanou`) ne correspondaient pas aux vrais comptes (`serge2022`, `Jago`, `kelthenrift-prog`). |
| **Fondations + pages** | 17-20 août | rhamon livre Accueil, About, Get Involved, Contact, Donate (Stripe), puis **Programs (#9) et toutes les pages de Serge (#11)** le 18 août. | Serge ouvre **sa propre version de Programs (#28) le 20 août** : en attente 13 jours puis fermée. Travail en double. |
| **Mise en prod chaotique** | 19-23 août | Stripe en erreur (3 PR de diagnostic #18-#20), redéploiements forcés (#21, #31, #34), endpoint de debug ajouté puis retiré en prod (#35, #36). | Le bot `team-sync` poussait sur `main` et **annulait les déploiements** (corrigé dans #32). Debug fait directement en production. |
| **Mauvaise localisation** | 19 août | **#22 : site relocalisé à Toronto, Ontario.** | Le client est en **Alberta**. Corrigé seulement le 13 septembre (#53), soit 25 jours de contenu faux. |
| **Polish + coordination cassée** | 2-8 sept | Photos zoomables, primitives UI, mode événement Girl Talk. | **OWNERSHIP.yml corrompu** (contenu dupliqué, #43). Journal de Serge plus jamais mis à jour après le **2 sept**. |
| **Le hero** | 7-8 sept | Photo ajoutée au hero (#50), recadrée (#51), puis **retirée sur retour client « tellement plus moche qu'avant »** (#52). | Décision non consignée nulle part ailleurs que dans la PR. |
| **Questionnaires client** | 13-20 sept | Questionnaires du 15 et du 17 sept. Purge globale « sisterhood → network ». Overrides répétés de la zone de Serge. | **PR #58 ouverte vers une branche au lieu de `main`**, d'où #59 de rattrapage. Phrases bancales créées par le remplacement global (« network community », « united in network »). |
| **Conference + photos** | 17-20 sept | PR #61 : page Conference + photos partout. ~9 commits, 6 pages et des composants partagés. | **La photo du hero est réintroduite** alors qu'elle avait été rejetée le 7 sept. Placeholders vides livrés. Visages coupés. Allers-retours sur le bandeau CTA (4 essais). |
| **Fin de projet** | 7-10 oct | Demande de couper le site (impayé). Nouveau doc « Website Detail Edits ». | Aucun jalon de paiement prévu. Le doc était une **compilation des anciens questionnaires** avec d'anciennes captures. PR #54 toujours ouverte et obsolète. |

---

## 3. Les problèmes, un par un

Légende de « À qui » : **Claude** (le Claude de rhamon, moi), **Guide** (règles mal pensées), **Client**, **Outil**, **Business**.

### A. Synchronisation entre les deux devs et leurs Claude

| # | Ce qui s'est passé | Cause racine | Impact | À qui | Règle |
|---|---|---|---|---|---|
| A1 | Programs construit 2 fois (#9 rhamon, #28 serge). Pages de Serge faites par rhamon (#11). | Aucun réflexe « vérifier si c'est déjà fait ». Le Claude de Serge ne voyait pas les PR de rhamon. | Une PR de Serge jetée, 13 jours d'attente, frustration. | Guide + Claude | L-03 |
| A2 | Journaux (`.claude/journal/*.md`) abandonnés : Serge le 2 sept, rhamon le 16 sept. | Le système reposait sur la discipline : il fallait penser à écrire. | TEAM-STATUS faux. Personne ne savait qui faisait quoi. | Guide | L-12 |
| A3 | `team-sync` ne se déclenchait que sur les branches `feat/**` quand un journal changeait. | Nos branches s'appelaient `content/*`, `chore/*`, `claude/*`. | TEAM-STATUS jamais rafraîchi. | Guide + Outil | L-12 |
| A4 | Le bot `team-sync` poussait sur `main` et annulait les déploiements Vercel. | Un commit automatique sur `main` relance un déploiement qui annule le précédent. | Changements « perdus » en prod (corrigé #32). | Outil | L-12 |
| A5 | OWNERSHIP.yml corrompu (#43). | Fichier de coordination édité à la main par deux personnes. | Correctif d'urgence. | Guide | L-22 |
| A6 | Identités : la table du CLAUDE.md attendait `RhamonK` / `sergesanou`. Git montre `Jago`, `serge2022`, `kelthenrift-prog`, `Claude`. | Table jamais vérifiée contre la réalité. | La vérification d'identité « au début de session » ne pouvait pas marcher. | Guide | L-23 |
| A6b | Dans Git, presque tous les commits sont signés « Claude ». Impossible de savoir via `git log` qui, de rhamon ou de serge, a fait quoi. | Les sessions Claude commitent sous leur propre nom. | L'historique ne sert pas à se coordonner. | Outil | L-27 |
| A7 | Les overrides de la zone de Serge sont devenus la norme (events, programs, conference). | Zones trop rigides par rapport à la réalité (un dev beaucoup plus actif). | Le protocole « STOP, zone de l'autre » ignoré en permanence. | Guide | L-03 |

### B. Communication entre toi et Claude

| # | Ce qui s'est passé | Cause racine | Impact | À qui | Règle |
|---|---|---|---|---|---|
| B1 | **Photo du hero réintroduite le 20 sept** alors que le client l'avait rejetée le 7 sept (#52). | Claude n'a pas regardé l'historique du fichier avant d'agir. La décision n'était consignée que dans une PR. | Le client redemande aujourd'hui de l'enlever. Crédibilité. | Claude | L-01 |
| B2 | Brief de réunion : « PayPal oui ou non ? » alors que **PayPal est en ligne depuis le 20 août** (#25). | Claude a listé les décisions de mémoire, sans vérifier le code. | Question inutile posée au client. | Claude | L-02 |
| B3 | Codé ou mergé sans montrer le visuel (« il ne faut pas faire un truc sans qu'on soit d'accord »). | Pas de boucle obligatoire « plan → OK → preview → OK → merge ». | Retravail, perte de confiance. | Claude + Guide | L-09 |
| B4 | « Le reste c'est pour les events » pris au pied de la lettre → collage Conference laissé en placeholders. | Instruction ambiguë non reformulée. | Retour « pourquoi c'est vide ? ». | Claude | L-07 |
| B5 | Placeholders visibles livrés (« Photo coming soon », tuiles grises). | Choix technique « placeholder propre » sans connaître la sensibilité du client. | « Les placeholders ça les fait chier. » | Claude | L-08 |
| B6 | Photos : visages coupés, 4 essais sur le bandeau CTA, collage mal cadré. | Cadrage `cover` au centre par défaut, ratio du conteneur ≠ ratio de la photo, pas de vérification visuelle avant push. | Une demi-journée d'allers-retours. | Claude | L-10 |
| B7 | Lien de preview Vercel introuvable pour toi. | Claude donnait un motif d'URL (`…-*.vercel.app`) au lieu du lien réel. | Tu ne pouvais pas valider. | Claude + Outil | L-24 |

### C. Contenu et client

| # | Ce qui s'est passé | Cause racine | Impact | À qui | Règle |
|---|---|---|---|---|---|
| C1 | Site placé à **Toronto** (#22) au lieu de l'**Alberta**. | Localisation non confirmée au démarrage. | 25 jours de contenu faux, puis une PR de migration (#53). | Client + Guide | L-11 |
| C2 | 4 versions de questionnaire (15 sept, 17 sept, 20 sept, « Website Detail Edits » d'octobre). | Pas de source unique de contenu côté client. | Chaque version re-vérifiée à la main. La dernière était une compilation avec d'anciennes captures. | Client + Guide | L-20 |
| C3 | Remplacement global « sisterhood → network » → « network community », « united in network ». | Rechercher/remplacer sans relire chaque phrase. | Le client l'a remarqué. | Claude | L-06 |
| C4 | Coquilles client (conférence « mars 2026 » au lieu de 2027), Girl Talk reporté à l'an prochain. | Dates non reconfirmées. | Corrections tardives. | Client | L-11 |
| C5 | Contenu manquant pendant des semaines (bios, logos sponsors, prix, mot de passe Pixieset). | Pas de liste « ce qu'on attend du client » avec dates. | Le site a vécu avec des trous. | Client + Business | L-25 |

### D. Git et merges

| # | Ce qui s'est passé | Cause racine | Impact | À qui | Règle |
|---|---|---|---|---|---|
| D1 | **PR #58 ciblait `feat/rhamon/nbw-content-update` au lieu de `main`.** Mergée dans la mauvaise branche. | Base de PR non vérifiée. | PR #59 de rattrapage. Tu croyais que c'était en prod. | Claude | L-04 |
| D2 | « J'ai déjà mergé, comment tu peux encore ajouter ? » | Une branche mergée a été réutilisée pour de nouveaux commits. La branche `claude/rhamon-docs-update-5c8xe5` a porté 13 PR différentes (#40-#52). | Confusion sur ce qui est en prod. | Claude + Outil | L-05 |
| D3 | PR #61 fourre-tout : Conference + About + Events + Programs + News + Home + composants partagés. ~9 commits. | Chaque retour a été ajouté à la PR en cours. | Difficile à relire, impossible à annuler partiellement. | Claude | L-17 |
| D4 | PR #54 ouverte depuis le 13 sept, obsolète. | Pas de ménage des PR. | Bruit. | Guide | L-21 |
| D5 | PR de rhamon mergées le jour même, sans relecture croisée (exigée par le CLAUDE.md). | Règle irréaliste à deux, sans notification. | Erreurs non vues par un second regard. | Guide | L-24 |

### E. Technique et outils

| # | Ce qui s'est passé | Cause racine | Impact | À qui | Règle |
|---|---|---|---|---|---|
| E1 | `node_modules` absent au démarrage d'une session → build impossible. | Pas de hook de démarrage. | Temps perdu à chaque session. | Outil | L-13 |
| E2 | `npm run lint` ouvre un assistant interactif : ESLint jamais configuré. | La « Definition of Done » exigeait un lint qui n'existait pas. | Lint jamais passé de tout le projet. | Guide | L-13 |
| E3 | Debug en production : endpoint de diagnostic ajouté puis retiré (#35/#36), redéploiements forcés (#21, #31, #34), 3 PR Stripe (#18-#20). | Pas de procédure « diagnostiquer sur une preview + logs Vercel ». | Historique pollué, risque en prod. | Claude + Guide | L-14 |
| E4 | Photos Drive trop lourdes pour passer par Claude (une photo de 1 Mo pèse plusieurs centaines de milliers de tokens). | Limite technique des connecteurs. | Contournement par des Word (PICS_NBW.docx). | Outil | L-15 |
| E5 | La même photo copiée sous 5 noms différents (`home/`, `programs/`, `news/`, `events/`…). | Pas de registre d'images. | Dépôt alourdi. Changer une photo = 5 fichiers. | Claude | L-16 |
| E6 | Données : code de secours (`FALLBACK_*`) vs Supabase. On ne sait pas ce que la prod affiche vraiment. Le projet Supabase NBW n'est pas accessible depuis le compte connecté. | Deux sources de vérité. Accès non partagés. | Modifier le code peut ne rien changer en prod. | Guide + Business | L-26 |
| E7 | Fuseau horaire de l'Est (`-04:00`) dans un projet en Alberta (`-06:00`/`-07:00`). | Valeur copiée sans réfléchir. | Heures d'événements fausses de 2 h. | Claude | L-19 |
| E8 | Connecteurs instables (Vercel déconnecté, Stripe non autorisé). | Sessions non interactives. | Certaines actions impossibles pour Claude. | Outil | — |

### F. Business

| # | Ce qui s'est passé | Cause racine | Impact | À qui | Règle |
|---|---|---|---|---|---|
| F1 | Impayé en octobre. Demande de couper le site, bloquée par les garde-fous de Claude. | Aucun jalon de paiement ni clause de mise en ligne. Le site était en prod avant d'être payé. | Pas de levier propre. Risque de réputation. | Business | L-18 |

---

## 4. Ce qui a bien marché (à garder)

- **Les données de secours** (`FALLBACK_*`) : le site ne casse jamais, même sans base.
- **L'accessibilité** : contraste AA, navigation clavier, `alt`.
- **Les emails** (Resend) : contact, double opt-in newsletter conforme à la loi canadienne (CASL).
- **Le brief de réunion** préparé avant chaque appel client.
- **L'override explicite** (« tu peux toucher la zone de Serge ») quand il était annoncé clairement.
- **La vérification point par point** d'un document client avant de coder (fait en octobre, a évité de refaire 90 % du travail).

---

## 5. Plan d'action

| # | Action | Livrable | Où |
|---|---|---|---|
| 1 | Claude **vérifie avant d'agir** (Git, PR, STATUS, décisions, leçons) et répond « fait / partiel / refusé / à faire ». | §2 du CLAUDE.md v2 | `playbook/starter/CLAUDE.md` |
| 2 | Une **mémoire d'entreprise** des erreurs, lue à chaque session, enrichie à chaque correction. | LESSONS.md pré-rempli (27 leçons NBW) | `playbook/starter/LESSONS.md` |
| 3 | Un **état partagé unique** : fait, en cours, à faire, bloqué client, **décisions**. Remplace journaux, verrous, TEAM-STATUS, OWNERSHIP. | STATUS.md | `playbook/starter/STATUS.md` |
| 4 | Un **briefing automatique** à l'ouverture de chaque session (dernières PR, ce que l'autre a fait, leçons). | Hook de démarrage | `playbook/starter/.claude/` |
| 5 | **Notifications automatiques aux humains** (Slack et/ou email + commentaire PR) avec résumé lisible et lien de preview réel. | GitHub Action | `playbook/starter/.github/workflows/notify-team.yml` |
| 6 | PR avec une section **« Résumé pour l'équipe »** en langage simple. | Modèle de PR | `playbook/starter/.github/pull_request_template.md` |
| 7 | Checklist de **démarrage client** : contrat avec jalons, localisation, source unique de contenu, photos, accès partagés. | KICKOFF.md | `playbook/starter/docs/KICKOFF.md` |
| 8 | Outillage : ESLint configuré, script d'optimisation des photos. | Fichiers prêts | `playbook/starter/` |
| 9 | Créer le repo modèle `kelthen/website-starter` à partir de `playbook/starter/`. | Repo GitHub « template » | À faire avec ton accord |
| 10 | Faire valider le playbook par Serge avant le prochain projet. | Relecture | Serge |
