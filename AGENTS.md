<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Règles pour tout agent IA hors Claude (ChatGPT, Codex…) — Rhamone, 8 nov. 2026

Ce dépôt est le site e-commerce TakeUrClothes, en production. Deux humains (Rhamone, Serge) et leurs Claude y travaillent.
**Lis d'abord `CLAUDE.md`, `STATUS.md` et `LESSONS.md` : ces règles s'appliquent aussi à toi.**

1. **Jamais de push sur `main`**, jamais de force-push, jamais de merge. Une branche `feat/gpt/<sujet>` (ou `fix/gpt/…`) depuis `origin/main` à jour, puis une PR vers `main`. Rhamone merge après relecture.
2. **Une PR = un sujet**, petite (environ 400 lignes au plus). Section « Résumé pour l'équipe » remplie (`.github/pull_request_template.md`).
3. **Avant chaque PR** : `npm run lint`, `npx tsc --noEmit`, `npm run build` passent. Tests du modèle touché : `node --test src/models/<dossier>/<fichier>.test.ts`.
4. **Aucune clé, aucun mot de passe, aucun jeton** dans le code, les commits ou les PR. Les secrets vivent dans Vercel.
5. **Sans l'accord écrit de Rhamone, ne touche pas** : la base Supabase (migrations, données), Stripe, les prix et marges (`src/models/pricing/`), les e-mails envoyés à des clients, la connexion admin (`src/lib/server/admin-*`), `next.config.ts` (en-têtes de sécurité).
6. **Ne refais ni ne défais le travail des autres** : vérifie `STATUS.md` (section « Décisions ») et les PR ouvertes avant d'écrire du code. Une décision écrite ne se contredit pas sans le dire dans la PR.
7. **Aucune trace d'IA** dans Git et GitHub (pas de « Co-Authored-By », « Generated with… », lien de session). Auteur Git : `Kelthen`.
8. **Textes du site en français**, copiés mot pour mot depuis `docs/CONTENT.md` quand ils y sont. **Aucun pays affiché** sur le site. Pas de logos de marques copiés.
9. Next.js 16 a changé : lis `node_modules/next/dist/docs/` avant d'utiliser une API (bloc ci-dessus).

## Travailler avec Claude (Rhamone, 8 nov. 2026) — pour ne pas gaspiller et bien créer

Claude réalise ; toi, tu prépares et tu vérifies. Claude relit tes PR et te répond en commentaire quand une consigne manque de précision : applique ses remarques.

**Une demande à Claude = une note courte et précise** (dans `docs/…` ou la PR) :
1. **Quoi**, en une phrase, avec les **mots de Rhamone** entre guillemets.
2. **Où** : la page et le fichier (`src/components/home/LooksStrip.tsx`…), après avoir cherché dans le code.
3. **Ce qui existe déjà** et ce qui ne doit pas changer (une décision de STATUS ou une leçon de LESSONS qui s'applique).
4. **Critère de réussite** visible : ce que Rhamone doit voir au téléphone (ex. « le plus grand à droite, les autres de plus en plus petits à gauche »).
5. **Références** : capture ou image dans `assets-src/references/<sujet>/`, avec ce qu'elle valide et ce qu'elle ne valide pas.

**À éviter** : répéter tout le contexte du projet, proposer plusieurs variantes sans en recommander une, écrire « à préparer » sans dire quoi.

**Vérifier** : avant chaque PR, `npm run check` (lint, CSS, types, **tous les tests**, build). Si un test échoue, même hors de ton sujet, dis-le en tête de la PR avec le nom du test (comme pour #103 : très utile).

**Images** générées : personnage entier sur un fond uni clair (Claude les détoure), vraies pièces du catalogue, et note ce qui n'est pas fidèle (texte déformé, chaussures inventées).
