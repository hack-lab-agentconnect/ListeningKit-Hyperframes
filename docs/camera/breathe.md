# breathe

**Lives in:** `src/camera/moves/breathe.mjs`, `src/camera/index.mjs`

## What it is

A wide, slow, almost-still frame: the camera's resting breath.

## When it comes to the composition

Opens most beats and sits between focused moments. Nothing is being pushed at: the camera drifts a few pixels, tilts a degree or two and swells a few percent on slow unrelated periods, so the frame is alive without telling the eye where to go. It is the **breathing room** that every close move is cut against; a push only reads as a push after a stretch of this.

## How it works

`pose` is a sum of slow sines (drift 34 px, swell 3 %, tilt 2.2 deg) with a per-shot phase. It stays within zoom 1.00 to 1.04.

## How it composes

A breathing move: it counts toward the beat's 40 % breathing share. Before `push`, `pan`, `cutpush`; after `pull`. Avoid it for more than about 4 s without a click in it.

## Rules and gates

| rule | enforced by |
| --- | --- |
| meets the move contract (semantics, params, a serialisable `pose`, a `film` mapping) | `test:camera` |
| the director plans it under the zoom budget and variety rules | `test:camera` (director) |
| stays wide (zoom 1.00 to 1.04) and drifts (alive, not frozen) | `test:camera` |
| every close beat is at least 40 % breathing moves | `test:camera` (director) |

## Related

[camera/README](./README.md), [camera/director](./director.md), [POINTER_MOTION.md](../POINTER_MOTION.md)
