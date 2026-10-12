# Playbook Kelthen

Ce dossier tire les leçons du projet NBW et contient le **kit de démarrage** des prochains sites.

| Fichier | À quoi il sert |
|---|---|
| [`RETRO-NBW.md`](RETRO-NBW.md) | Le retour d'expérience NBW : chronologie, problèmes, causes, plan d'action. |
| [`starter/`](starter/) | Le kit à copier à la racine de chaque nouveau projet. |

## Ce que contient le kit (`starter/`)

| Fichier | Rôle | Qui le lit / l'écrit |
|---|---|---|
| `CLAUDE.md` | Manuel de travail. Règle n°1 : **vérifier avant de faire**, puis répondre ✅ fait / 🟡 partiel / 🔄 en cours / ⛔ refusé / 🆕 à faire. | Chargé automatiquement par chaque Claude |
| `LESSONS.md` | **Mémoire des erreurs.** 27 leçons NBW. Claude ajoute une leçon à chaque correction. | Affiché au démarrage, enrichi par Claude |
| `STATUS.md` | **État partagé unique** : en ligne, en cours, à faire, bloqué client, décisions, infos client. | Les deux Claude, mis à jour dans chaque PR |
| `.claude/settings.json` + `.claude/hooks/session-start.sh` | **Briefing automatique** à l'ouverture de chaque session : dernières PR mergées (avec le vrai humain), PR ouvertes, PR oubliées, STATUS, règles. Installe les dépendances. | Exécuté automatiquement |
| `.github/pull_request_template.md` | Chaque PR commence par un **« Résumé pour l'équipe »** en langage simple. | Claude le remplit |
| `.github/workflows/notify-team.yml` | **Notifications automatiques** aux deux humains (Slack et/ou email) : PR ouverte, mise à jour, preview prête (vrai lien), mergée, en ligne. Le lien de preview est aussi posté sur la PR. | GitHub, à chaque événement |
| `docs/KICKOFF.md` | Checklist de lancement : contrat et jalons, infos client, source unique de contenu, photos, accès partagés. | Les humains, au kickoff |
| `scripts/optimize-images.mjs` | Redimensionne et compresse les photos du client (ex. 1,8 Mo → 195 Ko). | Claude, à chaque nouvelle photo |
| `.eslintrc.json` | Lint configuré dès le premier jour, sans question interactive. | `npm run lint` |

## Démarrer un nouveau projet

1. **Créer le repo** depuis le modèle `Kelthen/website-starter` (bouton « Use this template »), ou à défaut copier le contenu de `starter/` à la racine du nouveau repo.
2. **Remplir les `{{…}}`** dans `CLAUDE.md` (équipe, zones) et `STATUS.md` (infos client).
3. **Faire le kickoff** avec `docs/KICKOFF.md`, puis recopier les infos confirmées dans `STATUS.md`.
4. **Brancher les notifications** (voir ci-dessous) et tester avec une PR d'essai.
5. Installer `sharp` en dépendance de dev pour le script photos : `npm i -D sharp`.

## Brancher les notifications

Dans GitHub : *Settings → Secrets and variables → Actions*.

**Slack (recommandé)** — espace Kelthen, canal par défaut **#prd-site-template**
1. Sur [api.slack.com/apps](https://api.slack.com/apps) : créer une app « Kelthen GitHub » dans l'espace Kelthen (une seule fois pour tous les projets).
2. Activer **Incoming Webhooks**, puis **Add New Webhook to Workspace** et choisir le canal (#prd-site-template, ou un canal dédié au projet client).
3. Dans le repo du projet, ajouter le secret `SLACK_WEBHOOK_URL` avec l'URL copiée.

Le connecteur Slack de Claude permet à Claude d'écrire dans Slack pendant une session, mais pas de créer ce webhook : l'étape 1-2 se fait à la main, une fois.

**Email (en plus ou à la place)**
1. Domaine d'envoi vérifié dans Resend (sinon Resend n'envoie qu'au propriétaire du compte : c'est ce qui a bloqué les emails NBW).
2. Secret `RESEND_API_KEY`.
3. Variables `NOTIFY_EMAILS` (ex. `rhamon@…,serge@…`) et `NOTIFY_FROM` (ex. `Kelthen Bot <bot@kelthen.ca>`).

**Optionnel :** variable `PROJECT_NAME` (nom court affiché dans les messages).

Sans aucune configuration, le lien « Preview prête » est quand même posté en commentaire sur chaque PR.

## Faire vivre la mémoire

- **Pendant le projet :** chaque Claude ajoute ses leçons dans `LESSONS.md` du projet (à partir de L-28).
- **En fin de projet (ou chaque mois) :** relire les nouvelles leçons ensemble et faire remonter celles qui valent pour tous les projets dans le kit (`kelthen/website-starter`). Le projet suivant démarre avec toutes les leçons accumulées.
- **Serge et rhamon valident** toute modification du kit, car les deux Claude devront la suivre.
