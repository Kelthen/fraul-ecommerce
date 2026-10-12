# KICKOFF.md — Démarrage d'un projet client

> À remplir **avant la première ligne de code**, pendant ou juste après la réunion de lancement.
> Les infos confirmées sont recopiées dans STATUS.md (« Infos client ») : c'est là que les deux Claude les lisent.

## 1. Contrat et paiement (leçon L-18)
- [ ] Devis signé
- [ ] Jalons de paiement écrits, par exemple : 30 % au démarrage · 40 % à la validation du design · 30 % avant la mise en ligne
- [ ] **Le site reste sur une URL de preview tant que le dernier jalon n'est pas payé**
- [ ] Le domaine, l'hébergement et les comptes (Vercel, Supabase, Stripe, Resend) : à qui appartiennent-ils ? Qui paie ?
- [ ] Nombre de tours de révision inclus, et prix d'un tour supplémentaire

## 2. Infos client à confirmer par écrit (leçons L-11, L-19)
- [ ] Nom officiel, slogan, mission
- [ ] **Localisation affichée** (ville, province), et si le site doit l'afficher ou non
- [ ] **Fuseau horaire** (ex. `America/Edmonton`)
- [ ] **Langue(s)** du site
- [ ] Email et téléphone publics (ou « pas de téléphone »)
- [ ] Dates des événements à venir, reconfirmées
- [ ] Mentions obligatoires (reconnaissance territoriale, mentions légales)

## 3. Contenu : une seule source (leçons L-20, L-25)
- [ ] **Un seul document de contenu**, partagé et versionné (Google Doc avec historique), propriétaire côté client nommé
- [ ] Chaque nouveau retour du client est ajouté **dans ce document**, daté, et pas dans un nouveau fichier
- [ ] Le contenu validé est recopié dans `docs/CONTENT.md`
- [ ] Liste « ce qu'on attend du client » avec dates, dans STATUS.md (« Bloqué — attend le client »)

## 4. Photos et visuels (leçons L-08, L-10, L-15)
- [ ] Un dossier Drive partagé, rangé par usage (`hero/`, `equipe/`, `evenements/`, `galerie/`), photos d'origine
- [ ] Le client confirme avoir les **droits** sur les photos et l'accord des personnes photographiées
- [ ] Logos des partenaires + autorisation écrite de les afficher
- [ ] Une photo validée **par emplacement** du design, avant le développement de la page
- [ ] Rappel au client : aucun emplacement ne restera vide, on met une photo existante en attendant la définitive

## 5. Accès partagés (leçon L-26)
- [ ] Repo GitHub créé depuis `kelthen/website-starter`, les deux devs ajoutés
- [ ] Projet Vercel dans l'équipe Kelthen, les deux devs membres
- [ ] Projet Supabase dans l'organisation Kelthen, les deux devs membres
- [ ] Domaine d'envoi Resend vérifié (DNS) **avant** de tester les emails
- [ ] Source des données décidée et écrite dans STATUS.md (ce qui vient du code, ce qui vient de la base)

## 6. Communication
- [ ] Canal Slack du projet + webhook entrant → secret `SLACK_WEBHOOK_URL` (voir `playbook/README.md`)
- [ ] Et/ou emails : `RESEND_API_KEY`, `NOTIFY_EMAILS`, `NOTIFY_FROM`
- [ ] Rythme de validation avec le client (ex. un point visuel par semaine) et **qui valide** côté client
- [ ] Table « Équipe » du CLAUDE.md remplie avec les vrais comptes GitHub et `git config user.name` (L-23)
- [ ] Test : ouvrir une PR d'essai et vérifier que les deux humains reçoivent la notification et le lien de preview
