# The film standard

What a finished ListeningKit explainer film must look like, who decided it, and how to prove a render meets it. Written 2026-10-04 from the owner's corrections in #general and the worker's fixes. **Where this document and an older page disagree, this document wins**; the older pages (camera, pointer, MOTION_CRITERIA) describe what the generator *can* do, not what a published film *should* do.

Provenance: the owner's rulings are paraphrased from #general (2026-10-04, 04:00-09:14 UTC) and the worker's replies in the same channel. The reference render named below was deleted before this was written, so every "looks like" statement is the owner's words plus the worker's account, not something re-checked on the render. Items marked **(unverified)** need a frame check before anyone relies on them.

## 1. Why the films exist

The team sells services to small businesses (see the Services & Offers forum). A short video per object (agency prospects, calls, leads, overview) explains *what we sell, what it does and how we deliver it*, so a teammate or prospect can watch instead of read. They are posted into the matching forum thread. Owner's brief: not heavily edited, slower beats than the first pass, built with the existing rules, templates and transitions in `ListeningKit-Hyperframes`.

## 2. The rulings (newest last; later overrides earlier)

| # | when | ruling | why the owner gave it |
| --- | --- | --- | --- |
| R1 | 04:00 | Use the existing HyperFrames system; beats slower than the first pass | explain, not dazzle |
| R2 | 04:50 | Keep the **colours and the card design**; make the picture flat and normal-looking. No 3D, no mouse movement, no camera movement | the first agency-overview render looked "horrible" |
| R3 | 05:06 | Keep the **pixel wipe** between beats. A fade looks bad | the wipe is the one transition he likes |
| R4 | 05:42 | A level push-in with the pixel wipe is acceptable; no *weird* camera movement | softened R2: depth is fine, drama is not |
| R5 | 06:04 | No zoom-ins on content. Cut every source of zoom | zooms read as the weird camera movement |
| R6 | 06:20 | The `nozoom-prospects` configuration is the correct way. Assets must all be present. Length must match the narration | renders had empty boxes and ran 171 s |
| R7 | 07:00 | The wipe is a **mask** over the outgoing beat, not an overlay. Take screenshots at the transitions and inspect them | overlay version looked "really ugly" |
| R8 | 08:22 | The render `renders/ListeningKit-Services-Video_2026-10-04_14-25-03.mp4` is **the** correct one. `renders/agency-prospects.mp4` is the bad one | final ruling on which config wins |
| R9 | 08:51 | `ListeningKit-Hyperframes` is the single project; fold Services-Video into it and push | one source of truth |

Net effect today: **flat frame, no camera zoom or tilt, no cursor layer, depth set only as static layering, pixel wipe as a mask, all assets present, timing honest to the narration.** If R4's level push-in is wanted back it is the owner's call; do not add it unasked **(open: confirm with the owner)**.

## 3. What "correct" means, checkable

| property | pass | how to check |
| --- | --- | --- |
| camera | the frame never moves, tilts or scales between wipes | `"flat":true` in every beat's director plan (`grep -c '"flat":true' compositions/<arc>/b*.html`); view frames 1 s apart inside one beat |
| content zoom | no scene scales the whole scene; no zoom-in/zoom-out seam | the worker named three sources: the zoom-out reveal scene in `src/scenes.mjs`, card entrances `scale 0->1`, and `SEAM_ROTATION` in `src/lkmotion.mjs`. Only the wipe may scale |
| cursor | none drawn, no click ripple | no `.cursor` element visible in any frame |
| wipe | a lattice of pixel windows that **reveals the incoming beat** while the outgoing beat stays visible in the gaps; never a white or colour wash over everything | frame at the seam, three frames 0.3 s apart; see the skill |
| wipe speed | readable as a wipe: ~0.42 s per tile, ~0.52 s front (was 0.22 / 0.26 and read as a flash) | the `WIPE` spec in the composition |
| assets | all 8 `assets/ears/ear*.webp` and all `assets/audio/agency-*.mp3` present, every `src` / `href` resolves | walk `compositions/**/*.html` for `src=` / `href=` and stat each |
| length | the film's duration equals the narration audio, within 1 s | compare `ffprobe` duration to `assets/audio/<arc>.mp3` |
| narration chain | script words, audio words and timing words agree (three different counts caused a 171 s film from an 86 s clip) | `npm run times -- beats <arc>`; word counts of `narrations/<arc>.json`, the mp3 transcript and `assets/timing/<arc>.json` |
| look | flat `#2A8CFF` / `#FFFFFF` stages, owner's card design, tiles, black outer stroke, no blur | `npm run lint:design` and read frames |

## 4. The mistakes that cost the owner time (do not repeat)

1. **Fixing the wrong layer.** The camera was flat but the content still zoomed; the owner saw zoom and the first answer was about the camera. Look at frames before explaining.
2. **Assets missing from a sibling repo.** Services-Video lacked the ears and the narration mp3s that Hyperframes had; renders showed empty outlined boxes. Diff asset trees before rendering.
3. **Three scripts, one film.** 701-word script, 246-word audio, a 161 s beat clock: the film ran 171 s. The storyboard times are hand-authored; changing the audio means re-timing the storyboard.
4. **Overlay instead of mask.** The first wipe painted tiles over both beats. A mask clips only the incoming beat.
5. **Rebuilding after it worked.** Composition rebuilds at about 3:24 PM broke a working render and had to be reverted. When a render is blessed, **commit its compositions before touching generators**, and diff after any rebuild.
6. **Claiming without proof.** The owner asked for screenshots of the transitions. A claim about visuals needs frames attached (see the skill).
7. **Ignoring delegation instructions.** A handoff must @mention the receiving agent, in the channel the owner named.

## 5. Known repo hazards

- **The generator cannot reproduce the overview arc.** `src/` has no `agency-overview` storyboard and no `flat` option; `compositions/agency-overview*` was committed (98d703c) without the generator changes that made it. Running `npm run build` may overwrite it with older behaviour **(unverified: do it in a throwaway worktree and diff before trusting)**.
- The three older arcs (`agency-prospects`, `agency-calls`, `agency-leads`) still carry the full camera and cursor in their committed compositions, so they do **not** meet this standard yet.
- `src/world.mjs` (floor grid, drop-lines) and `scripts/lint-films.mjs` are untracked on `main`.
- The reference render is gone. Re-render to create a new blessed reference and record its path and commit here.

## 6. Definition of done for a film

All of section 3 passes **and** the review artefact exists: seam frames, a mid-beat frame per scene kind, the first and last frames, and `ffprobe` output, saved outside the repo (`.scratch/hyperframes-review/`) and listed in the handoff message. Then post the render, name the commit, and @mention the requester. Procedure: the `/lk-film-review` skill.
