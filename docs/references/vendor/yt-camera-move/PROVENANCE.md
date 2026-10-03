# yt-camera-move

Vendored for reading. Not a runtime dependency: nothing in src/ imports it.

- source: https://github.com/heygen-com/hyperframes
- commit: 835e0c16ec62681008682934c4751e630d9d5d7b
- licence: Apache-2.0 (the licence text is in the source repository; attribution is retained here)
- files: `registry/components/yt-camera-move/yt-camera-move.html`
- pulled: 2026-10-03

## Why it is here
Dynamic zoom, slide and 3D tilt-pan helpers for any wrapper, with cubic-easing defaults.

## What we took
- move the WRAPPER, never the media
- zoom and tilt are one move

## Used by
src/lkdirector.mjs __dir.camera()
