#!/bin/bash
# Briefing de démarrage de session (Kelthen).
# 1) Prépare l'environnement (dépendances) en session web.
# 2) Récupère l'état réel du repo.
# 3) Affiche un briefing que Claude lit avant de répondre : ce qui a bougé, PR ouvertes,
#    ce que l'autre dev a fait, STATUS.md, règles de LESSONS.md.
# Ne doit jamais bloquer une session : aucune erreur n'est fatale.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT" || exit 0

if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && [ -f package.json ] && [ ! -d node_modules ]; then
  npm install --no-audit --no-fund >/tmp/session-start-npm.log 2>&1 \
    || echo "⚠️ npm install a échoué (voir /tmp/session-start-npm.log)."
fi

git fetch origin --prune --quiet 2>/dev/null || echo "⚠️ git fetch impossible : le briefing peut être en retard."

ME="$(git config user.name 2>/dev/null || echo '?')"
REPO_SLUG="$(git remote get-url origin 2>/dev/null | sed -E 's#(\.git)?$##; s#.*[:/]([^/]+/[^/]+)$#\1#')"

echo "================ BRIEFING DE SESSION ================"
echo "Repo : ${REPO_SLUG:-?} · Toi (git) : ${ME} · Branche : $(git branch --show-current 2>/dev/null || echo '?')"
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "⚠️ Changements locaux non commités :"; git status --short | head -10
fi

HAS_GH=""
if command -v gh >/dev/null 2>&1 && [ -n "${REPO_SLUG}" ] && gh api "repos/${REPO_SLUG}" --jq .id >/dev/null 2>&1; then
  HAS_GH="1"
fi

# Les commits sont souvent signés « Claude » quel que soit l'humain : l'auteur fiable
# est le compte GitHub qui a ouvert la PR.
echo
if [ -n "$HAS_GH" ]; then
  echo "--- 12 dernières PR mergées (date · humain · PR · titre)"
  gh api "repos/${REPO_SLUG}/pulls?state=closed&sort=updated&direction=desc&per_page=40" \
    --jq '[.[] | select(.merged_at != null)] | sort_by(.merged_at) | reverse | .[0:12][]
          | "\(.merged_at[0:10]) · \(.user.login) · #\(.number) · \(.title)"' 2>/dev/null
else
  echo "--- 15 derniers changements sur main (API GitHub indisponible : auteurs Git, peut-être « Claude »)"
  git log origin/main --no-merges --format='%ad · %an · %s' --date=short -15 2>/dev/null
fi

echo
echo "--- Branches actives (hors main), les plus récentes"
git for-each-ref --sort=-committerdate refs/remotes/origin \
  --format='%(committerdate:short) · %(refname:lstrip=3) · %(contents:subject)' 2>/dev/null \
  | grep -vE ' · (main|HEAD) · ' | head -8

if [ -n "$HAS_GH" ]; then
  echo
  echo "--- PR ouvertes"
  PRS="$(gh api "repos/${REPO_SLUG}/pulls?state=open&per_page=30" \
    --jq '.[] | "#\(.number) · \(.user.login) · \(.created_at[0:10]) · base=\(.base.ref) · \(.title)"' 2>/dev/null)"
  if [ -n "$PRS" ]; then
    echo "$PRS"
    LIMIT="$(date -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d 2>/dev/null || echo '')"
    if [ -n "$LIMIT" ]; then
      echo "$PRS" | awk -F' · ' -v lim="$LIMIT" '$3 < lim {print "⚠️ Ouverte depuis plus de 7 jours : " $1 " · " $5 " → la finir ou la fermer ?"}'
    fi
    echo "$PRS" | grep -v 'base=main' | sed 's/^/⚠️ Base différente de main : /'
  else
    echo "(aucune, ou API GitHub indisponible)"
  fi
fi

if [ -f STATUS.md ]; then
  echo
  echo "--- STATUS.md (état partagé)"
  head -c 6000 STATUS.md
fi

if [ -f LESSONS.md ]; then
  echo
  echo "--- Règles obligatoires (LESSONS.md)"
  awk '/^```/{fence=!fence; next} !fence && /^### L-[0-9]/{sub(/^### /,""); print ""; print; next}
       !fence && /^- \*\*Règle :\*\*/{sub(/^- \*\*Règle :\*\* /,"   → "); print}' LESSONS.md | head -c 9000
fi

echo
echo "--- Rappel"
echo "Avant toute tâche : CLAUDE.md §2 « Vérifier avant de faire » → verdict ✅ / 🟡 / 🔄 / ⛔ / 🆕, puis plan, puis OK de l'humain."
echo "======================================================"
exit 0
