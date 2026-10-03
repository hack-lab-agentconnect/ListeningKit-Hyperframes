# caption-camera-follow

Vendored for reading. Not a runtime dependency: nothing in src/ imports it.

- source: https://github.com/heygen-com/hyperframes
- commit: 835e0c16ec62681008682934c4751e630d9d5d7b
- licence: Apache-2.0 (the licence text is in the source repository; attribution is retained here)
- files: `registry/components/caption-camera-follow/caption-camera-follow.html`
- pulled: 2026-10-03

## Why it is here
A camera that follows the content instead of the content moving: every pose is FITTED to the measured box of what is on screen, on a hand-solved cubic bezier.

## What we took
- fit each camera pose to a MEASURED bounding box, never a typed coordinate
- cubic-bezier ease solved in-file (Newton, bisection fallback): deterministic, any overshoot you like
- one shared amount tweened per move, each element carries its own share (radial smear)

## Used by
src/lkdirector.mjs  __dir.bez(), __dir.camera(), __dir.centre()

## What we did not take
its word-by-word text layout: the subtitles stay normal bottom captions (matt, 2026-10-03)
