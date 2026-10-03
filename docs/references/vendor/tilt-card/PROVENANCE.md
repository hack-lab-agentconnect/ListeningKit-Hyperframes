# tilt-card

Vendored for reading. Not a runtime dependency: nothing in src/ imports it.

- source: https://github.com/heygen-com/hyperframes
- commit: 835e0c16ec62681008682934c4751e630d9d5d7b
- licence: Apache-2.0 (the licence text is in the source repository; attribution is retained here)
- files: `registry/components/tilt-card/tilt-card.html`
- pulled: 2026-10-03

## Why it is here
Card tilt with depth layers: how a flat card gets a tilt that reads as a surface.

## What we took
- rotationX/Y small (<= 10deg), perspective from the parent
- inner layers at their own z

## Used by
src/lkdirector.mjs camera tilt (rx/ry per shot)
