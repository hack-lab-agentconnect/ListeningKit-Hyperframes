---
title: "Motion criteria — what a ListeningKit scene must do"
tags: [hyperframes, motion, pacing, criteria]
status: active
created: 2026-10-03
---

# Motion criteria

[DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) says what a frame may **look** like. This says what the
film must **do** over time. Every criterion has a number or a yes/no, a place it is
implemented, and (where a machine can check it) the check that fails the commit.

The first generation of these films broke most of them at once. Measured on the original
`agency-prospects` storyboard: 14 beats averaging **11.5 s**, with holds of **15.3 s**
(overwhelm), **18.5 s** (converge), **23.0 s** (journey). Every scene animated in over its
first ~3 s and then idled on a 9 px float for the rest, so a 15-second beat was a 3-second
animation and a 12-second photograph. The cut between beats was two opacity fades that left
~1 s of old-stage content on the new stage colour. The "large cursor" was an 80×64 canvas
with a 30 px arrow in its corner, aimed at hand-typed coordinates.

Reference points (all verified through the GitHub API, see [references/MANIFEST.json](./references/MANIFEST.json)):
a talking-head recut of an 83 s clip was cut into **~30 shots, one per 2.8 s**; the beat-synced UI
morph guide requires that *"a visible cursor must cause every click and drag"* and bans
*"dead time"*; the same guide renders one still per beat before any full pass.

---

## The criteria

| # | Criterion | Number | Implemented in | Enforced by |
|---|---|---|---|---|
| **M1** | **Shot length.** Cut on the narration's own sentence and clause boundaries. | mean beat **≤ 7.0 s**; no beat **> 10.5 s** | `src/storyboards.mjs` | `lint:pacing` |
| **M2** | **Event cadence.** Inside a beat something is *planned* to move (an entrance, a click, a camera move) at least this often. The camera never rests. | longest gap **≤ 3.4 s** | `lkdirector.mjs planFor` | `lint:pacing` |
| **M3** | **Narration-pinned.** An item enters when the narrator names it, not 0.4 s after its beat starts. Visuals lead speech (J-cut). | beat leads by `LEAD` **0.65 s**; an item by **0.4 s** | `lkdirector.mjs wordSlots / retime`, `lkclock.mjs` | `lint:pacing` (plans from real word timings) |
| **M4** | **The pointer.** One cursor, in every narrated scene, is the through-line. See below. | arrow ≥ **80 px**; a click every **~2.5 s** | `lkdirector.mjs cursor` | `lint:pacing` (≥ 1 stop per beat) |
| **M5** | **Component anatomy.** Every tile-and-text component enters in the same staggered order, with overshoot. Solid, padded, with its tile — never a hollow outline. | ~**0.45 s** total | `lkdirector.mjs anatomy`, `scenes.mjs` | `lint:design` |
| **M6** | **Seams.** No cut is unnamed, and none is a fade. A seam is one move: the outgoing scene removes every element (scale 1 → 0, staggered), the stage is empty under an exposure flare, the colour swaps at its peak, the incoming scene scales 0 → 1 with overshoot. | flare up **0.30 s**, down **0.55 s**; exit **0.30 s** + 0.04 s stagger | `build-beats.mjs`, `lkdirector.mjs exit`, `lkmotion.mjs SEAMS` | frame review, `lint:design no-fade` |
| **M13** | **Nothing fades.** Elements enter by scale 0 → 1 with overshoot and leave by scale 1 → 0. Never opacity 0 → 1. | `__spr.pop` in, `__spr.popIn` out (springs, [ANIMATION.md](./ANIMATION.md)) | everywhere | `lint:design no-fade` |
| **M14** | **The peak rule.** The pointer is on screen all the time, the elements are not: the hand lands on an item, and the camera pushes in on it, only once the item's entrance mass is at the **peak of its overshoot**; then it tweens in close. | `peakOfItem(slots, i) + HAND` | every beat with items | `lint:pacing M14` |
| **M7** | **Stage alternation.** Each beat takes the opposite stage of the one before. | ≤ **20 %** of seams may repeat | `storyboards.mjs resolveTones` | `lint:pacing` |
| **M8** | **The camera follows the pointer.** In as it arrives, out as it leaves. 3D, tilted, one fluid move. | zoom ≤ **1.35**, tilt ≤ **8°** | `lkdirector.mjs camera / pose` | frame review |
| **M9** | **Depth set.** Components from the beat's own family, at foreground and background depths. No text blocks. Separation by stroke, scale and lift — never blur, never dimming. | **5** components; ≥ **80 %** of beats | `lksatellites.mjs` | `lint:pacing`, `lint:design no-blur` |
| **M10** | **Subtitles are normal subtitles.** Bottom caption pill, in the root, outside the 3D world. No text in 3D space. | — | `build-beats.mjs captions()` | review |
| **M11** | **Real structure.** A table is a table: header band, column heads, rows that rise one at a time with their cells resolving after. Sample rows are marked illustrative in the storyboard. | — | `scenes.mjs table` | review |
| **M12** | **Proof before render.** Frames at every seam and at one full click, read, before a full render. | — | `npm run review` | [WORKFLOW.md §3](./WORKFLOW.md) |

### M4 — the pointer, in full

The mouse is the visual driver of every scene: the thing the viewer follows. It is a character with mass.

- **One pointer across cuts.** A beat's pointer starts where the previous beat's ended, so the cut reads as one mouse crossing the scene change.
- **Three states.** Arrow (`pointer.svg`) → open hand (`hover.svg`) when it arrives over a thing → pointing hand (`click.svg`) on the press → arrow again. Never a stray state: it is the arrow unless it is over, or on, something.
- **Its life is a loop.** *Approach* the next thing on a curved bezier that starts slowly, overshoots and settles. *Click*: hover 0.26 s, press 0.24 s (squashed to 0.84), ripple. *Retreat* to the **left or right quadrant**, alternating, where it sways until the next stop.
- **It lives in 3D.** X and Y follow the bezier; **Z** swings: it comes toward the camera as it nears a click (+230 px, so the click is the closest thing in the frame) and pulls away on the retreat, with a constant slow sway while it rests (±28 px).
- **It leans into its motion** (rotation from velocity, ±18°) and swells slightly with speed.
- **It is causal.** What it presses is what the camera is already moving to, and what the narrator is naming.
- **It is a pure function of time.** One tween, `onUpdate` evaluates the path: seek anywhere and it is exactly where it should be (no state carried between frames).

### M5 — anatomy of a component

Staggered, not sequential: each part starts before the last has settled.

1. the **card** overshoots in from an anchor at its **centre** (spring `pop`, from a visible scale);
2. at **+0.10 s** the blue **tile** overshoots (spring `snap`);
3. at **+0.24 s** the **heroicon** inside it overshoots **last** (spring `snap`, from −24°);
4. at **+0.16 s** the **text** beside it rises 28 px and overshoots (spring `pop`), each line 0.05 s after the last.

Rules that stay from the design system (DESIGN_SYSTEM 1.1a, 1.5): the card is white on a blue stage and blue on a white stage; the tile inverts with the **card**, not the stage; a pill has padding, a solid fill and a tile — text touching its edge is the "hollow pill" bug and is a build failure.

### M6 — anatomy of a seam

One clock, four parts (times relative to the incoming beat's start `S`, peak `C = S + 0.30`). **Nothing is
faded**: the beat element is never animated; the scene's own elements scale out and in inside their own
timelines.

| time | what happens |
|---|---|
| `S − 0.3 … S` | the **outgoing** scene removes every element: each top-level element, every depth-set component and the pointer scales **down to 0** (the reversed spring `__spr.popIn`, 0.30 s each, 0.04 s apart). The seam's `exit` order is its character: `start`, `end`, `center` or `edges` |
| `S … C` | the stage is **empty**. The **exposure flare** (a light overlay, not a fade of content) rises on a cosine |
| `C` | the flare peaks (white at the centre, `blueEdge` at the rim). **Stage colour, dither and tone swap here, unseen** |
| `C → C + 0.55` | the flare falls away; the **incoming** scene's elements scale **up from 0 with overshoot** (spring `pop`), starting `ENTER` (0.34 s) after `S` |

**Next:** the soft flare becomes a gunshot flash on the front of a pixel-wipe *mask*, under one adjustment layer that owns the speed-ramp zoom, with the pointer on top and the click as three 2 px rings; 3D items become extruded slabs. Built, demonstrated and gated (`npm run lint:transitions`), not yet in the films - see [TRANSITION_FX.md](./TRANSITION_FX.md).

Six seams rotate (`push-left/right/up/down`, `zoom-in/out`); they differ only in the order the outgoing
elements leave, so no two neighbours repeat. A storyboard can pin one with `xf:` or the old `zx` / `slide` /
`blur` flags.

### M8 — camera grammar

- **Entrance:** the frame starts 220 px toward the camera and 6° off axis, and settles over 1.2 s.
- **Per stop:** an **in** shot 0.95 s before the click (zoom ≤ 1.32, tilt ±3° / ±7°, 0.8 s on a `0.22, 1, 0.36, 1.1` bezier), then a **creep** (a held shot keeps drifting 45 px closer and 55 % further round), then an **out** shot 0.45 s after the click (zoom 0.94) that takes in the whole depth set as the pointer leaves.
- **Level out:** the frame levels 0.5 s before the seam so the exit starts flat.
- **Pose maths:** the stage is rotated about the frame centre and then translated, so the translation cancels the *rotated* position of the target (otherwise a tilted camera slides off what it is aimed at). Zoom is a move along z under a fixed perspective (1600 px), so tilt and zoom are one move.

### M9 — what belongs in a depth set

| the beat shows… | the depth set draws from… |
|---|---|
| an object's fields (`record`, `table`, `sentiment`, `transcript`, `countup`, `costCount`, `typewriter`) | the object's **other fields** |
| relationships or the whole (`relations`, `converge`, `split`, `journey`, `overwhelm`, `zoomOut`, `agentWork`) | the object's **related objects** |

Anything already on screen in the beat is skipped. Field lists come from `narrations/<slug>.json`, related objects from the storyboards. A depth set that is not the beat's own family is decoration, and decoration is not allowed.

---

## Verification protocol (M12)

```bash
npm run lint                                   # design + pacing + repo hygiene
npm run build                                  # regenerate compositions/
npm run review -- --slug <slug> --at <t,t,t>   # frames, OUTSIDE the repo
```

Look at, in this order: **one seam** (frames across `S … C+0.55`: no double exposure, flare peaks, colour swaps unseen) → **one full click** (arrive, hover, press, retreat: arrow → open hand → pointing hand → arrow) → **one table** → **one of each scene kind you changed**, on **both** stages. Then `npm run check`, then render.

A frame can pass every lint and still be wrong. Four of the bugs fixed in this pass were visible only in frames: a blur filter that never cleared (whole beat defocused), a cursor hidden *behind* the card it pressed, a wipe that jumped from all-blue to all-white because `inset(0 0 0 100%)` cannot tween to `inset(0% 0% 0% 0%)`, and bottom components crowding the caption pill.
