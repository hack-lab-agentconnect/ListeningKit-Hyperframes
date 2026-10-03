---
name: lk-motion-grammar
description: Use before writing or changing any ListeningKit object-explainer scene, storyboard beat, transition, cursor or camera move in this repo (src/scenes.mjs, src/storyboards.mjs, src/lkdirector.mjs, src/lkmotion.mjs, src/lksatellites.mjs). Routes to the motion criteria, the scene grammar and the curated reference set, and gives the proof loop. Also use when asked to "make it more dynamic", fix holds, cursors, pills or transitions, or to study published Opus/HyperFrames product videos.
---

# ListeningKit motion grammar

This is a **local, curated** skill for this repo only. It sits on top of the HyperFrames skills
(`/hyperframes`, `/hyperframes-core`, `/hyperframes-animation`, `/hyperframes-keyframes`): load
those first for the composition contract; this adds what is specific to the ListeningKit series.

## Read, in this order

1. `docs/MOTION_CRITERIA.md` — **M1–M12**: what a scene must *do*, with numbers. The pacing ones
   (M1 length, M2 cadence, M4 pointer, M7 stages, M9 depth set) are machine-checked.
2. `docs/SCENE_GRAMMAR.md` — the layers of a frame, the beat format, every scene kind, what
   follows what, how a beat's timeline is built.
3. `DESIGN_SYSTEM.md` — what a frame may *look* like. §1.1a card inversion, §1.5 tiles, §1.8
   the outer stroke, §4 motion.
4. `docs/COMPONENT_LIBRARY.md` — treatments, seams, and what the director does for every scene.
5. `docs/POINTER_MOTION.md` — how the pointer and camera move (no snaps; orbit, events, lagging follower), with `npm run test:pointer`.
6. `docs/TRANSITION_FX.md` — the gunshot flash, speed ramp and pixel blast for cuts and clicks, with `npm run test:fx` and `npm run lab:transition`.

## The rules that get broken first

- **No beat holds.** Split at the next sentence boundary into a *different picture of the next
  sentence*. `npm run lint:pacing` fails on > 10.5 s, on dead air > 3.4 s, on a scene with no pointer.
- **Item entrances are pinned to the narration**, never to fixed offsets from the beat start.
- **The pointer is in every scene** and is the through-line: arrow → open hand on hover →
  pointing hand on the press → arrow; bezier + mass + a swaying z; rests in the left/right
  quadrant. The camera follows it in and out. Never aim anything at a typed coordinate: measure it.
- **Subtitles stay normal** (bottom pill, in the root). No text blocks in the 3D world.
- **Components are solid, padded, with a tile**, outlined by `hardDrop()` (black outer stroke).
  Never blur, never dim for depth. Tile → icon → text, in that order, with overshoot.
- **A cut is one move** with an exposure flare, never a fade. The swap happens at the peak.
- **Tone is an input to a scene factory**, never an override applied after.
- **Generated `compositions/**` must be rebuilt and committed with any source change.**

## The loop

```bash
npm run times -- beats <slug>                  # what is said under each beat, and for how long
npm run times -- find <slug> "phrase"          # where a phrase starts, to place a beat
npm run lint                                   # design + pacing + repo
npm run build
npm run review -- --slug <slug> --at 31.0,31.3,31.6   # frames OUTSIDE the repo; read them
npm run check                                  # needs assets/audio (npm run audio)
```

Read **frames**, not just output: one seam, one full click, one table, and every scene kind you
touched on **both** stages. Four bugs in the last pass passed every lint and were visible only in frames.

## Studying published work

Start at `npm run refs -- list`: the curated set, what each entry is for, and what we did *not*
take from it. To look further, `npm run refs -- search "<terms>" [owner/repo]` queries the allowed
repos through the GitHub API; `read` and `tree` open single files. `npm run refs -- pull --all`
vendors the small files into `docs/references/vendor/` with provenance (source, commit, licence).
A repo not in `allowedRepos` is refused: add it to `docs/references/MANIFEST.json` with a reason first.

Be sceptical of claims in aggregator READMEs ("one-shotted in 20 minutes"): the lists link originals
and prompts; check them there. Licences: the two HeyGen repos are Apache-2.0 (vendoring is fine, with
attribution, which `pull` writes); the awesome-lists declare none, so they are link-only.

## Adding a scene kind

Write the factory in `src/scenes.mjs` (the `table` factory is the pattern): build markup from
`cardFor`, `icon`, `apiChip`; give parts `data-i` / `data-a` hooks; write its own entrance in
`anim`. Add its item groups to `groupsFor` in `src/lkdirector.mjs`, and its stage (if it only works on
one) to `FORCED_TONE` in `src/storyboards.mjs`. The director then retimes, adds the pointer, the
camera, the depth set and the seams without further code. Add the row to the table in
`docs/SCENE_GRAMMAR.md`.

## Transition gate (rules T1-T10)

`npm run lint:transitions` regenerates every registered transition's sample and enforces the method in
`docs/TRANSITION_FX.md`: one adjustment layer owns the ramp zoom (compositions carry none); a wipe is a
clip-path MASK on the incoming group (never an overlay, never a full-frame flash); the pointer and rings
sit outside it, on top; nothing fades; every 3D item is an `x3d` slab (`src/lkextrude.mjs`); a click is
3 rings, 2 px, white and/or blue. A new transition is a module in `src/transitions/`, registered, and
documented in TRANSITION_FX.md and its README. It runs in `npm run lint`, pre-commit and pre-push.

## Motion with mass (springs and the peak rule)

Read `docs/ANIMATION.md` before writing any entrance, exit, camera move or pointer aim. Never write `back.out`: use
`__spr.pop / snap / soft` (`__spr.popIn` to leave; `"spr:pop"` in component steps). The pointer and camera wait for
an item's overshoot peak (`peakOfItem`, rule M14). A value that changes target gets one spring per change (`track`),
never a restart. Gates: `npm run test:spring`, `no-cheap-ease`, `lint:pacing M14`, `lint:components C4`.

## Where the primitives are documented

`docs/{domain}/{primitive}.md`, indexed by `docs/README.md`. Layers (the adjustment layer, rings, pointer): `docs/layers/`.
Camera moves and the director that plans them: `docs/camera/`. Add a page with every new camera move, component or
transition; `npm run lint:docs` enforces it.
