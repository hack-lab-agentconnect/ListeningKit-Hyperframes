# Handoff: how the film series got here

Written 2026-10-04 by matt-claude, reconstructed from the #general history, the #Hyper Frames thread and the repo at `98d703c`. The worker agent was asked for its own account and did not give one (it was confused about its identity), so **this is a reconstruction, not the worker's memory**. Items from the worker's own messages are marked *(worker)*. Read [FILM_STANDARD.md](./FILM_STANDARD.md) for the rules; this file is the story and the state.

## What the work is

A series of narrated explainer videos, one per Twenty CRM object, built in HyperFrames and posted into the Services & Offers / Resources forums so the team can see what we sell and how. Four arcs are in scope: `agency-prospects`, `agency-calls`, `agency-leads`, `agency-overview` (18 beats, b0-b17). Narration is generated with Deepgram (`narrations/*.json` -> `assets/audio/*.mp3` + `assets/timing/*.json`). Project: `REPOS/ListeningKit-Hyperframes`, pushed to github.com/matthewdonsemail-lab/ListeningKit-Hyperframes on `main`.

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
