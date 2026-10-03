# scale-swap

**Lives in:** `src/transitions/scale-swap.mjs`, `src/transitions/index.mjs`

## What it is

The outgoing composition scales to nothing; the incoming one scales up from nothing.

## When it comes to the composition

A hard swap with no overlap: it is the simpler cut for beats that should not feel like one continuous move.

## How it works

Order: `ramp-out > scale-out > flash > scale-in > ramp-in`. Both scales are springs; the flash fires between them and the adjustment layer recoils with it.

## How it composes

Uses the full-frame flash (z 85, inside the adjustment layer).

## Rules and gates

| rule | enforced by |
| --- | --- |
| meets the transition contract; order equals its phases; never fades | `test:fx`, `lint:transitions` |

## Related

[layers/flash](../layers/flash.md), [transitions/speed-ramp](./speed-ramp.md), [TRANSITION_FX.md](../TRANSITION_FX.md)
