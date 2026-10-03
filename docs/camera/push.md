# push

**Lives in:** `src/camera/moves/push.mjs`, `src/camera/index.mjs`

## What it is

A slow push in on the element that matters, landing with a hair of overshoot.

## When it comes to the composition

The one move that closes in. It is **rationed**: at most one per 6 s of beat, none in a beat shorter than 4.5 s, only on a focus click, and only after the element's entrance has peaked. Every zoom is a claim that this is the important thing, and they cannot all be.

## How it works

`pose` runs the camera spring (`cam`, f 0.9, z 0.72, 3.8 % overshoot) over the shot, from zoom 1.04 to 1.75, easing the framed point onto the target and tilting about 6 degrees of yaw. The film mapping fits the zoom to the element, capped near 1.85.

## How it composes

After `breathe` or `follow`; before `pull` or `pan`. A `pull` must follow it so the beat does not stay close.

## Rules and gates

| rule | enforced by |
| --- | --- |
| meets the move contract (semantics, params, a serialisable `pose`, a `film` mapping) | `test:camera` |
| the director plans it under the zoom budget and variety rules | `test:camera` (director) |
| closes in hard with a hair of overshoot, rising without stalling | `test:camera` |
| a close move only ever lands on a click, after its element has arrived (peak rule) | `test:camera` (director) |
| at most 1 per 6 s of beat | `test:camera` (director) |

## Related

[camera/README](./README.md), [camera/director](./director.md), [POINTER_MOTION.md](../POINTER_MOTION.md)
