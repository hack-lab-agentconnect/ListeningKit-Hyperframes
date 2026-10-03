# yaw

**Lives in:** `src/camera/moves/yaw.mjs`, `src/camera/index.mjs`

## What it is

A slow wide sweep around the composition so the depth and the sides of things show.

## When it comes to the composition

No target and no push: the camera stays wide and pivots about 13 degrees one way to the other while it drifts. It is the move for a beat about the **shape** of a thing (a relationship, a set) rather than one element of it, and it is where the extruded sides and the depth set earn their keep.

## How it works

`pose` sweeps `ry` from -13 to +13 degrees on a smoother-step, with a small lateral drift and a breath of pitch, at zoom 1.06.

## How it composes

Opens or closes a beat; before `follow`. A breathing move. Avoid it over a single focus element and for less than about 2 s.

## Rules and gates

| rule | enforced by |
| --- | --- |
| meets the move contract (semantics, params, a serialisable `pose`, a `film` mapping) | `test:camera` |
| the director plans it under the zoom budget and variety rules | `test:camera` (director) |
| sweeps through the full angle at a wide zoom | `test:camera` |

## Related

[camera/README](./README.md), [camera/director](./director.md), [POINTER_MOTION.md](../POINTER_MOTION.md)
