# speed-ramp

**Lives in:** `src/transitions/common.mjs`, `src/lkfx.mjs`

## What it is

The speed ramp is the part of every transition that is shared: the clock runs fast into the seam and back to 1x out of it, **and the camera rushes at the scene**. The transition itself is the speed ramp, not just the clock.

## When it comes to the composition

Every cut begins with `ramp-out` and ends with `ramp-in`.

## How it works

`tau(t)` warps time: up to 3.2x into the seam, back to 1x after, never stopping or reversing and with continuous speed. `rushAt` is the camera's push into the seam (+0.8 zoom, ease-in, then ease-out). Both are applied once, on the adjustment layer, not by each composition.

## How it composes

It is the reason the adjustment layer exists.

## Rules and gates

| rule | enforced by |
| --- | --- |
| time never stops or reverses; peak 3.2x; speed continuous; back to 1x on both sides | `test:fx` (ramp) |
| rush nothing outside the ramp, peaks at the seam | `test:fx` (rush) |

## Related

[layers/adjustment-layer](../layers/adjustment-layer.md), [TRANSITION_FX.md](../TRANSITION_FX.md)
