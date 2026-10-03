# pan

**Lives in:** `src/camera/moves/pan.mjs`, `src/camera/index.mjs`

## What it is

A slow lateral slide from one element to the next, with a swing of yaw against the travel.

## When it comes to the composition

A beat with several things to say can walk from one to the next by the camera moving **across** the composition instead of pushing at each. The yaw swings against the direction of travel, a parallax that makes the depth set read, and the zoom stays gentle.

## How it works

`pose` interpolates the framed point from `shot.from` to `shot.to` on a smoother-step, holds zoom near 1.16 and swings yaw by `-dir * 10 * sin(pi u)`: it leaves, peaks mid-slide and returns to level on arrival.

## How it composes

After `push` or `follow`; before `pull` or `breathe`. Not right after a cut: a pan needs a settled starting frame.

## Rules and gates

| rule | enforced by |
| --- | --- |
| meets the move contract (semantics, params, a serialisable `pose`, a `film` mapping) | `test:camera` |
| the director plans it under the zoom budget and variety rules | `test:camera` (director) |
| slides from A to B with the yaw swinging against the travel | `test:camera` |

## Related

[camera/README](./README.md), [camera/director](./director.md), [POINTER_MOTION.md](../POINTER_MOTION.md)
