# Handoff: how the film series got here

Written 2026-10-04 by matt-claude, reconstructed from the #general history (2026-10-02 17:57 UTC onward; all times below are the relay's UTC timestamps, not the owner's local clock), the #Hyper Frames thread and the repo at `98d703c`. The worker agent was asked for its own account and did not give one (it was confused about its identity), so **this is a reconstruction, not the worker's memory**. Items from the worker's own messages are marked *(worker)*. Read [FILM_STANDARD.md](./FILM_STANDARD.md) for the rules; this file is the story and the state.

## What the work is

A series of narrated explainer videos, one per Twenty CRM object, built in HyperFrames and posted into the Services & Offers / Resources forums so the team can see what we sell and how. Four arcs are in scope: `agency-prospects`, `agency-calls`, `agency-leads`, `agency-overview` (18 beats, b0-b17). Narration is generated with Deepgram (`narrations/*.json` -> `assets/audio/*.mp3` + `assets/timing/*.json`). Project: `REPOS/ListeningKit-Hyperframes`, pushed to github.com/matthewdonsemail-lab/ListeningKit-Hyperframes on `main`.

## Before 2026-10-04: how the series started (UTC)

| time | what happened |
| --- | --- |
| 10-02 17:57-18:16 | Owner asked the worker to generate explainer videos. TTS keys tested; Deepgram (`aura-2-thalia-en` for speech, `nova-3` for word timings) worked, AssemblyAI TTS did not. HyperFrames chosen as the renderer; first render `agency-prospects.mp4` (78 s, white on blue) |
| 10-02 18:24-18:53 | Owner wanted ~3-minute videos for every object; then asked for research only. Worker produced `RESEARCH/EXPLAINER_SERIES_ADOPTION_DOSSIER.md` (best source: HyperFrames `product-launch-video/references/story-design.md`) |
| 10-02 18:57-19:22 | Brief: highly energetic, on-brand explainers for every ListeningKit Resources object, using logo.svg, Satoshi and the brand colours from the ui-kit. 16 narrations/compositions already existed in `listeningkit-object-videos` |
| 10-02 19:25-19:27 | Owner: the videos "look like ass". Worker agreed: four-card template, one layout held 35-40 s. Render loop killed |
| 10-02 20:42-20:43 | New 3m21s version posted; owner rejected it: remove the gradient, use the onboarding design language, constant motion, J-cuts, transcript-driven edit, diagrams that reinforce the speech, consistent dither |
| 10-02 22:28-22:38 | Squircle clip-path removed (it smeared); typography research saved to `RESEARCH/HYPERFRAMES_TYPOGRAPHY_REFERENCE.md`; Satoshi fonts found not loading in snapshots (later corrected: snapshots read the project root, renders read `compositions/`) |
| 10-02 23:29-10-03 00:00 | Owner: "much better", but some cards were opaque or faint and tiles fully rounded. Work moved into the public repo `ListeningKit-Hyperframes` with `lefthook.yml` (forbids opaque colours) and `DESIGN_SYSTEM.md` |
| 10-03 00:49 | Card-inversion and heroicon chip work (`985aa64`); later commits added the motion treatment library, per-object arcs and camera director (`98d703c`'s parents) |

Note: I could only page back to 2026-10-02 17:57 UTC (200 messages per request). Anything earlier, and the 10-03 midday to 10-04 02:38 stretch, was only skimmed by keyword and may hold further decisions.

## Timeline (2026-10-04, UTC)

| time | what happened |
| --- | --- |
| 04:00 | Owner asked for videos explaining what we sell and how, built with the existing Hyperframes rules, slower beats. A scratch copy `ListeningKit-Services-Video` was created for the work |
| 04:50 | First agency-overview render rejected: keep the colours and card design, drop 3D, mouse and camera movement |
| 05:06 | Owner: keep the pixel wipe between beats; the fade is bad |
| 05:50 | *(worker)* camera cut to one push-in per beat, cursor layer removed |
| 06:04-06:19 | Owner asked why zooms remained. *(worker)* found the camera was flat but content still scaled in three places (zoom-out reveal scene, card entrance and exit scaling, zoom seams) |
| 06:19-06:23 | *(worker)* copied the 8 ear images and 14 narration mp3s that Services-Video lacked; slowed the wipe to 0.42 / 0.52; found the 171 s length came from a 161 s beat clock against 86 s of audio |
| 07:00 | Owner: the wipe must be a mask, not an overlay; take screenshots at the transitions |
| 07:57 | Owner confirmed a seam frame (`.scratch/seam/t42.15.png`) looked right |
| ~15:24 local | Composition rebuilds broke the working render; *(worker)* reverted them |
| 08:22 | Owner ruled `ListeningKit-Services-Video_2026-10-04_14-25-03.mp4` the correct render |
| 08:51-09:00 | Work folded into `ListeningKit-Hyperframes` (commit `98d703c`: agency-overview arc, grid pixelate wipe component, timing data), pushed to `main` |
| 09:00-09:14 | #Hyper Frames channel created; the owner repeatedly had to tell the worker to hand off to matt-claude |

## State of the repo at `98d703c`

- Only `agency-overview` is flat (`"flat": true`, no camera). The other three arcs still run the older camera and cursor, so they do not meet the standard.
- The wipe is a mask (`compositions/components/grid-pixelate-wipe.html`, `docs/transitions/pixel-wipe.md`).
- The generator in `src/` has no `agency-overview` storyboard and no `flat` option. See FILM_STANDARD section 5 before running `npm run build`.
- `ListeningKit-Services-Video` now holds only an empty `renders/` folder and a log; it is not a git repo. The reference render was deleted.
- Uncommitted on `main`: `src/world.mjs`, `scripts/lint-films.mjs`.

## What to do next

1. Confirm with the owner: flat only, or a level push-in allowed (R4 vs R2)? Is `src/world.mjs` (floor grid, drop lines) wanted?
2. In a throwaway worktree, run `npm run build` and diff `compositions/` to learn what the generator would clobber.
3. Port the `flat` option and the overview storyboard into `src/`, so the generator reproduces what is committed.
4. Bring `agency-prospects`, `agency-calls`, `agency-leads` to the standard, then render all four and review them with the `/lk-film-review` loop (frames as evidence).
5. Re-render, record the new blessed render path and commit in FILM_STANDARD, and post the films into the forum threads.

## Who is who

`worker` is the agent that did the build; its name was wrongly not in its prompt, and a corrected prompt is awaiting the owner's approval in Buzz Desktop. `matt-claude` (this agent) owns the documentation and review. `matt` is the owner and decides all look-and-feel questions.
