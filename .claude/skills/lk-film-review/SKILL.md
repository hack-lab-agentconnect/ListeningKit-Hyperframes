---
name: lk-film-review
description: Use whenever you make, change, re-render or review a ListeningKit explainer film (any compositions/agency-* arc), or when asked to render the video, check transitions, or fix a film that looks wrong. Gives the owner's rulings in one place and a build-look-critique loop that must pass with frames as evidence before you say a film is done.
---

# ListeningKit film review

Read `docs/FILM_STANDARD.md` first: it holds the owner's rulings (flat frame, no cursor, no zoom, pixel wipe as a MASK, assets present, length matches narration) and overrides the older camera and pointer pages. Then load `/hyperframes` and `/lk-motion-grammar` for the composition contract.

## The loop (do not skip a step; do not declare done from lint alone)

1. **Preflight, before any build.**
   - `git status` clean? If a blessed render exists, note its commit. Do not rebuild generators over committed compositions without a diff plan.
   - Asset check: every `src=` / `href=` in `compositions/**/*.html` exists; `assets/ears/ear1..8.webp` and `assets/audio/agency-*.mp3` are present.
   - Timing check: word counts of the narration JSON, the mp3 transcript and `assets/timing/<arc>.json` agree; target length = audio length.
2. **Change** the source (`src/`). Do not hand-edit generated beats unless the generator cannot make it; if you do, say so in the handoff.
3. **Build and gates**: `npm run lint`, `npm run build`, `npm run check`.
4. **Capture frames outside the repo**: `npm run review -- --slug <arc> --at <t1,t2,...> --label <name>`. Always capture:
   - three frames across every seam (0.3 s apart): wipe start, mid, end;
   - one frame mid-beat for each scene kind you touched, on both stages (blue and white);
   - the first and last frames.
5. **Critique in writing, per frame.** Answer each question with what you actually see, not what you intended:
   - Is the incoming beat visible *through* pixel windows, with the outgoing beat still visible in the gaps (mask)? Or a colour wash over everything (overlay: fail)?
   - Any cursor, ripple, tilt, zoom or floating 3D drift? (fail)
   - Any empty outlined box where an image should be (missing asset)? Any text clipped, overlapping the subtitle pill, or off-frame?
   - Colours: flat `#2A8CFF` / `#FFFFFF` stages; cards inverted with the stage; black outer stroke; no blur, no gradient.
   - Does the picture match the sentence being spoken at that timestamp?
6. **Fix and repeat from step 3** until every frame passes. Two failures on the same item: change approach, do not retry the same fix.
7. **Render** with `npm run render`, then `ffprobe` the file: duration within 1 s of the audio, expected size, audio stream present. Spot-check two moments.
8. **Hand off with evidence**: render path, commit hash, the frame paths from step 4, the critique notes, and open questions. @mention whoever asked. Never post "done" without the frames.

## Hard rules

- Do not add camera moves, zoom scenes, cursors or 3D depth motion unless the owner explicitly asks in the current thread.
- Never ship a fade between beats; the transition is the pixel-wipe mask.
- Do not overwrite a blessed render; write a new file name and keep the old one until the owner approves.
- When the owner reports something looks bad, open frames of exactly that moment before answering. Describe what is in the frame first; propose the cause second.
- Report only what you verified, and attribute results to the commit (`git rev-parse HEAD`) that produced them.
