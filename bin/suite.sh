#!/bin/sh
# Testsuite des Repos: vitest in packages/ring-client-api. Braucht nur node/npm.
# Optional: SUITE_ARGS="test/rest-client.spec.ts" schraenkt auf Dateien ein.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)

if ! command -v node >/dev/null 2>&1; then
  echo "FEHLER: 'node' nicht gefunden - Testsuite kann nicht laufen." >&2
  exit 127
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "FEHLER: 'npm' nicht gefunden - Testsuite kann nicht laufen." >&2
  exit 127
fi

cd "$root" || exit 1

if [ ! -d node_modules ]; then
  echo "node_modules fehlt - npm ci ..."
  npm ci --no-audit --no-fund || { echo "FEHLER: npm ci fehlgeschlagen" >&2; exit 1; }
fi

cd "$root/packages/ring-client-api" || exit 1
# shellcheck disable=SC2086
exec npx vitest run ${SUITE_ARGS:-}
