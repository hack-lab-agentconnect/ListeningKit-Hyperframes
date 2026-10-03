# director

**Lives in:** `src/camera/director.mjs`, `src/camera/index.mjs`

## What it is

The camera director **plans** a beat's camera: which moves, when, and how they hand over. The registry (`index.mjs`) is the vocabulary; the director is the half that decides. It is a pure function: no DOM, no randomness, the same beat always gets the same camera.

## When it comes to the composition

Given a beat's length and its events (the pointer's clicks and hovers), the director picks a **style**, lays the moves out in time and enforces the rules that keep a film readable. It exists because one behaviour, follow the pointer and push on every stop, zoomed so often that no zoom meant anything and the picture lost its hierarchy.

## How it works

The styles are dealt in order, `follow`, `pushpan`, `breathe`, `cutpush`, `yawsweep`, skipping a close style in a beat too short for it and never repeating the previous beat's style.

| style | the moves |
| --- | --- |
| `breathe` | breathe throughout; the clicks are felt as zoom punches only |
| `follow` | breathe, follow, breathe |
| `pushpan` | breathe, push on the first focus, pan to the next, pull, breathe |
| `cutpush` | breathe, cut to the focus on its click, push, pull, breathe |
| `yawsweep` | yaw, follow, breathe |

**Blending.** Moves return an *intent* `{ P, zoom, rx, ry }`, never a finished pose. At a hand-over the two intents are
mixed with a weight that rises 0 to 1 over `blend` seconds (0.7 by default) on a smoother-step, and the pose is computed
once from the mix, so a hand-over is continuous in position and velocity. A cut is `blend: 0`.

**The click.** Every click adds a small zoom **punch** (a pulse, +0.05) to whatever the camera is doing, so the click is felt
in the frame whatever the move.

## How it composes

The director's plan maps onto the film runtime (`filmShots`: one GSAP tween per shot) and onto the stateless camera module (`cameraModule`, serialised into a page as `__cam`) that the labs use. Both read the same plan.

## Rules and gates

| rule | enforced by |
| --- | --- |
| at most one close move per 6 s of beat; none under 4.5 s | `test:camera` |
| close beats keep at least 40 % breathing room | `test:camera` |
| a move lasts at least 1.2 s (a cut excepted); no two identical moves in a row | `test:camera` |
| a beat's style differs from the previous; at most 45 % of beats are close; a 30-beat film uses at least 4 moves | `test:camera` |
| a close move only lands on a click, after its element has arrived (peak rule) | `test:camera` |
| continuous except at a cut; any seek order gives the same frame | `test:camera` |

## Related

[camera/README](./README.md), [motion/peak-rule](../motion/peak-rule.md), [pointer/click](../pointer/click.md), [POINTER_MOTION.md](../POINTER_MOTION.md)
