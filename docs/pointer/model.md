# model

**Lives in:** `src/lkpointer.mjs`, `scripts/test-pointer.mjs`

## What it is

The pointer model is a stateless, closed-form description of **one cursor** and the camera that loosely follows it: `build(events)` returns `pointerAt(t)`, `cameraAt(t)` and `stateAt(t)`, all pure functions of time.

## When it comes to the composition

There is one pointer. It orbits by default and travels to each event (a hover or a click) on a smooth path, arrives, holds, and retreats. The camera follows it with a lag of about 0.75 s. Because the model is stateless, frame 812 renders without frames 0 to 811.

## How it works

Each event is `{ t0, tA, tB, t1, p, click?, circle?, zoom }`: start travelling, arrive, release, done, the world point. A hover circles the point; a click presses at `click` and radiates the rings. The camera is a lagged follower; its **zoom** is a `track` of the `cam` spring keyed at the pointer's arrival (`tA - 0.1`) and release (`tB + 0.25`). `pose(P, zoom, rx, ry)` turns a framing intent into the stage transform; `project(P, cam)` maps a world point to the screen.

## How it composes

The pointer model owns the pointer and the baseline camera; the camera director (camera domain) layers moves over it, and the layers domain draws the cursor and the rings from it.

## Rules and gates

| rule | enforced by |
| --- | --- |
| no teleport, continuous velocity, arrives at every event | `test:pointer` |
| camera follows loosely (0.6 to 1.6 s), is slow in translation and tilt, zoom push has mass | `test:pointer` |
| the zoom is a `track` and agrees with `lkspring` | `test:spring` |

## Related

[pointer/click](./click.md), [layers/pointer](../layers/pointer.md), [camera/follow](../camera/follow.md), [POINTER_MOTION.md](../POINTER_MOTION.md)
