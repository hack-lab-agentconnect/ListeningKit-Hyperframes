# composite

**Lives in:** `src/build-demo.mjs`, `src/build-beats.mjs`, `src/lkchrome.mjs`

## What it is

The composite is the **picture**: everything that is the scene and not an effect on it. Per composition it is a stack of
three things, bottom to top: the **stage** (the blue or white field), the **dither** (the pixel texture on it), and the
composition's own **components** (the 3D world: cards, tables, rows, satellites, ear cutouts).

## When it comes to the composition

Every beat of a film is a composite, and a transition is two composites with an effect between them. The composite is what
the camera moves: the stage wrapper (`.stagec`) is one 3D transform (perspective, translate, tilt), and the whole 3D world
lives inside it.

## How it works

- The stage wrapper sets `transform-style: preserve-3d` and every descendant inherits the 3D context, so slabs and the
  depth set keep their depth. (A flat wrapper would flatten them into the plane; this is why `extrudeCSS` sets
  `.stagec, .stagec *` to preserve-3d.)
- The stage alternates **blue / white** from beat to beat. Cards invert with it: a white card on blue, a blue card on
  white (DESIGN_SYSTEM). The lint rule M7 keeps neighbours alternating.
- Components enter by `scale 0 -> 1` on a spring and leave by `scale 1 -> 0`. Nothing fades.

## How it composes

| relation | what |
| --- | --- |
| below | nothing: it is the bottom of the stack |
| above it | the adjustment layer's effects (zoom, recoil), then the rings and the pointer |
| inside it | the camera's transform, the components' own transforms, the slabs |
| with a transition | each side of a cut is its own group; the transition masks or scales a group, never edits what is inside |

## Rules and gates

| rule | enforced by |
| --- | --- |
| nothing fades; scale in, scale out | `lint:design` `no-fade`, `lint:components` C4 |
| no blur anywhere | `lint:design` `no-blur` |
| 3D context preserved down to every slab host | `lint:components` C15, `lint:transitions` T7 |
| the stage alternates blue / white | `lint:pacing` M7 |

## Related

[layers/README](./README.md), [camera/README](../camera/README.md), [components/README](../components/README.md),
[DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md).
