# lip

**Lives in:** `src/lkcolor.mjs`, `src/lkextrude.mjs`, `scripts/test-color.mjs`

## What it is

The **lip** is the visible side of a slab, and it has **no colour of its own**. It is derived at render time from the element's computed base colour, in OKLCH: the same colour with its lightness lowered, hue and chroma kept.

## When it comes to the composition

When an element lifts on hover or a press, or while it rises in a transition, its lip shows. The lip of a blue card is a deeper blue, of a red dot a deeper red, of a pale row a deeper pale blue. A new colour needs no second colour defined.

## How it works

`__lip.apply(root)` runs once after a page's own colours are set. For each slab host it reads `getComputedStyle(host).backgroundColor`, converts to OKLCH, and colours each slice by its `data-t`: lightness multiplied by **0.78** at the face down to **0.58** at the back, hue and chroma kept. If the darker colour does not fit sRGB at that chroma, the **chroma** (never the hue) is reduced until it does. OKLCH is perceptual, so lowering L darkens without the hue drift and muddy greys of HSL or "mix with black". White, with no hue to keep, gets a neutral grey. A host with no solid background is skipped; an image (a cutout) shades by filter instead.

## How it composes

It is computed from the real element, so it follows the element through hover, press and transition without any colour table.

## Rules and gates

| rule | enforced by |
| --- | --- |
| round-trip, hue kept within 1.5 deg, chroma kept, lightness lowered by the factor, in gamut, deterministic | `test:color` |
| no colour literal in `lkextrude.mjs`, none in the slab markup | `test:color` |
| every page with slabs runs `__lip.apply`; no slice has a colour | `lint:components` C17, `lint:transitions` T11 |

## Related

[extrusion/slab](./slab.md), [motion/activation](../motion/activation.md), [COMPONENTS.md](../COMPONENTS.md)
