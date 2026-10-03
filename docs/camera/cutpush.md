# cutpush

**Lives in:** `src/camera/moves/cutpush.mjs`, `src/camera/index.mjs`

## What it is

On the click, cut to the active element, then push in from there.

## When it comes to the composition

The camera does not travel: it **cuts** (a hard, instant reframe) to the element on its click, then settles into a push. The click is the cut point, the shared beat of video editing and motion design, and here the click and the camera agree about it. It gives the beat an edit inside it, which a continuous follow never can. It is the strongest move, so it is rationed hardest: at most one per beat, followed by a `pull`.

## How it works

`blend: 0` on the shot makes the hand-over a cut: the only discontinuity the camera is allowed. `pose` starts at zoom 1.35 already framed on the target and eases to 1.7; the film mapping is a 0.14 s cut to zoom 1.95.

## How it composes

After `breathe` or `follow`; before `pull`. Never on a hover.

## Rules and gates

| rule | enforced by |
| --- | --- |
| meets the move contract (semantics, params, a serialisable `pose`, a `film` mapping) | `test:camera` |
| the director plans it under the zoom budget and variety rules | `test:camera` (director) |
| arrives already framed, then pushes | `test:camera` |
| the cut is the only jump in the camera | `test:camera` (continuity) |

## Related

[camera/README](./README.md), [camera/director](./director.md), [POINTER_MOTION.md](../POINTER_MOTION.md)
