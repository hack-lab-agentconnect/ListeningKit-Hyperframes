# camera-3d-captions

Vendored for reading. Not a runtime dependency: nothing in src/ imports it.

- source: https://github.com/heygen-com/hyperframes-community-skills
- commit: ba7a0bb6d3567d124c51f6074625043bfe0b32eb
- licence: Apache-2.0 (the licence text is in the source repository; attribution is retained here)
- files: `skills/camera-3d-captions/SKILL.md`, `skills/camera-3d-captions/references/recipes.md`, `skills/camera-3d-captions/assets/kit/cam3d.js`
- pulled: 2026-10-03

## Why it is here
The depth-group grammar: groups at different distances so camera moves pull them apart by parallax; focus follows depth; a whip-in that never lands.

## What we took
- every group gets its own depth; near is bigger, far is smaller and slower
- the camera creep keeps a held shot alive
- rules for keeping everything inside the frame (frame-bounds check)

## Used by
src/lksatellites.mjs (depth groups), src/lkdirector.mjs creep

## What we did not take
text in 3D, matte and talking-head plate: this series has no speaker and keeps normal subtitles
