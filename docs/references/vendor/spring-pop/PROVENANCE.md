# spring-pop

Vendored for reading. Not a runtime dependency: nothing in src/ imports it.

- source: https://github.com/heygen-com/hyperframes
- commit: 835e0c16ec62681008682934c4751e630d9d5d7b
- licence: Apache-2.0 (the licence text is in the source repository; attribution is retained here)
- files: `registry/components/spring-pop/spring-pop.html`
- pulled: 2026-10-03

## Why it is here
A badge that pops in from a visible near-rest scale, overshoots once and settles.

## What we took
- start from a visible scale (not 0) for the card itself
- one overshoot, then settle

## Used by
src/lkdirector.mjs __dir.anatomy()
