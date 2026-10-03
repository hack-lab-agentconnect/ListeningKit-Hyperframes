---
title: "Animation - motion with mass"
tags: [hyperframes, motion, springs, camera, pointer]
status: active
created: 2026-10-03
---

# Animation: motion with mass

How things move in the films, as one system. The rest of the docs say *what* moves
([SCENE_GRAMMAR](./SCENE_GRAMMAR.md), [COMPONENTS](./COMPONENTS.md), [POINTER_MOTION](./POINTER_MOTION.md),
[TRANSITION_FX](./TRANSITION_FX.md)); this says *how it feels*, and how the repo makes sure it feels the same
everywhere.

> Cheap motion eases from A to B on a fixed curve. Expensive motion has **mass**: it accelerates, overshoots a
> hair, settles.

That line, and the technique behind it, is from the "ui-morph-colorful" reference (remorses,
gist `3d467b50a0519ef7859823046dc9c427`, vendored in spirit, not in code). Code: `src/lkspring.mjs`.

## 1. The five rules

1. **Springs, not curves.** Every entrance, exit, emphasis and the camera's zoom is a closed-form spring
   (`lkspring.mjs`). The ease `back.out(1.7)` is gone from the repo (94 call sites migrated) and a lint rule
   keeps it gone.
2. **Pure functions of time.** A spring's response is a closed form, not a simulation, so `value(t)` is exact at
   any `t` with no history: frame 812 renders without frames 0 to 811, and a seek anywhere is correct.
3. **One spring per change, never a restart.** When a value changes target several times (a camera zoom, a
   pointer, a container's width) you **add one spring per change**, each starting at its own time, and sum
   them. The motion stays continuous in value *and* velocity at every change (`track`).
4. **Nothing fades.** Every spring drives a **scale** (or a translate, or a mask). No opacity, no blur. This is
   where we part from the reference, which fades layers with opacity + blur: our entrance is scale 0 -> 1, our
   exit is scale 1 -> 0 on the time-reversed spring.
5. **The peak rule.** The pointer is on screen all the time; the elements are not. So the pointer and the camera
   **wait until an element's entrance mass is at the peak of its overshoot, then tween in close.** Before that
   the element is still rising and there is nothing steady to look at.

## 2. The springs (`lkspring.mjs`)

`S(t, f, z)` is the step response of a damped spring: `f` in Hz, `z` the damping ratio (`z < 1` overshoots,
`z = 1` is critical). `pulse(t, f)` rises to exactly 1 at `1 / (2 pi f)` and decays: a hit that does not stay.

| preset | f | z | overshoot | used for |
|---|---|---|---|---|
| `pop` | 3.0 | 0.62 | 8.4 % | the default entrance: a card, a row, a pill, a label |
| `snap` | 3.6 | 0.50 | 16.3 % | a tile or a heroicon: small and quick, so livelier |
| `soft` | 2.6 | 0.72 | 3.8 % | a note, a large panel: heavier, a hair of overshoot |
| `row` | 2.8 | 0.78 | 2 % | a table row: it rises out of its card and must never poke past it |
| `settle` | 3.2 | 1.00 | 0 % | a **return to a surface**: an element coming back down onto its card's plane. Never overshoots (below the plane it is behind the card and vanishes) |
| `cam` | 0.9 | 0.72 | 3.8 % | the camera's zoom: closes in with a hair of overshoot |
| `*In` | | | | the time-reversed spring (`popIn`, `snapIn`...): an exit that dips first (the mass gathering), then accelerates away |

In a page: `ease: __spr.pop` (a function), `__spr.popIn` for an exit. In component data: `"spr:pop"`.
`ease(name)` plays the whole spring across the tween's duration whatever it is, ending exactly on 1.

### `track(t, keys, spring)`: the technique that matters

```js
// keys: [[time, value, spring?], ...] sorted by time. One spring is added per change.
v = keys[0][1];
for (i = 1..) v += (keys[i][1] - keys[i-1][1]) * S(t - keys[i][0], f, z);
```

Used for the camera's zoom (section 4) and available for any value that gets re-aimed: a tab indicator, a width,
a position. `indicator(t, stops, width)` is the reference's stretch: the leading edge stiffer than the trailing one.
`loopT(t, dur)` pins the last frame to the first for a seamless loop.

## 3. The peak rule, concretely

```
entrance starts ──────────┐
                          ▼ peak (pi / wd of the spring, a fraction of the tween)
   mass rises ───────►  OVERSHOOT PEAK  ──► the hand lands, the camera tweens in close
```

- `peakTime(f, z) = pi / wd` is when a spring first reaches its overshoot peak; `peakDelay(preset, dur)` is that
  moment inside a tween of length `dur`. For the item entrance (`pop`, 0.5 s) it is **0.224 s** (`ENTRY_PEAK`).
- **The director** (`lkdirector.mjs`) computes `peakOfItem(slots, i)` for every item it retimes, pushes each
  press to `peak + HAND (0.26 s, the hand's arrival) + 0.04`, and starts each camera push no earlier than the
  peak. The stops carry `peakAt`.
- **The pointer model** (`lkpointer.mjs`) gets its camera zoom from `track` with the `cam` spring, keyed at the
  pointer's arrival (`tA - 0.1`) and its release (`tB + 0.25`), so the zoom has mass and lands with a hair of
  overshoot as the hand settles.

### How close the camera gets

The camera closes in **hard** on what the pointer is about to press: the push-in target is 2.1 (`ZOOM_IN`), the pointer
model's hover/press events use 1.7 / 2.0. The director fits the zoom to the element by whichever side asks for more
(a wide thin row fills the frame by its height and is framed on the hand, cropped at the sides, instead of staying
wide), never past the cap.

## 4. Where each piece lives

| piece | file | how it uses the springs |
|---|---|---|
| spring maths, presets, `track`, peak | `src/lkspring.mjs` | the source of truth; serialised into every page as `__spr` |
| component entrance (card, tile, icon, text) | `src/components/anatomy.mjs` | steps carry `"spr:pop"`; `__cmp.play` resolves them |
| scenes and treatments | `scenes.mjs`, `lkmotion.mjs` | `ease: __spr.pop / snap / soft`, exits `__spr.popIn` |
| pointer and camera in a film | `lkdirector.mjs` | the peak rule: presses and pushes wait for the item's peak |
| pointer and camera (model) | `lkpointer.mjs` | zoom = `track` with the `cam` spring, one spring per change |
| transitions | `src/transitions/` | the cut's own motion (mask sweep, rush); the entrance of the next scene is a spring |

## 5. How it is enforced

| gate | what it checks | when |
|---|---|---|
| `npm run test:spring` | `S` starts at 0, settles on 1, overshoots by exactly the closed form, **peaks at pi / wd**; each preset overshoots "a hair"; `track` is continuous in value **and velocity** at every change and a **pure function** (any seek order); the ease ends exactly on 1; `peakDelay` equals the ease's measured peak; the camera zoom **is** a `track` and agrees with `lkspring` | `npm run lint`, pre-commit (`springs`), pre-push |
| `lint-design` `no-cheap-ease` | no `back.out / back.in / back.inOut` in **any** file under `src/` (the spring module excepted): one spring system everywhere | `npm run lint`, pre-commit, pre-push |
| `lint-pacing` **M14** | the hand lands on an item, and the camera pushes in, only after the item's overshoot peak. Verified to bite: with the clamp off, 12 stops fail | `npm run lint`, pre-push |
| `lint-components` **C4** | every component entrance is a spring preset (`spr:pop / snap / soft`), starts from scale 0, writes no opacity or blur | `npm run lint`, pre-commit |
| `test:pointer` | the zoom's push has mass (<= 1.4 zoom/s), stays in range, and the camera stays continuous | `npm run lint`, pre-commit |

## 5a. Activation: lifting off a surface and coming back (a bug, and its rule)

An element inside a card is flat on the card's plane at rest (z = 0) and lifts (z > 0, its lip showing) while the
pointer hovers or presses it. Moving the pointer from one row to the next used to make the row it left **vanish**.
What was happening inside, and the three rules that came out of it:

| what happened | why | rule |
|---|---|---|
| the row it left disappeared for ~0.2 s | the release was an *overshooting* spring (`soft`, 3.8 %). Returning from z = 10 it dipped to **-0.38 px**, which is *behind the card's opaque face*, so the renderer hid the whole row and its text. The card plane is a wall. | **A return to a surface never overshoots.** Use `settle` (critically damped, 0 % overshoot): `__spr.settle` / `"spr:settle"`. Lint: `no-plane-dip` (design), C16 (components). |
| lift and release were separate tweens on the same `z` / `scale` | GSAP records a tween's start value the first time it renders. With overlapping tweens (a release still running when the next lift begins) the start depended on *which tweens had already rendered*. The render seeks in 6 parallel workers, so frames could disagree. | **Activation is a pure function of time**, one spring per change (`__cmp.activate`): each row has one value `a(t) = track(t, keys)`; a hover adds a `snap` spring, a release adds a `settle` spring; overlap is a sum; any seek order gives the same frame. Test: `test:spring` "activation". |
| nothing stopped a value from going below the plane | the floating point of summed springs can dip a hair under 0 | the driver **clamps `a(t)` at 0**: `z = lift * max(0, a)`. The card plane is a hard floor. |

Two build-time guards sit with it: activation may only start after a row's entrance (which writes the same `z` and
`scale`) has finished, and the hand may only arrive after the row's overshoot peak (M14). `test:spring` reproduces the
original bug (releasing on `soft` undershoots by -0.38 px) and asserts the fix (`settle` does not).

## 6. Doing it: recipes

**An entrance.** Write it as a component step (`step("card", sel, at)`; the ease defaults to the role's spring) or,
in a scene's `anim`, `tl.fromTo(el, { scale: 0 }, { scale: 1, duration: 0.5, ease: __spr.pop }, at)`. Tiles and
icons use `__spr.snap`; a note or a big panel `__spr.soft`.

**An exit.** `tl.to(el, { scale: 0, duration: 0.35, ease: __spr.popIn }, at)`: it dips a hair first, then goes.

**Emphasis (the focus row lifts).** `__cmp.lift(tl, qq, sel, at, 1.015)`: a short spring to a larger scale; it
never touches opacity.

**Aiming at an element.** Do not pick a time: take `peakOfItem(slots, i)` from the director (or
`peakDelay("pop", dur)` from `lkspring` in a lab) and land the hand at `peak + HAND`. A lab asserts it at build.

**A value that changes target.** `track(t, [[t0, a], [t1, b], [t2, c]], "cam")`. Never restart a tween.

**A new feel.** Add a preset to `SPR` in `lkspring.mjs` and its overshoot band to `test-spring.mjs`; never a
literal `{ f, z }` in a scene.

## 7. What we took from the reference, and what we did not

| taken | not taken, and why |
|---|---|
| closed-form `S`, `pulse` | `visStyle` / `swapAlpha`: layers fade with opacity and blur. We forbid both; every swap is a scale. |
| `track` (one spring per change) | the cyclic `c = -3..0` loop terms: the films are not loops (`loopT` exists for the day one is). |
| the preset table, "press starts before the click" (the hand arrives `HAND` before the press) | the 4x subframe `tmix` motion blur: that is blur by another route, and the render is already deterministic frame-by-frame. |
| `indicator` (leading edge stiffer than trailing) | the colour-flood wipe: our cut is the pixel-wipe mask ([TRANSITION_FX](./TRANSITION_FX.md)). |
| camera zoom as its own spring, offset in frequency from the shapes' (temporal coherence) | the audio cue export: the films are narrated, not beat-synced. |

## 8. Not done yet

The films still use the older segment-based pointer and camera in `lkdirector.mjs` (now with the peak rule);
porting them to the stateless `lkpointer` model, so the zoom spring is what renders in the films too, is the next
step, together with the transition layer, the pointer layer, the rings and the extruded components.
