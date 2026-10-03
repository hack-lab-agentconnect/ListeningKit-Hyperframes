# pointer

**Lives in:** `src/build-demo.mjs`, `src/lkpointer.mjs`, `src/lkchrome.mjs`

## What it is

The pointer layer is the **cursor**: one element (`.cursor`, z 95) with three sprites (arrow, open hand, pressed hand)
that are swapped, never faded. It is the topmost layer in the frame.

## When it comes to the composition

The cursor is on screen in every scene. It is the thread the eye follows from one thing to the next, and the reason a
transition feels continuous: the cursor crosses the cut in plain sight, and only the scene it is flying through changes.
A transition never touches it (`lint:transitions` T5).

## How it works

- Each frame, the pointer model gives a **world** point. It is projected through the camera, then through the adjustment
  layer's zoom, to a screen position; that sets the cursor's `x`, `y`, a rotation from its horizontal velocity, and a
  scale from the perspective factor.
- The sprite is chosen by state: `n` arrow, `h` hover (open hand), `c` pressed. They are swapped by toggling, which is the
  one place an `opacity` write is allowed (`swap-ok`).
- Pressed shrinks the cursor to 0.84 so the click is felt in the hand as well as the rings.

## How it composes

| relation | what |
| --- | --- |
| below it | the rings (z 90), then the adjustment layer and everything in it |
| shares with the rings | the click: the hand presses and the rings radiate from the same point |
| shares with the camera | the pointer model owns both; the camera follows the pointer loosely (see camera/follow) |

## Rules and gates

| rule | enforced by |
| --- | --- |
| the cursor is above rings, which are above the composite | `lint:transitions` T5, `test:fx` |
| a transition never touches the cursor | `lint:transitions` T5 |
| the pointer carries through a cut with continuous velocity | `test:fx` (pointer carries through the cut) |
| no teleport, continuous velocity, arrives at every event | `test:pointer` |

## Related

[pointer/model](../pointer/model.md), [layers/rings](./rings.md), [POINTER_MOTION.md](../POINTER_MOTION.md).
