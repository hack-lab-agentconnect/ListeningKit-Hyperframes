# editorial-flash-overlay

Vendored for reading. Not a runtime dependency: nothing in src/ imports it.

- source: https://github.com/heygen-com/hyperframes
- commit: 835e0c16ec62681008682934c4751e630d9d5d7b
- licence: Apache-2.0 (the licence text is in the source repository; attribution is retained here)
- files: `registry/blocks/editorial-flash-overlay/editorial-flash-overlay.html`
- pulled: 2026-10-03

## Why it is here
A finite, seek-safe exposure flash used to hide a cut.

## What we took
- light layers with finite duration, no looping CSS
- the cut happens at the peak, not before or after it

## Used by
src/build-beats.mjs  the .flash layer and the seam timeline
