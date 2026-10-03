# camera-rig-depth-stack

Vendored for reading. Not a runtime dependency: nothing in src/ imports it.

- source: https://github.com/heygen-com/hyperframes
- commit: 835e0c16ec62681008682934c4751e630d9d5d7b
- licence: Apache-2.0 (the licence text is in the source repository; attribution is retained here)
- files: `registry/components/camera-rig-depth-stack/camera-rig-depth-stack.html`
- pulled: 2026-10-03

## Why it is here
A card stack at different depths under a camera rig: the parallax idea behind the depth set.

## What we took
- perspective on a stable parent, preserve-3d on the world, z per layer
- the camera is the only thing that moves the layers relative to each other

## Used by
src/lksatellites.mjs, src/lkdirector.mjs __dir.pose()
