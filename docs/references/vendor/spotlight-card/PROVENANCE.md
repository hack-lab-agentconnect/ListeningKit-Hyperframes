# spotlight-card

Vendored for reading. Not a runtime dependency: nothing in src/ imports it.

- source: https://github.com/heygen-com/hyperframes
- commit: 835e0c16ec62681008682934c4751e630d9d5d7b
- licence: Apache-2.0 (the licence text is in the source repository; attribution is retained here)
- files: `registry/components/spotlight-card/spotlight-card.html`
- pulled: 2026-10-03

## Why it is here
A card with a scripted cursor spotlight: a pointer that is part of the choreography, not an overlay.

## What we took
- the cursor's path is authored data, evaluated from time
- the element reacts to the pointer arriving

## Used by
src/lkdirector.mjs __dir.cursor()
