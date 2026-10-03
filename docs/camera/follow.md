# follow

**Lives in:** `src/camera/moves/follow.mjs`, `src/camera/index.mjs`

## What it is

The camera trails the pointer loosely at its resting zoom: a lean toward where the cursor is, never a push.

## When it comes to the composition

The default way to stay with the cursor between moments, while it travels from one thing to the next. It is the connective tissue between the moves that do something, and because it never zooms there can be plenty of it. Following on every stop with a push is what made the earlier cut lose its clarity: following is not zooming.

## How it works

`pose` returns the pointer model's own lagged camera (`ctx.follow(t)`): about 0.75 s behind the pointer, gentle, held near zoom 1.12. The film mapping is a soft lean (`zoom 1.12`, a few degrees of tilt, no fit-to-element).

## How it composes

Opens after `breathe` and before `push`, `pan` or `cutpush`; never twice in a row; never the only move of a beat, because it never gives the eye a rest.

## Rules and gates

| rule | enforced by |
| --- | --- |
| meets the move contract (semantics, params, a serialisable `pose`, a `film` mapping) | `test:camera` |
| the director plans it under the zoom budget and variety rules | `test:camera` (director) |
| follow stays near the resting zoom (<= 1.2) | `test:camera` |

## Related

[camera/README](./README.md), [camera/director](./director.md), [POINTER_MOTION.md](../POINTER_MOTION.md)
