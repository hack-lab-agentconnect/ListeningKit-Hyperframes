# pixel-wipe

**Lives in:** `src/transitions/pixel-wipe.mjs`, `src/transitions/index.mjs`, `src/lkfx.mjs`

## What it is

The incoming composition is revealed *through* a sweep of pixel windows: a mask, not an overlay.

## When it comes to the composition

A J-cut: the incoming composition mounts before the outgoing one ends (B at 5 s, A until 5.82 s). The cut reads as the speed ramp, a hard flash on the wipe front, and the new scene coming up through the pixels.

## How it works

Order: `ramp-out > flash > sweep > ramp-in`. B is clipped by a `clip-path` of pixel cells that scale up with overshoot, sweep left to right and accelerate; the cells carry their grid index. The flash is on the front only (young cells are white, then a 2 px outline), never a full-frame layer. Finished cells carry nothing.

## How it composes

Both groups and the mask edges sit inside the adjustment layer, so the speed-ramp rush scales the whole picture; the rings and pointer stay above.

## Rules and gates

| rule | enforced by |
| --- | --- |
| meets the transition contract; order equals its phases | `test:fx`, `lint:transitions` |
| never fades; masks the incoming group; no full-frame flash | `test:fx` |
| sweeps in its direction, accelerates, complete by its own timing | `test:fx` |

## Related

[transitions/speed-ramp](./speed-ramp.md), [layers/adjustment-layer](../layers/adjustment-layer.md), [TRANSITION_FX.md](../TRANSITION_FX.md)
