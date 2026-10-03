# pull

**Lives in:** `src/camera/moves/pull.mjs`, `src/camera/index.mjs`

## What it is

A slow pull back out to the wide frame: the release after a push.

## When it comes to the composition

The camera lets go of the element and the whole composition returns to view, so the next beat starts from a frame the viewer can read. It is slow on purpose (the push was a decision, the pull is a breath out) and it lands on `breathe`.

## How it works

`pose` eases from the shot's `fromZoom` (the push it releases) back to 1.0 on a smoother-step curve, drawing the framed point back to centre and the yaw back to zero. The director turns a `pull` with no push before it into `breathe`.

## How it composes

Only after `push` or `cutpush`; before `breathe`. A breathing move.

## Rules and gates

| rule | enforced by |
| --- | --- |
| meets the move contract (semantics, params, a serialisable `pose`, a `film` mapping) | `test:camera` |
| the director plans it under the zoom budget and variety rules | `test:camera` (director) |
| eases back out to the wide frame (1.75 to 1.0) | `test:camera` |

## Related

[camera/README](./README.md), [camera/director](./director.md), [POINTER_MOTION.md](../POINTER_MOTION.md)
