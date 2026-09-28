#!/bin/bash
# Bloque tout `git commit` lancé par Claude tant que types, lint et tests ne
# passent pas : c'est la condition de fin de tâche imposée par CLAUDE.md.

commande=$(jq -r '.tool_input.command // empty')

if ! grep -qE '(^|[;&|[:space:]])git[[:space:]]+commit' <<< "$commande"; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 1

sortie=$( { npx tsc --noEmit && npm run lint && npm test; } 2>&1 )
if [ $? -ne 0 ]; then
  echo "Commit bloqué : la vérification (types, lint, tests) a échoué." >&2
  tail -n 40 <<< "$sortie" >&2
  exit 2
fi
