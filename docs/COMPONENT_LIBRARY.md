---
title: "Component Library — HyperFrames catalog → our beat grammar"
tags: [hyperframes, motion, beats, components]
status: active
created: 2026-10-03
---

# The component library

`src/lkmotion.mjs` is the library. This file is the map into it.

## What this is, and what it is not

The HyperFrames component catalog (223 entries, `docs/catalog/components` upstream) is a
**reference library of motion techniques**. It is not a set of video templates, and
installing its components wholesale would give this project a second, parallel system with
its own timing and its own stage logic — which is precisely what the storyboards are not.

So nothing here is a component *copy*. Every entry is a **treatment**: a way to animate the
markup a beat already produced, on the beat's own clock.

| Rule | What it means in practice |
|---|---|
| A treatment never invents content | It reads what the storyboard already put in `beat.a` (and optional `beat.a.fx`) and animates those elements. Adding a treatment can change *how* a moment is animated; it can never change *what is said*. |
| A treatment never introduces its own timing | It receives `t0` — the beat's audio-relative start, already J-cut shifted — and every offset is relative to it. |
| A treatment never bypasses stage logic | Ink comes from `tone`, which the storyboard owns, exactly as in `scenes.mjs`. |
| One treatment per beat | A beat has one `fx`. `mode: "only"` treatments replace the beat's own animation; `mode: "after"` treatments layer on top. |

## How a beat opts in

```js
{
  t: 35.6,
  kind: "record",
  tone: "white",
  zx: true,              // the transition flag, unchanged
  fx: "field-resolve",   // the treatment
  a: { kicker: "...", title: "Lead", r: [...], focus: "contactName", note: "..." },
}
```

Tuning lives in `a.fx` and is documented per treatment below. An unknown `fx` name is not
silently ignored — add it to `TREATMENTS` or the beat animates with its base treatment and
the intent is lost.

## The mapping

| HyperFrames catalog component(s) | Our treatment | Beat types | Required beat data | Timing behaviour | Stage behaviour | Transition behaviour | Intended result |
|---|---|---|---|---|---|---|---|
| `per-word-rise`, `text-stagger`, `per-word-crossfade` | `per-word-rise` | any beat with a kicker or headline | `fx.target`, `fx.stagger` (0.06s), `fx.rise` (34px), `fx.start` | words lift in sequence from `t0 + start` | ink untouched — it only moves boxes | none | the headline arrives as a phrase, not a block |
| `char-slam-explode`, `bottom-up-letters`, `top-down-letters` | `char-drop` | `endcard`, `countup`, `costCount` | `fx.target` (default the wordmark), `fx.stagger`, `fx.drop` | per-letter, 30ms apart | as above | none | one word lands hard. Used sparingly — it is loud |
| `typewriter`, `typed-prompt`, `notes-typing` | `typewriter-run` | `typewriter` | `fx.cps` (28), `fx.lineGap` (1.5s), `fx.caret` (line/block/none) | typing duration derives from the length of the text the storyboard wrote, so it tracks narration | caret ink follows the stage | replaces the beat's own animation (`only`) | the line types itself at a speaking pace |
| `panel-reveal`, `focus-swap`, `input-feedback`, `skeleton-reveal` | `field-resolve` | `record`, `relations` | the beat's `r` rows; `focus`; `fx.step` (0.34s/row), `fx.start` | label lands, **value resolves after it**, then the note; the focused row still lights up | card inversion untouched | none | one field at a time, question then answer |
| `focus-blur-resolve`, `focus-rack`, `spotlight-card`, `ui-focus-zoom` | `focus-blur-resolve` | `record`, `relations`, `converge` | `focus`; `fx.dim` (0.4), `fx.blur` (2px) | non-focus rows soften 0.6s in; the subject breathes | softening is opacity + blur only, no recolour | none | the eye is told where to look without splitting the panel |
| `state-chip-rail`, `marker-checklist-card`, `success-check` | `chip-rail-tick` | `record`, `journey` | the row keys; `fx.keys`, `fx.step`, `fx.tick` | each row ticks 0.42s apart | the tick is Heroicons `check` in the card's ink | none | status fields resolve as a rail — the beat where confusing three statuses hurts |
| `constellation-hub`, `stagger-cascade`, `radial-surround`, `stagger-lattice` | `converge-chain` | `converge` | `n` / `labels`; `fx.chip` (0.18s), `fx.pull`, `fx.coreIn` | chips land one at a time; the core resolves **on** the last chip | chip + core keep their own inversion | none | many become one, as a sequence rather than a pose |
| `svg-stroke-trace`, `tracing-beam`, `outline-draw`, `hw-arrow` | `stroke-trace` | `relations`, `record`, `journey`, `agentWork` | nothing — it traces the connectors the beat already drew | 0.55s per path, in DOM order (`fx.order: "reverse"` to flip) | stroke colour untouched | none | the relationship draws itself instead of appearing |
| `grid-card-assemble`, `staggered-fade-up`, `spring-pop`, `card-resize` | `card-assemble` | `journey`, `agentWork` | the beat's `steps`; `fx.step`, `fx.from` (up/left/right/scale) | 0.34s per card | cards keep their own inversion | none | step cards settle into a grid |
| `before-after-wipe`, `comparison-split`, `directional-wipe`, `split-tilt-cards` | `comparison-wipe` | `split` | the beat's `left`/`right`/`foot`; `fx.edge` (0.7s), `fx.from` | a travelling clip edge crosses the frame, then the takeaway | card inversion untouched | none | the comparison *is* the motion |
| `count-up`, `number-pop-in`, `number-wheel`, `conic-progress-ring` | `number-tick` | `countup`, `costCount` | `count` or `from`/`to`; `fx.dur` (1.4s), `fx.settle` | tween from `from` to `to`, then a continuous breathe | number ink untouched | none | the count lands as a number, not as text |
| `marker-highlight`, `inline-highlight`, `hw-underline`, `strikethrough-replace` | `marker-highlight` | any beat with a note | `fx.phrase` — a substring **already present** in the note; `fx.target`, `fx.at` | underline sweeps 0.55s at `t0 + at` | the mark is `blueEdge` on a white stage, white on blue | none | the phrase that matters is marked once it is said |
| `scramble-reveal`, `matrix-decode` | `scramble-resolve` | `record`, `converge`, `countup` | the element's existing text; `fx.steps`, `fx.frame`, `fx.at`, `fx.glyphs` | character-by-character settle, fixed-seed LCG (no `Math.random` — a render must be identical every run) | untouched | none | a value that reads as looked up rather than typed |
| `logo-brand-close`, `titlecard-lockup`, `logo-sting`, `store-badge-lockup` | `wordmark-lockup` | `endcard` | nothing — the beat's `word`/`cta`/`url` and `assets/logo.svg` | scale + fade only; **never** animate `letterSpacing` | brand blue stage | none | the logo is placed, not rebuilt. Restructuring a wordmark is a brand bug |

### Seams (replaced the old transition set, 2026-10-03)

The previous transitions were opacity fades on the incoming beat while the outgoing beat stayed
fully opaque for another half second over a stage that had already changed colour: every cut was
~1 s of old-stage content on the new stage. A first rewrite pushed the scenes toward the camera and
faded them. **Nothing fades now** (DESIGN_SYSTEM 4, M13): a seam is a scale-out then a scale-in. The
outgoing scene removes every element (each scales to 0, staggered), the stage is empty for a beat
while the **exposure flare** (a light overlay) hides the stage colour / dither / tone swap at its
peak, and the incoming scene's elements scale up from 0 with overshoot.

`SEAMS` in `src/lkmotion.mjs` is data: the only thing a seam chooses is the **order** the outgoing
elements leave in (`exit`: `start`, `end`, `center`, `edges`). `src/lkdirector.mjs exit()` performs
it; `src/build-beats.mjs` runs the stage swap and the flare. Six moves rotate so no two neighbours
repeat.

| Storyboard flag / key | Seam | Catalog source |
|---|---|---|
| (none) | next in rotation: `push-left`, `zoom-in`, `push-up`, `push-right`, `zoom-out`, `push-down` | `page-slide`, `whip-pan-cut`, `shared-axis-y`, `zoom-through-transition` |
| `zx: true` | `zoom-in` | `zoom-through-transition` |
| `slide: true` | `push-left` | `page-slide`, `whip-pan-cut` |
| `blur: true` | `blur` - **a straight push-in; blur itself is banned** | `fade-through` |
| `xf: "<name>"` | that seam (or an old name: `wipe`→`push-left`, `iris`→`zoom-out`, `shared-axis-y`→`push-up`) | — |

The flare is `editorial-flash-overlay` / `beat-accent` in spirit: finite, seek-safe, the colour swap hidden at the peak. It is the one opacity animation that remains, because it is light over an empty stage, not a fade of content; if it should go, the replacement is an iris: a disc of the new stage colour that scales from 0.

## The motion director (2026-10-03)

Treatments (above) say how a *scene* animates itself. Everything that applies to **every** scene,
whatever its kind, is the director - `src/lkdirector.mjs` - so a new scene gets it for free:

| What | Where | Catalog / reference source |
|---|---|---|
| items enter on the words that name them | `retime`, `wordSlots` | `notification-stack` (cue-driven entrances) |
| tile → icon → text anatomy, with overshoot | `anatomy` | `spring-pop` |
| the pointer: arrow / hand / pointing hand, bezier + mass + z | `cursor` | `spotlight-card`, awesome-claude-video "a visible cursor causes every click" |
| the 3D camera that follows the pointer | `camera`, `pose`, `bez` | `caption-camera-follow` (fit to measured boxes, bezier), `yt-camera-move`, `tilt-card` |
| the depth set (`src/lksatellites.mjs`) | `satellites` | `camera-rig-depth-stack`, `camera-3d-captions` (depth groups) |
| the active component lifts toward the camera | `lift` | — |

These live beside the treatments, not inside them, because a treatment is *optional per beat* and these are not.

## Rejected, and why

The catalog is large and most of it does not belong to a flat-colour, centre-stage,
Satoshi-only explainer. Rejected as a class:

- **Captions (16 entries)** — `caption-neon-glow`, `caption-glitch-rgb`, `caption-matrix-decode`,
  `caption-particle-burst` and the rest. Captions here are set by `build-beats.mjs` from the
  Deepgram word timings and must stay legible over both stages. A caption *style* is not a beat.
- **3D / camera (10)** — *reversed 2026-10-03.* The scenes now live in a real 3D world (perspective
  on a stable parent, `preserve-3d`, a camera that tilts, zooms and follows the pointer), built from
  DOM 3D rather than WebGL so Satoshi stays real, crisp text. `camera-rig-depth-stack`, `tilt-card`,
  `yt-camera-move` and `camera-3d-captions` are in the reference set. What stays rejected: **text in
  3D** (`caption-camera-follow`'s word layout, `camera-3d-captions`' ring and hero words) - subtitles
  are normal bottom captions - and `camera-shake`, which would read as a different product.
- **Grain, halftone, chromatic aberration, ASCII, aurora, mesh gradients** — the texture layer
  is the product's own Bayer dither from `lkchrome.mjs`. A second texture system is a fight, not
  a look.
- **Device / browser mockups, product-demo furniture (22)** — `browser-device-stage`,
  `device-frame-stage`, `signup-flow`, `settings-toggle-flow`. These are screen recordings of an
  app. Our subject is a data model, not a UI.
- **Testimonial / social-proof / logo-wall / trust-strip cards** — we have no customers, no
  logos and no ratings to show. Rendering an empty one would be inventing content (rule 9).
- **Glitch, confetti, shake, rubber-band** — wrong register for an explainer about a CRM schema.
  `camera-shake` and `confetti` would read as a different product. (*Overshoot* is no longer in this
  list: it is the series' deliberate register - M5 - used on every component's entrance.)

Kept-but-unused, available if a beat ever needs them: `spring-pop`, `outline-draw`,
`stop-motion-cadence`, `variable-font-flex`, `swipe-rail`, `skeleton-reveal`,
`morph-text`, `line-swap`, `tabs-slide-indicator`.

## Adding a treatment

1. Write it in `TREATMENTS` with `from`, `beats`, `needs` and `mode`.
2. **Its `anim` body may not reference anything from this module** — no `C`, no `icon()`, not
   even the helpers here. `build-beats.mjs` serialises the animation with
   `Function.prototype.toString()` and re-creates it inside a sub-composition page where the
   module's imports do not exist. Everything goes through `__fx` (the `motionRuntimeJS` global)
   or through `h.A`. A bare `sel(` in an anim body is a ReferenceError at render time,
   thousands of frames into a 150-second file.
3. If it needs a new dependency, add it to `__fx` **once**, in `motionRuntimeJS`.
4. Prove it on a real beat: `npm run review -- --slug <slug> --at <t> --no-end --label <name>`,
   and read the frame. `npm run check` catches a thrown anim as a runtime error, but only a
   frame tells you the motion is any good.