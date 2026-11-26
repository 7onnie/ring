---
name: punkt0-kommentar
description: Wo ring-client-api den Refresh-Token verwirft (rest-client.ts getAuth catch) und dass requestWithRetry Netzwerkfehler endlos wiederholt
metadata:
  type: project
---

`RingRestClient.getAuth` (packages/ring-client-api/rest-client.ts, catch-Block) setzt `refreshToken`/`authConfig` auf undefined bei JEDEM HTTP-Fehler des oauth/token-Aufrufs mit Refresh-Grant. `requestWithRetry` wiederholt Fehler ohne `.response` (Netzwerk/Timeout) alle 5 s unbegrenzt; HTTP-Fehler (5xx, 429) werden geworfen.

**Why:** Issue 7onnie/ring#1 – transiente Fehler verwarfen den rotierten Token.
**How to apply:** Tests laufen mit `bin/suite.sh` (vitest, installiert node_modules per `npm ci` falls fehlend). Kein `chmod` verfuegbar: Exec-Bit via `git add --chmod=+x` + `git checkout -- datei`.
