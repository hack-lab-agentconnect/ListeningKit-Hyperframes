---
title: "Pointer motion — how to move the mouse so it never snaps"
tags: [hyperframes, motion, pointer, camera, continuity]
status: active
created: 2026-10-03
---

# Pointer motion

How the cursor moves, how the camera follows it, and how to prove neither one snaps. Written
**before** the fix, from a measured failure, so the fix is held to a method rather than tuned by eye.
Extends M4 and M8 in [MOTION_CRITERIA.md](./MOTION_CRITERIA.md).

## 1. What was wrong, measured

The first pointer was described as "a timeline of events" — approach, hover, click, retreat — each a
segment with its own easing, and the camera a list of tweens. Run offline at 240 Hz against the real
generated plans (all 83 beats that carry a pointer):

| failure | measured |
|---|---|
| the pointer **teleports** (> 150 px in one 1/240 s step) | **78 of 83 beats (94 %)**, worst **1,445 px**, typically twice a beat |
| the camera has tweens that **overlap in time on the same properties** | **83 of 83 beats** |
| speed implied by the teleports | 346,853 px/s (a cursor moves at ~1,500) |

Three causes, all structural, none a tuning problem:

1. **Gaps in coverage.** The pointer was a list of segments `[t0, t1)`. Between the end of one and the
   start of the next there were gaps (a retreat finishes at `st.at + 0.95`; the next approach departs at
   `arrive − travel`, which can be later). In a gap the lookup fell through to the *last* segment, so the
   pointer jumped to its final resting place for a few frames, then back. This is the "it starts, and then
   sometimes it jankily moves to another part".
2. **Every segment ends at zero speed.** Each had its own ease-in-out, so the pointer stopped dead at
   every waypoint, including ones it was only passing through, and re-accelerated. That reads as a loop
   of the same animation: stop, go, stop, go.
3. **The camera was a pile of independent tweens.** An entrance tween, an "in" shot, a creep, an "out"
   shot and a level-out, started on a schedule and ending on one, overlapping on `x y z rotationX
   rotationY`. Where two overlap, whichever renders last wins that frame, and the frame it loses is a snap.
   Also: the camera and the pointer were two systems that merely agreed on timestamps, so neither
   *followed* the other.

### 1b. The second problem is what it did, not how it moved

Even with the teleports fixed, the first pointer behaved wrongly: it clicked something **every ~2.5 s**
whatever the narration was doing, including components of the depth set that exist only as background
context and have nothing to click; the camera cut in and out on every click. The result was a pointer
whipping to things and a camera zooming for no reason. The pointer's job is to **carry the eye across
the scene**, and only occasionally to land on the one element the narration is about.

## 2. The rules

**P1 — One function of time, defined for every t.** The pointer is `position(t)`. Not segments, not
tweens, not "the current segment". If there is any `t` at which the code has to decide *which piece
applies*, there is a gap to fall into. (Stateless also means a seek anywhere is exact: HyperFrames renders
by seeking.)

**P2 — Continuous position AND velocity, by construction.** Not by tuning ease curves until it looks
smooth. Build `position(t)` out of things that are smooth to begin with (splines with shared tangents,
linear filters), so there is nowhere a velocity discontinuity could come from.

**P3 — Separate intent from feel.** *Intent* is where the pointer should be and when: a **guide path**
through waypoints. *Feel* is mass: a **second-order filter** applied to the guide. The guide says "arrive
at the button at 1.9 s"; the filter makes the pointer lag it a little, overshoot a little, and settle. Do
not bake mass into per-segment easing — that is how overshoot became extrapolation past the end of a
cubic and swung into loops.

**P4 — Slow where it matters, never stopped where it does not.** Click waypoints have zero tangent (the
pointer settles to press). Rest waypoints have a flowing tangent (the pointer passes through them on its
way to the next thing). A rest is a *waypoint*, not a stop.

**P5 — The pointer leads; the camera follows, late.** The camera is not authored on its own schedule. It
is the pointer's guide path run through a **slower, heavier filter**, so it is always a beat behind: the
pointer moves, then the camera catches up. It must never get ahead.

**P6 — The camera banks into the gap.** The distance between where the pointer *is* and where the camera
*is looking* (the lag error) drives yaw and pitch. Pointer far ahead to the right → the camera yaws toward
it; as it catches up, the yaw relaxes. That is the "flying behind it, a little out of sync" feel, and it
needs no keyframes: it falls out of the lag.

**P7 — One controller per property.** Exactly one thing writes the stage transform: the camera
function. No entrance tween, no creep tween, no level-out tween. The entrance is the camera starting
somewhere other than where it is aimed; the creep is the pointer's idle sway being followed; the level-out
is the guide ending at the origin. If a second thing needs to move the camera, add to the function.

**P8 — State follows the schedule, not the geometry.** Arrow → open hand → pointing hand → arrow is
decided from the click time (hover for 0.28 s before it, press for 0.22 s after), not from "is the
pointer near the target", which flickers on overshoot.

**P9 — Prove it offline.** Continuity is a number you can compute at 240 Hz from the model with no
browser. A pointer that has not been run through that test has not been fixed (section 5).

**P10 — Orbit is the default; an event is the exception.** Left alone the pointer travels a slow,
loose circle through the middle of the frame (a Lissajous: x on a cosine, y on a slower sine, z swaying).
Nothing needs to happen for it to be moving. It leaves the orbit only for an *event* and returns to it
afterwards, so there is never a "now it goes to the next thing" decision to get wrong.

**P11 — Events are semantic, and rare.** An event is the narration reaching something that is the point of
the beat: the focus row of a record, a cell of a table, the card the narrator just named. Two kinds:
a **point** (the pointer glides to it and the open hand hovers or circles it: it is being *shown*) and a
**click** (it is being *used*: the focus field, once). Nothing is clicked because a timer fired. At most one
event per ~3.5 s; most beats have zero or one.

**P12 — The background is never touched.** Components of the depth set are context. The pointer never
hovers, points at or clicks them, and the camera never flies to them. They exist to be passed by.

**P13 — Focus holds; the camera does not cut.** The camera has no shots. It drifts, loosely and slowly,
after the pointer (P5). When the pointer *holds* on a focus element the camera closes in on it slowly
(zoom up to ~1.35: the element may take the frame), and eases back out as the pointer returns to the
orbit. A zoom is a consequence of holding, never a scheduled move.

## 3. The model

All positions are world px **relative to the frame centre**; `z` is toward the camera.

### 3.1 The guide (intent): an orbit, blended toward events

```
orbit(t) = ( cx + Rx·cos(Ω·t + φ),  cy + Ry·sin(0.8·Ω·t + φ),  cz + Rz·sin(0.6·Ω·t + φ) )          Ω = 2π / period
guide(t) = orbit(t) + Σ_k w_k(t) · ( F_k(t) − orbit(t) )
```

Defaults: `Rx 380, Ry 150, Rz 120, period 8 s`, per-beat `φ` and direction so no two beats circle alike.

An **event** `k` is `{ t0, tA, tB, t1, p, click?, circle?, zoom }`: the pointer starts leaving the orbit at
`t0`, has arrived by `tA`, holds until `tB`, and is back on the orbit by `t1`. Its weight

```
w_k(t) = smootherstep((t − t0)/(tA − t0))   rising;     1   on [tA, tB];     smootherstep((t1 − t)/(t1 − tB))   falling
smootherstep(u) = 6u⁵ − 15u⁴ + 10u³                      (zero first AND second derivative at both ends)
```

so it blends *continuously* from a moving orbit to a point and back. There are no waypoints, no
segments, nothing to fall between, and no stop in the middle of the path: the orbit keeps moving
underneath the whole time. `F_k(t)` is `p`, or for a **circle** event `p + r·(cos φ_k, sin φ_k, 0)` with
`φ_k` advancing at a steady rate: the pointer *circles* the thing it is showing instead of freezing on it.
Events must not overlap (the planner enforces ≥ 3.5 s between them).

### 3.2 The pointer (feel)

```
pointer(t) = ∫ guide(t − s) · h(s) ds  +  sway(t)            h = impulse response of a 2nd-order system
h(s) = (ω² / ω_d) · e^{−ζωs} · sin(ω_d s),     ω_d = ω·√(1−ζ²)      (underdamped)
```

evaluated as a sum over `s = i·Δs` and renormalised so the weights add to 1. It is a **linear filter**:
position and velocity are continuous because the guide's are, and an under-damped `h` gives the
overshoot-and-settle that reads as mass with no extra code.

| axis | ω (rad/s) | ζ | why |
|---|---|---|---|
| x, y | 14 | 0.55 | lag ≈ 2ζ/ω ≈ 0.08 s, ~12 % overshoot on stopping: light, a little playful |
| z | 7 | 0.40 | slower and bouncier: the pointer *sways* toward and away from the camera |

`sway(t)` is a small, constant-amplitude, smooth oscillation (≈ 10 px x, 8 px y, 24 px z, unrelated
periods). It is added **after** the filter, so it can never disagree with it at a joint, and the pointer is
never parked.

### 3.3 The camera (follower)

```
aim(t)  = β · guide(t)                         β = 0.68: it leans most of the way toward the pointer, it does not chase it
Z(t)    = zoom0 + Σ_k w_k(t) · (zoom_k − zoom0)                 zoom0 = 1.04: held ~constant between events
[cam, zoomCam](t) = lag([aim, Z])(t)           critically damped, ω_c = 1.4 rad/s: ≈ 1.4 s behind
err(t)  = aim(t) − cam(t)                      how far the pointer has got ahead
yaw(t)  = clamp(−k_y · err_x, ±10°)            pitch(t) = clamp(k_p · err_y, ±6°)          k_y = k_p = 0.026 °/px
err is smoothed (a second critically damped filter, ω = 2.6, composed with the lag into ONE kernel):
the tilt leans, it does not twitch
```

`zoom` is lagged with the same filter as the position, so the camera closes in **after** the pointer has
settled on the focus element, slowly, and eases back out after it has gone. `pose(P, zoom, pitch, yaw)` is
the existing 3D pose function and the only writer of the stage transform (P7).

Loose and slow is the intent. Two numbers describe the lag and they are different things: the filter's
**mean delay** is `2/ω_c ≈ 1.4 s` (how long a step in the pointer takes to be absorbed), and what the test
**measures** as the camera trailing the pointer, by peak speed correlation, is **≈ 0.75 s**. Either way the
camera is still drifting toward where the pointer *was*, and the yaw and pitch (from that gap) make the
whole frame lean and sway.

### 3.4 State

Decided from the event schedule (P8), never the geometry.

| time | state |
|---|---|
| orbiting | arrow |
| `tA − 0.1 … tB` of an event | open hand (hover / point / circle) |
| `T_click … T_click + 0.22` (click events only, `tA + 0.3 ≤ T_click < tB`) | pointing hand, scale 0.84, ripple |

## 4. The lab

`npm run lab:pointer` builds `compositions/pointer-lab.html`: **5 seconds, 5 red dots at different
depths** (−620 … +330 px), a floor grid and a drop-line under each dot so depth is legible, and the pointer
carrying through the volume with the camera trailing it. Dots 1, 3 and 5 are *pointed at* (the open hand
circles them); dots 2 and 4 are *clicked*. Between visits the pointer is on its orbit. It uses the *same*
model code the production director will use (`src/lkpointer.mjs`), so what the lab proves is what ships.
Render it with `node scripts/entry.mjs pointer-lab && npm run render`.

It is the acceptance test for the **feel**; section 5 is the acceptance test for the **continuity and
the behaviour**.

## 5. Acceptance — numbers a machine can check

`npm run test:pointer` samples the model at 240 Hz and fails on any of:

| test | limit | what it catches |
|---|---|---|
| **no teleport** | max displacement per 1/240 s ≤ 20 px (≈ 4,800 px/s) | gaps, fall-through (old: 1,445 px) |
| **continuous velocity** | max change in velocity per 1/240 s ≤ 400 px/s | stop-start, segment joints (old: 346,837 px/s) |
| **orbit is the default** | pointer is on its orbit (Σw < 0.05) for ≥ 40 % of a 5 s lab clip, ≥ 60 % of a normal beat | a pointer that is always going somewhere |
| **events are rare** | clicks ≤ 1 per 3.5 s; events ≥ 3.5 s apart (planner) | the "keeps clicking for no reason" behaviour |
| **background untouched** | no event targets a depth-set component | clicking things that are only there as context |
| **arrives** | at each event hold, pointer within 40 px (xy) of its target | the filter lag eating the arrival |
| **camera is loose** | camera trails the pointer by 0.6 – 1.6 s (peak cross-correlation) | a camera that leads, or does not follow |
| **camera is slow** | camera speed ≤ 450 px/s, angular ≤ 20 °/s; zoom stays within 1.0 – 1.45 | random whips and zooms |
| **camera continuous** | the teleport and velocity tests on camera x, y, z, yaw, pitch, zoom | the overlapping-tween bug |

The same test runs over every beat of every film once the director is ported. Then, as always, frames:
the pointer in three consecutive frames around a hand-off, a hold with the camera closing in, and a seam.

## 6. In the films (the long videos)

The lab is one composition on one clock with five dots. A film is ~30 sub-compositions, each with its own
local clock starting at 0 and its own content. Everything above still holds; this section is what changes
when the model leaves the lab. Not built yet: this is the design, written down first.

### 6.1 The hero: what the camera is about

Every beat has one **main component** - the thing the narration is about - and the camera is always
framed on it. It is declared once per scene kind (`groupsFor` in `lkdirector.mjs`), measured from the real
layout (the director already measures element centres), and a beat can override it.

| scene | hero | | scene | hero |
|---|---|---|---|---|
| `table` | the table card `.tbl` | | `countup` / `costCount` | the number |
| `record` | the record panel `.pan` (its note is secondary) | | `transcript` | the transcript card `.tw` |
| `journey` | the row of cards `.jr` | | `converge` | the core card |
| `relations` | the panel + its nodes | | `split` | the two cards together |
| `typewriter` | the typed lines | | `zoomOut` / `sentiment` / `agentWork` | the card they build |

### 6.2 Always pushing forward, and following the mouse

The camera has two inputs and no shots:

```
aim(t)  = (1 − γ) · hero  +  γ · guide(t)             γ ≈ 0.55: held on the hero, pulled toward the pointer
zoom(t) = 1.00 → 1.14 over the beat (eased)  +  Σ w_k(t) · (zoom_k − 1.14)           events add a focus zoom
```

- **The push.** The baseline `zoom` creeps forward the whole time the scene is on screen, so the frame is never
  still and always closing on the hero. It is part of the camera function, not a tween.
- **The follow.** The pointer pulls `aim` away from the hero by `γ`, through the same heavy lag as before,
  so the frame leans and banks after the pointer while the hero stays in it.
- **Focus.** When the pointer holds on the focus element, `zoom_k` (fitted to that element's measured size, up
  to ~1.35) takes over: the element can take the frame. It eases back to the push when the pointer leaves.

### 6.3 Keeping position 1 and position 2 consistent across a cut

Three things, in order of importance.

1. **One orbit for the whole film.** The orbit is evaluated on **film time**, with the same centre, radii,
   period and phase in every beat (beats get an `offset` = their start in film time). The pointer is
   therefore on the same circle, at the same point on it, either side of a cut. There is no hand-off position
   to pass between beats (which is how the old build did it, and how it drifted).
2. **History is chained.** The pointer and the camera are filters over the *recent past* (the pointer
   ~0.5 s, the camera ~3-4 s). A beat's model is given its predecessors' specs, so for local time `t < 0` it
   evaluates the previous beat's guide at `t + span_prev` (recursing if a beat is shorter than the history
   window). A pointer that was mid-glide, and a camera that was leaning left and zooming in, therefore
   *carry on* across the cut: the new beat starts in motion, not at rest. The specs are a few hundred bytes of
   JSON, inlined into each beat. It is exact for the guide because the guide is a pure function of time.
3. **The cut swaps content, not motion.** A seam is a scale-out, an empty stage, then a scale-in (M6). The
   camera and the pointer are not part of it: they keep flying through the empty stage, and the new scene's
   elements scale up *into* a camera that is already moving. What resets with each scene is the **push**
   (the 1.00 → 1.14 baseline starts again as the new hero arrives), because that is about the hero.

**Rules the planner enforces so the chain is exact:** no event starts in the first 0.6 s of a beat or ends in
the last 1.2 s (so a beat's history is the orbit plus at most the tail of one event), and events are ≥ 3.5 s
apart. A short beat therefore usually has none: it is just the orbit, the push and the follow.

### 6.4 What the author declares, and what is automatic

| | |
|---|---|
| **already in the storyboard** | `focus` (a record's row, a table's row and `focusCol`), the items a scene names |
| **new, optional** | `hero: "<selector>"` to override the default; `points: [selector, ...]` to name items the pointer should *show* (the open hand circles them); `click: false` to suppress the click on a focus |
| **automatic** | the orbit and its per-beat variation; event times (from the narration: when the focus or an item is named); the focus zoom (from the element's measured size); the history chain; the seams |
| **never** | a depth-set component as a target; a click on anything that is not the beat's focus; a fixed pixel position |

### 6.5 What changes in the code

`lkdirector.mjs` `cursor()` and `camera()` are replaced by one call into `lkpointer.mjs` (`build` takes the
orbit, the events, the hero and the history). `planFor` hands it **events** instead of stops: from the beat's
`focus` and named items, never from a timer, with the enforcement above. Item entrances, retiming, the
anatomy, the depth set, the exit and the seams are untouched. `lkpointer.mjs` gains `offset` (film time) and
`history`. `scripts/test-pointer.mjs` runs over **every beat of every film**, with the lab's limits plus: no event
in the first 0.6 s or last 1.2 s, no event targeting a depth-set component, and continuity *across* each seam
(the position and velocity of beat k+1 at its t = 0 against beat k at its seam).

### 6.6 To decide

1. **How hard the push is** (1.00 → 1.14 per beat, γ = 0.55): firm, or barely perceptible?
2. **Point at items, or only the focus?** As written, items the narrator names get the open hand and only the
   focus gets a click. The alternative is the focus only.
3. **The flare.** It is the one remaining opacity animation (a light overlay over an empty stage). Keep it,
   or replace it with an iris: a disc of the new stage colour that *scales* from 0?
