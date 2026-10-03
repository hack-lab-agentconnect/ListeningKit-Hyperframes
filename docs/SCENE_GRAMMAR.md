---
title: "Scene grammar — the reusable motion language"
tags: [hyperframes, motion, scenes, grammar]
status: active
created: 2026-10-03
---

# Scene grammar

How a ListeningKit explainer is built so that the next video is a new *storyboard* over the same
*system*, not a new pile of one-off animation. Read [MOTION_CRITERIA.md](./MOTION_CRITERIA.md) for
the numbers; this document is the vocabulary.

Everything is code on a timeline: a beat is a few lines of data in `src/storyboards.mjs`; the
rest — the narration cues, the pointer, the camera, the depth set, the seams — is derived from it
and the Deepgram word timings. Adding an object video means writing beats and running the build.

## 1. The layers of a frame

```
root (1920×1080)
├─ .stages        flat stage colour: #2A8CFF or #FFFFFF, one layer per beat
├─ #dither        the product's Bayer lattice, edge-masked, tone-aware
├─ .beat × N      one sub-composition per beat           ← the 3D WORLD lives in here
│   └─ .stagec    perspective 1600px, preserve-3d, the CAMERA is a transform on this
│       ├─ the scene's own content        z = 0     (cards, panel, table, steps …)
│       ├─ .satset   the depth set        z = −340 … +240
│       └─ .ripple + .cursor   the pointer   z = −… … +260
├─ .cap           normal subtitles, bottom pill                ← OUTSIDE the world
├─ .chapter       progress rail
└─ .flash         the seam's exposure flare                    ← above everything
```

Two layers stay flat on purpose: the subtitles (they are for reading, not for staging) and the
flare (it belongs to the cut, not to either scene).

## 2. A beat

```js
{ t: 54.7,                    // audio-relative seconds: where the NARRATION starts this idea
  kind: "record",             // which scene factory (section 3)
  tone: "blue",               // optional: omitted → opposite of the previous beat (resolveTones)
  fx: "field-resolve",        // optional: one treatment (docs/COMPONENT_LIBRARY.md)
  xf: "push-up",              // optional: pin the seam this beat arrives on
  a: { … } }                  // the scene's own content
```

`t` is a **sentence or clause start** from the word timings. Find them with
`npm run times -- sentences <slug>` (every sentence with its start), `npm run times -- find <slug> "phrase"`
(first time a phrase starts) and `npm run times -- beats <slug>` (the current storyboard, with what is said
under each beat). A beat that runs long should be split at the next sentence boundary into a *different
picture of the next sentence* — never into the same scene held longer.

Stage tone: scenes that only exist on one stage keep it (`countup`, `costCount`, `transcript` on
white; `overwhelm`, `zoomOut`, `agentWork`, `sentiment`, `endcard` on blue); every other beat takes
the opposite of the one before, so the film keeps cutting white-on-blue ↔ blue-on-white.

## 3. The scene kinds

| kind | it says | content (`a`) | stage | good after | good before |
|---|---|---|---|---|---|
| `countup` | *how many* — the number is the picture | `label, count, sub` | white | — (opener) | `table` |
| `table` | *the object, as the product shows it* — rows rise one at a time | `title, api, cols, rows, focus, focusCol, count, note` | either | `countup`, `record` | `record`, `split` |
| `record` | *one row, one field lit* | `title, api, r[], focus, note` | either | `table`, another `record` | `record`, `relations` |
| `overwhelm` | *what it is NOT* — negations orbit the subject | `label, blockers[]` | blue | a definition | `record`, `journey` |
| `journey` | *an ordered set of 2–4 cards* (niches, steps, sources) | `kicker, steps[[title,sub,tag]], note` | either | `record` | `relations`, `record` |
| `relations` | *what hangs off this* — connectors draw to linked objects | `title, api, r[], links[[obj,why]]` | either | `journey`, `record` | `record` |
| `converge` | *many become one* — chips land, the core resolves on the last | `kicker, n, labels[], verdict` | either | `zoomOut`, `relations` | `typewriter`, `split` |
| `split` | *A versus B* | `kicker, left[3], right[3], foot` | either | `converge`, `overwhelm` | `relations`, `typewriter` |
| `sentiment` | *a measure* — bars fill | `kicker, bars[[label,%,text]], note` | blue | `record` | `typewriter` |
| `costCount` | *a number going to a target* | `label, from, to, unit, sub` | white | `agentWork`, `record` | `record` |
| `agentWork` | *the machine working* — steps tick done | `head, steps[], foot` | blue | `record`, `costCount` | `costCount`, `table` |
| `transcript` | *what was actually said* — scrolls against a waveform | `kicker, lines[], marker, dur` | white | `record`, `agentWork` | `sentiment`, `converge` |
| `typewriter` | *a line, typed at speaking pace* | `kicker, lines[], hold` | either | `converge`, `split` | `zoomOut`, `record` |
| `zoomOut` | *the reveal* — one thing becomes the whole | `mystery, big, sub` | blue | `typewriter`, `record` | `converge`, `table` |
| `endcard` | *the close* | `word, cta, url` | blue | — | — |

A scene that does not exist yet is a new factory in `src/scenes.mjs` returning `{ name, tone, html, anim }`
(see the `table` factory for the pattern): content built from the design system's own helpers
(`cardFor`, `icon`, `apiChip`), and an `anim(tl, t0, { q, qq })` that lays out its **own** entrance.
Everything after that — retiming to the narration, the pointer, the camera, the depth set, the seam —
is applied by the director and needs no further code, **provided the scene names its parts**: items as
`.jcard[data-i]` / `.trow[data-i]` / …, and the matching entry in `groupsFor` (`src/lkdirector.mjs`).

## 4. A beat's timeline, as the director builds it

```
t (beat-relative)   0           0.34 (ENTER)        ~1.9            ~4.4            ~6.9        span-0.5   span (seam)
                    │ beat el    │ content enters     │ click 1        │ click 2        │ click 3    │ level out │
camera              entrance push (z 220→0, 6° → 0) ─┐ in ─── creep ─ out ┐ in ─── creep ─ out ┐ in …                │
pointer             arrow ─ approach(bezier,mass) ─ hand ─ click ─ retreat(L/R) ─ sway ─ approach …
depth set           components rise Y+Z, staggered 0.17 s, then bob
items               enter on the words that name them (J-cut 0.4 s) and LIFT toward the camera while active
```

- **Cadence:** a click about every 2.5 s, snapped to a clause boundary when one is within 0.6 s.
- **Active component:** lifts +70 z when the narration reaches it, returns when it moves on (a record's note lifts +110, its panel +40) — the depth-of-field cue without blur.
- **The beat's last 0.5 s** is a level-out, so the seam's exit starts from a flat frame.

## 5. Juxtaposition — what follows what

The system alternates **stage** (white ↔ blue), and the grammar alternates **kind of statement**:

1. A *data* scene (`table`, `record`, `relations`) is followed by a *meaning* scene (`split`, `overwhelm`, `converge`, `typewriter`, `zoomOut`) within two beats. Three data scenes in a row is a spreadsheet.
2. A *definition* (`countup`, `table`) opens; its *negation* (`overwhelm`) follows it; the *anatomy* (`record` × N) follows that.
3. *Why it matters* is `zoomOut → converge → typewriter → split → relations`, in that order of intensity.
4. *Where it is used* is `journey` and `table`, with a `record` carrying the cursor onto the one field that does the work.
5. The close is `typewriter → zoomOut → endcard`.

## 6. Seams

Nothing fades. A cut is a **scale-out then a scale-in**: the outgoing scene's elements scale to 0
(staggered), the stage is empty for a beat while the exposure flare hides the colour swap, then the
incoming scene's elements scale up from 0 with overshoot. Six seams rotate (`push-left`, `zoom-in`,
`push-up`, `push-right`, `zoom-out`, `push-down`); they differ in the **order the outgoing elements leave**
(`start`, `end`, `center`, `edges`), not in any travel or fade. A cut between very different scenes (a
`table` to an `overwhelm`) reads best centre-out (`zoom-in`); between two similar scenes (`record` to
`record`) a directional order (`push-*`) lets the eye read the sweep rather than the swap.

## 7. What to reach for, in the reference set

`npm run refs -- list` shows the curated set. By need: *camera follows what is on screen* → `caption-camera-follow`; *depth groups and parallax* → `camera-3d-captions`, `camera-rig-depth-stack`; *tilt* → `tilt-card`, `yt-camera-move`; *overshoot* → `spring-pop`; *a pointer that is choreography* → `spotlight-card`; *exposure flare* → `editorial-flash-overlay`, `beat-accent`; *cue-driven entrances* → `notification-stack`. `npm run refs -- search "<terms>"` queries the allowed repos through the GitHub API when the answer is not in the set.
