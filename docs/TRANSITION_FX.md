---
title: "Transitions, extrusion and the click - the method"
tags: [hyperframes, motion, transitions, fx, 3d]
status: active
created: 2026-10-03
---

# Transitions, extrusion and the click

How a cut between two compositions is built here, exactly as it was built for the sample
(`npm run lab:transition`, then `npm run render`), and how the repo makes sure the next one is built the
same way. Code: `src/lkfx.mjs` (pure functions of time), `src/lkextrude.mjs` (thickness),
`src/transitions/` (the registry: one module per transition, called by name), `src/build-demo.mjs` (the
sample). Gate: `npm run lint:transitions` + `npm run test:fx` (section 8).

Extends M6 (seams) in [MOTION_CRITERIA.md](./MOTION_CRITERIA.md) and [POINTER_MOTION.md](./POINTER_MOTION.md).
Obeys M13: **nothing fades**.

## 1. The structure: an adjustment layer over two compositions

This is the idea everything else hangs on, and the bug that taught it. The first version scaled each
composition on its own, so the "speed ramp" zoomed A and B independently, B arrived already zoomed in and
cropped, and nothing controlled the overall view. The fix is the After Effects idea of an **adjustment
layer**: one layer above the compositions that owns the whole picture.

```
parent composition (the film)
 |- #adj          ADJUSTMENT LAYER   scale = 1 + recoil + rush   (the speed ramp's camera)
 |   |- #gA       group A            stage + dither + composition A      (outgoing)
 |   |- #gB       group B            stage + dither + composition B      (incoming)  clip-path: THE MASK
 |   '- #pxedge   mask edges         the wipe front: white young cells + 2 px outlines
 |- #flash        (swap-style transitions only) the exposure overlay
 |- #rings        click rings        its own full-screen canvas, directly under the pointer, outside #adj
 '- .cursor       THE POINTER        topmost

 three layers, bottom to top:  the composite (#adj: stage, dither, the 3D elements)  <  the RINGS  <  the POINTER.
 The rings and the pointer are outside both groups, so no wipe or flash can clip or cover them: they persist through a transition.
```

- The **compositions know nothing about the transition.** Each owns only its own 3D camera (the pointer
  model's pose). They carry no rush and no recoil.
- The **adjustment layer** applies one scale to the composite (A, B and the mask together), so the zoom
  can never disagree between the two scenes.
- The **pointer and the rings sit outside it**, above everything, so no transition can hide the pointer.
  Their screen positions are scaled by the same factor about the frame centre (`sx()`), so they stay on
  the items the adjustment layer is zooming.

## 2. The four phases, in order

Every transition declares its phases relative to the seam (the moment B starts). For the pixel wipe:

```
ramp-out  >  flash  >  sweep  >  ramp-in
```

| phase | what happens |
|---|---|
| **ramp-out** | 0.7 s before the seam the clock accelerates to 3.2x (`tau`) **and** the adjustment layer rushes in (+0.8 zoom, ease-in `t^3`): the world accelerates *at the camera*. Both are needed: slow motion at 3x is still slow, so the transition reads as a speed ramp only because the zoom does too. |
| **flash** | a gunshot: 3-frame attack, fast tail, gone by 0.5 s. In the pixel wipe it lives **on the sweep front** (section 3), not over the frame. A recoil (`kickAt`, +0.07 zoom, settles in 0.3 s) fires on the adjustment layer. |
| **sweep** | the pixel mask crosses the frame left to right; B is revealed through it. |
| **ramp-in** | 0.7 s after the seam the clock and the zoom settle back to 1x (ease-out). |

### The speed ramp's clock
`tau(t)` is the integral of a speed curve (1x, up to 3.2x at the seam, back to 1x): monotonic, with
continuous speed. A composition runs on it through an **inner / master pair**: it owns a paused *inner*
timeline (the scene, exactly as a beat already is) and registers a *master* timeline whose one tween does
`inner.time(tau(t) - tau(offset))`. No scene code changes; plain GSAP scenes are ramped for free.

## 3. The pixel wipe is a mask, not an overlay

The incoming group is clipped by an SVG `<clipPath>` made of one `<rect>` per grid cell (120 px cells).
`wipeCells(age, spec)` returns the cells; each frame the rects are set to the cells' current size, and
`gB` shows only through them:

- each cell **scales 0 -> 1 with overshoot** (a spring-like back curve inside the wipe maths), never an alpha;
- the sweep runs across the frame (`dir`: right | left | down | up), **accelerates** (`accel < 1`, so the
  edge speeds up like the ramp) and has **seeded jitter**, so the edge is ragged;
- **A stays whole** wherever the sweep has not arrived: nothing covers the frame;
- the only thing painted over the scenes is the **front**: cells younger than `flashU` are solid white for
  a few frames (this is the gunshot), then settle into a **2 px outline**, then carry nothing;
- it is a **J-cut**: B is mounted at the seam and already playing (its entrances running) behind the first
  windows, while A is still live until the sweep completes (`timing().aEnd`).

> "0.5 flash": read as 0.5 seconds long with a hard attack. If half *intensity* was meant it is one number,
> `FLASH.peak` in `lkfx.mjs`.

### What not to do (each of these was a bug)
1. Scale the compositions separately for the ramp. -> the adjustment layer.
2. Wash the frame with a white overlay for the flash. It reads as a dissolve. -> the front.
3. Paint pixels *over* both scenes. -> clip B with them instead.
4. Fade anything. -> scale, mask, translate.

## 4. Extrusion: nothing in 3D is paper-thin

A card or dot that tilts and orbits while perfectly flat reads as a 2D sticker in a 3D scene. Every item in
the 3D world is a **slab**: `slab(opts)` (`lkextrude.mjs`) returns `layers` solid copies of the face's
silhouette stacked behind it at `step` px along -z (default 9 x 5 = 45 px).

- Hidden from the front (the face's black outer stroke is the same colour as the slab), they are the
  object's **sides** from any angle, and perspective tapers them.
- The host needs `class="x3d"` (`transform-style: preserve-3d`) and **must not** have `overflow: hidden`
  (it flattens its children to the plane).
- Slices inherit `border-radius` (a rounded card has a rounded slab; `round: true` for dots) and are static,
  so they never fight the host's own tweens and they scale with it.
- Colours step from the outline colour to a deeper one, so the sides band slightly instead of one flat slab.

## 5. The click: three 8-bit pixel rings

`drawRings(ctx, age, spec)`: **three concentric rings** radiating from the press, drawn as **8-bit pixel art** on one
global grid of `cell` px (default 4; a parameter, 3 to 8). Each ring is three pixel bands:

| band | colour | width |
|---|---|---|
| **core** | **white**, the inner colour, the same on every ring whatever it hit | 1 cell |
| **stroke** | the brand blue, a slightly pixelated stroke | 1 cell each side |
| **outline** | the system's black, the outer stroke | 1 cell each side |

So a ring never fades into the background: on a blue stage or a blue card the white core and black outline carry it;
on a white stage the blue stroke and black outline do. The inner colour does **not** adapt to the item any more (an
adaptive ring vanished on the one item it was not adapted for). Layers are drawn **across all rings** (every outline,
then every stroke, then every core) so a ring crossing another never cuts into its core.

Radius up to 150 px times the perspective scale at that depth, 0.1 s between rings, 0.62 s each. Each ring **unwinds
as it grows** (its arc shortens to nothing), so it leaves by scale, never by alpha. Drawn at the press's **screen**
position from `project()`, so it stays glued to the item as the camera moves.

## 6. Transitions are called by name

`src/transitions/index.mjs` is the registry: `get("pixel-wipe")`, `list()`, `validate(t)`. A module is:

```js
{ id, summary,
  semantics: { kind: "wipe" | "swap", jcut, use, avoid, pairs, needs, order },
  params: { ramp: { out, in, peak, rush }, flash, ...its own },
  phases(params), timing(params, seam),
  parent(ctx) -> { css, html, groupAStyle, groupBStyle, setupJS, frameJS } }
```

`semantics.use` / `avoid` say when it is right and wrong; `order` must equal `phases()` (checked).
Registered: **`pixel-wipe`** (J-cut mask; between scenes of different kinds) and **`scale-swap`** (outgoing
scales to 0, incoming scales up from 0, behind a flash; between scenes of similar weight).
`npm run lab:transition [id]` builds the 10 s sample for any of them; `npm run render`.

**To add one:** write `src/transitions/<id>.mjs`, register it, describe it in this file and in
`src/transitions/README.md` (the gate requires both), then run `npm run lint`. It cannot be committed until
its sample obeys section 8.

## 7. What the sample shows

| | |
|---|---|
| **A** | the 5-second pointer lab: five extruded red dots at five depths; the pointer points at three and clicks two |
| **B** | four extruded design-system cards at four depths (card, then tile, then icon, then label); points at two, clicks two |
| **the join** | ramp 4.3 -> 5.7 s; the sweep starts on the seam (5.0 s); the pointer never leaves the screen |

## 8. How it is enforced

| gate | what it checks | when |
|---|---|---|
| `npm run test:fx` | the maths: flash, ramp, rush, wipe cells (direction, acceleration, overshoot, no alpha, front-only fill), rings (3, 8-bit pixels on one grid, white core / blue stroke / black outline, cell param), slabs, registry contract, layer order (composite < rings < pointer) | `npm run lint`, pre-push |
| `npm run lint:transitions` | **regenerates the sample of every registered transition** and checks it, T1-T10 below | `npm run lint`, pre-commit (regenerate + stage), pre-push |
| `lint-design` | the design system on all sources (no blur, no fade, no bare drop...) | pre-commit, pre-push |

| rule | requirement |
|---|---|
| T1 contract | the module passes `validate()` |
| T2 documented | its id is in this file and in the transitions README |
| T3 mask | a wipe clips the incoming group; no full-frame fill, no flash overlay |
| T4 adjustment | one `#adj` wraps A, B and the mask and carries the scale; compositions carry no rush |
| T5 layers | composite < rings < pointer: the rings are one full-screen canvas outside both groups and the adjustment layer, directly under the cursor; a transition never touches the cursor |
| T11 lip | every slab's lip is derived at render time from the element's own colour (OKLCH): `__lip.apply(root)` runs, no slice has a colour |
| T6 no fades | no opacity / autoAlpha / CSS opacity transition on content |
| T7 extrusion | every 3D item is a slab that **owns** its slices (`position:relative`, no unresolved `--slab:` marker); sample B is the table + its family |
| T8 rings | 3 pixel rings (3-8 px cell): white core, blue pixel stroke, black outline |
| T9 determinism | no `Math.random`, `Date.now`, timers, fetch |
| T10 fresh | the committed sample equals the generator's output |

## 9. Porting to the films (next)

The same structure applies to a film (a parent of ~30 beat compositions): one adjustment layer per film for
the ramp zoom, each seam named by a transition id from the registry, the pointer and rings on the film's
topmost layers (replacing the per-beat cursor and ripple), and every 3D item an extruded slab. Not done
yet; the gate above already defines what "done" means.
