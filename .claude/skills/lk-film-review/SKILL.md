---
name: lk-film-review
description: Use whenever you make, change, re-render or review a ListeningKit explainer film (any compositions/agency-* arc), or when asked to render the video, check transitions, or fix a film that looks wrong. Lists what the owner has complained about, the rules that follow, and a build-look-critique loop with a written scorecard that must pass, with frames as evidence, before you hand the film over.
---

# ListeningKit film review

Read `docs/FILM_STANDARD.md` first (the owner's rulings and pass/fail table) and `docs/HANDOFF.md` (how the series got here). They override the older camera and pointer pages. Then load `/hyperframes` and `/lk-motion-grammar` for the composition contract.

The owner has had to shout the same corrections repeatedly. Your job is to catch each of them yourself, before he sees the film.

## 1. What the owner has complained about (and the rule each one gives you)

| complaint (his words, cleaned up) | rule |
| --- | --- |
| "It looks like ass" / "PowerPoint with a voiceover": one layout held 35 s | a new picture at every clause; nothing static for more than a few seconds; `npm run lint:pacing` |
| "Remove that gradient" | flat `#2A8CFF` / `#FFFFFF` stages only |
| Opaque or faint coloured cards that "make no sense" | solid card, hairline edge; white card on blue stage, blue card on white stage; icon tile blue with white glyph |
| "Fully rounded is against the rules" | `rounded-md` / `rounded-lg`; no pills on tiles or bars |
| Eyebrow and text stuck top-left in every scene | vary the layout; the transcript drives the edit with J-cuts |
| Text instead of diagrams | the visual must show what is being said |
| Wrong brand: Inter, Arial, wrong logo | Satoshi by `@font-face`; the real `logo.svg`; confirm in the render log that fonts loaded |
| 3D, mouse movement and "weird camera" | flat frame, no cursor, no tilt (FILM_STANDARD R2, R4, R5) |
| "Why is it zooming in on shit?" | find every scaling source (camera, zoom reveal scene, card entrance, zoom seams) and remove it; only the wipe may scale |
| Empty outlined boxes where images belong | every asset present; ears 1-8 and all narration mp3s |
| "It's not 90 seconds" / wrong length | film duration equals the audio; script, audio and timing word counts agree |
| Short fades, a fade between beats | the pixel wipe, at a speed that reads as a wipe (~0.42 s tile, ~0.52 s front) |
| "The wipe is overlaying everything" | the wipe is a mask on the incoming beat only; the outgoing beat shows through the gaps |
| "Take screenshots and look at exactly what is happening" | claims about visuals need frames |
| "Whatever made this render is the correct one" | when a render is blessed, commit its compositions and do not regenerate over it |
| Silence for an hour, no update | post at real milestones; reply where the owner asked, with the @mention |
| Wrong words in the voiceover ("Telmex" for Telnyx) | listen to or read the transcript before rendering |

## 2. The loop (never skip a step; never declare done from lint alone)

1. **Preflight.** `git status`; note the blessed render's commit; asset walk (every `src=` / `href=` resolves); word counts of narration JSON, mp3 transcript and `assets/timing/<arc>.json`; target length = audio length.
2. **Change** the source in `src/`. If you must hand-edit a generated beat, say so in the handoff. Never regenerate over a blessed arc without diffing in a throwaway worktree.
3. **Build and gates**: `npm run lint`, `npm run build`, `npm run check`.
4. **Capture frames outside the repo**: `npm run review -- --slug <arc> --at <t1,t2,...> --label <name>`. Always: three frames across every seam (0.3 s apart), one mid-beat frame per scene kind touched on both stages, the first and last frames.
5. **Critique in writing.** Fill in the scorecard (section 3) from what you SEE in the frames, one line each, with the frame name. Describe first, judge second.
6. **Fix and repeat from 3** until every row is PASS. The same row failing twice means change approach, not retry.
7. **Render** with `npm run render`, then `ffprobe`: duration within 1 s of the audio, size, audio stream present. Open two moments of the final file.
8. **Second look.** Re-read the scorecard against the render, not the frames: a fresh pass, in the order the owner would watch (first 10 s, every seam, last 10 s). If you have a reviewer agent, give it the file and the standard, not your conclusions.
9. **Hand off** (section 4) and push.

## 3. Scorecard (paste into the handoff; every row needs evidence)

| check | PASS / FAIL | evidence (frame or command output) |
| --- | --- | --- |
| camera: no move, tilt or zoom within a beat | | |
| content zoom: no scene scales, only the wipe | | |
| cursor / ripple absent | | |
| wipe is a mask; incoming beat seen through windows | | seam frames a, b, c |
| wipe readable (not a flash); no fades | | |
| no empty boxes; all assets resolve | | asset walk output |
| flat stages, no gradient, no opaque or faint cards, no pills | | |
| Satoshi loaded; real logo | | render log line |
| no static picture held beyond the pacing limit | | `lint:pacing` |
| picture matches the sentence at each sampled time | | |
| film duration vs audio duration | | `ffprobe` numbers |
| voiceover words correct (no mis-transcribed names) | | |

Any FAIL means the film is not ready; say so in the handoff instead of hiding it.

## 4. Hand off to the owner

Post in the channel the owner named, replying in the thread, with: the render path, `git rev-parse HEAD`, the scorecard, the frame paths, what you changed and why, anything you hand-edited, and open questions. @mention the requester. Then commit and **push the branch** to the remote (not `main` unless told), and give the commit hash. Do not wait to be asked twice.

## 5. Hard rules

- Do not add camera moves, zoom scenes, cursors or 3D motion unless the owner asks in the current thread.
- Do not overwrite a blessed render; use a new file name and keep the old one until approved.
- When the owner says something looks bad, open frames of exactly that moment before answering.
- Report only what you verified, attributed to the commit that produced it. "I don't know" beats a guess.
