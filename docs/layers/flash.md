# flash

**Lives in:** `src/transitions/common.mjs`, `src/lkfx.mjs`, `src/transitions/scale-swap.mjs`

## What it is

The flash is the **gunshot**: a hard exposure overlay at the seam of a cut. A radial white-to-blue light, driven only by
its opacity curve (`flashAt`): a 3-frame attack to a peak of 0.5, a fast tail, gone by 0.5 s.

It is a **light overlay, not a fade of content**, which is why its single opacity write is the one exception to "nothing
fades" (`flare-ok`).

## When it comes to the composition

Swap-style transitions (`scale-swap`) use it: it fires on the cut, between the outgoing scene scaling out and the
incoming scene scaling in, so the swap reads as one move. `pixel-wipe` has **no** full-frame flash: its flash lives on
the wipe front only, as young white cells, so nothing washes the frame.

## How it works

`flashPart()` returns the markup and css; `flashFrameJS` is the one statement the transition's frame code ends with:
`flashEl.style.opacity = __fx2.flashAt(t - SEAM, FLASH)`. It sits at z 85 **inside** the adjustment layer, so it scales
with the rush, but below the rings and pointer, so it never washes them out.

## How it composes

| relation | what |
| --- | --- |
| inside | the adjustment layer (z 85 within it) |
| below | the rings and the pointer |
| order | after ramp-out, before the incoming motion: `ramp-out > scale-out > flash > scale-in > ramp-in` |
| recoil | the adjustment layer's small kick (`kickAt`) fires at the flash's attack |

## Rules and gates

| rule | enforced by |
| --- | --- |
| dark before it fires, hard attack, only decays after the peak, gone by 0.5 s, peak 0.5 | `test:fx` (flash) |
| a transition's phase order is part of its contract | `test:fx`, `lint:transitions` |
| pixel-wipe has no full-frame flash layer | `test:fx` |

## Related

[layers/adjustment-layer](./adjustment-layer.md), [transitions/scale-swap](../transitions/scale-swap.md),
[transitions/speed-ramp](../transitions/speed-ramp.md).
