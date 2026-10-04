# docs/

Start with [naming-conventions.md](./naming-conventions.md): the structure of everything below is `docs/{domain}/{primitive}.md`,
mirroring the source, enforced by `npm run lint:docs`.

## The domains

| domain | read it for | primitives |
| --- | --- | --- |
| [layers](./layers/README.md) | what is above what, and why the effects stay on top | composite, adjustment-layer, rings, pointer, flash |
| [camera](./camera/README.md) | where the frame is, and how it varies | follow, breathe, push, pull, pan, yaw, cutpush, director |
| [pointer](./pointer/README.md) | the one cursor, its path, the click | model, click |
| [motion](./motion/README.md) | how things accelerate | spring, peak-rule, activation |
| [components](./components/README.md) | the shared UI | card, tile, pill, chip, table, satellite, cutout, anatomy, layout, family |
| [extrusion](./extrusion/README.md) | thickness, ownership, the derived lip | slab, ownership, lip |
| [transitions](./transitions/README.md) | cuts between compositions | pixel-wipe, scale-swap, speed-ramp |
| [tooling](./tooling/README.md) | the gates and the builds | gates |

## How a frame is made

```text
 narration + storyboard  ──►  scene (src/scenes.mjs)  ──►  components  (docs/components)
                                      │                        │ slabs, lip, springs
                                      ▼                        ▼
                         camera director plans the moves   composite  (docs/layers/composite.md)
                                      │
   cursor path ◄── pointer model ─────┤
                                      ▼
   transitions wrap two compositions in the ADJUSTMENT LAYER (docs/layers/adjustment-layer.md);
   rings and the pointer sit above it and persist through the cut.
```

## The film standard

[FILM_STANDARD.md](./FILM_STANDARD.md) is the owner's ruling on what a finished film looks like (flat frame, no cursor, pixel wipe as a mask) and the checks that prove it; [HANDOFF.md](./HANDOFF.md) is how the series got here. Both override the camera and pointer domains for published films. The procedure is the `/lk-film-review` skill.

## Long-form method documents

These are the *why* and the research behind the primitives; the primitive pages link into them.

| document | covers |
| --- | --- |
| [ANIMATION.md](./ANIMATION.md) | springs, the peak rule, activation, the bug it came from |
| [COMPONENTS.md](./COMPONENTS.md) | the anatomy, slabs, the lip, depth belongs to activation |
| [TRANSITION_FX.md](./TRANSITION_FX.md) | the speed ramp, flash, wipe, rings, layer order |
| [POINTER_MOTION.md](./POINTER_MOTION.md) | the pointer and camera model |
| [MOTION_CRITERIA.md](./MOTION_CRITERIA.md) | what a scene must do (M1 to M14) |
| [SCENE_GRAMMAR.md](./SCENE_GRAMMAR.md) | scene kinds and the beat format |
| [WORKFLOW.md](./WORKFLOW.md) | build, review, commit |
