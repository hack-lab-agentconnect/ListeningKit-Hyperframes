# ListeningKit HyperFrames

The **ListeningKit object-explainer video series** — 2–3 minute animated explainers
for each Twenty CRM object (`agencyProspects`, `agencyCalls`, `agencyLeads`,
`agencyPhones`, and the rest of the `agency*` set), built as
[HyperFrames](https://hyperframes.heygen.com) compositions.

The visual language is not invented here. Every colour, radius, font, icon and
dither value is lifted from the ListeningKit product repo, and the file it came
from is cited inline. **[`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) is binding and
machine-enforced.**

---

## Quick start

```bash
npm run lint                              # design-system + repo hygiene
npm run build                             # regenerate compositions + entry
npm run review -- --at 3,20,45 --no-end   # scene frames for visual review
npm run render                            # mp4
```

Requires Node 18+. The HyperFrames CLI is pinned to `0.8.112` in the scripts so a
re-render months from now produces the same output.

> Use `npm run review`, not `npm run snapshot`, for anything you intend to look at.
> Review frames are written **outside the repo** (workspace `.scratch`) and
> `scripts/lint-repo.mjs` fails the commit if a frame is ever tracked. See
> **[`docs/WORKFLOW.md`](./docs/WORKFLOW.md)**.

---

## Layout

| Path | What it is |
|---|---|
| **[`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)** | The visual rules. Read this first. Binding. |
| **[`docs/WORKFLOW.md`](./docs/WORKFLOW.md)** | Build → review → commit → push → render, and the repo rules |
| `src/lkdesign.mjs` | Every colour, radius, shadow, dither and type value, with provenance |
| `src/lkchrome.mjs` | The shared stylesheet: stage, dither, captions, icons, cursor |
| `src/lkicons.mjs` | Heroicons 24 outline, read out of the product's own package |
| `src/scenes.mjs` | The scene library — one factory per beat type |
| `src/storyboards.mjs` | Per-object beat plans, timed against the Deepgram word timings |
| `src/build-beats.mjs` | Emits `compositions/<slug>.html` + one sub-composition per beat |
| `src/fetch-audio.mjs` | Deepgram audio + word timings from `narrations/` |
| `scripts/lint-design.mjs` | The design-system lint (line scanner) |
| `scripts/lint-repo.mjs` | Repo hygiene: tracked frames, loose root files, secrets |
| `scripts/entry.mjs` | Points `index.html` at a composition |
| `scripts/review-frames.mjs` | Captures review frames outside the repo |
| `assets/timing/` | Deepgram Nova-3 word timings (drive captions + J-cuts) |
`narrations/` | Narration scripts |
| `compositions/` | **Generated.** Committed on purpose — see below |

Source lives in `src/`, tooling in `scripts/`, writing in `docs/`. The repo root is
an explicit allowlist — nothing loose lives there, and adding something is a
decision you make on purpose.

### Two things that will bite you

**1. Assets resolve against `compositions/`, not the project root.**
`compositions/assets/` holds the fonts, cursors, logo and narration audio. Adding
an asset to the root `assets/` directory does nothing for a render.

**2. `index.html` is not the composition.**
The entry file points at whichever slug `scripts/entry.mjs` was given. Without it,
every root-level HyperFrames command captures the `hyperframes init` scaffold — a
black frame reading "Title". This has already silently produced a batch of 15
identical black frames.

---

## Pipeline

```
narrations/<slug>.json
   └─ Deepgram aura-2-thalia-en  →  assets/audio/<slug>.mp3
        └─ Deepgram Nova-3       →  assets/timing/<slug>.json   (word timings)
             └─ src/build-beats.mjs  →  compositions/<slug>.html + compositions/<slug>/b*.html
                  └─ hyperframes render → renders/<slug>.mp4
```

`src/fetch-audio.mjs` regenerates audio and timings. It reads the Deepgram key from
`DEEPGRAM_API_KEY`, falling back to a local secrets file. **No key is committed.**

---

## House rules worth knowing before you edit

- **Satoshi must be declared with `@font-face`.** HyperFrames pre-bundles 18
  families and Satoshi is not one of them, so without it the render silently
  falls back to a system font. Watch for `Fonts FAILED: Satoshi` in the compiler
  output.
- **Tone is an input to a scene factory, never an override applied after.** Each
  factory computes `onBlue` internally. `src/build-beats.mjs` passes `tone` in.
- **Cut on meaning, not sections.** Beats are 3–7 word scenes tagged
  Hook → Build → Punch → Resolve, not 30-second chapter cards.
- **Nothing lives permanently in a corner.** Type is centre-stage; the only
  persistent element is the chapter rail.
- **No squircle.** It is a `clip-path` on a fixed-size box and every card here is
  content-sized.

---

## Licence

MIT for the code. Satoshi and Heroicons are used under their own licences; the
font files are vendored from the product repo. The ListeningKit logo and brand are
trademarks of their owner.