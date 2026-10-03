# ownership

**Lives in:** `src/lkextrude.mjs`, `src/components/card/index.mjs`

## What it is

The extrusion is **owned by its element**: it is the element's own children, not a separate layer behind it. When the element moves, scales or rotates, the extrusion goes with it and keeps the same depth.

## When it comes to the composition

This was a real bug. A lower element's extrusion appeared to come from the layer behind it and did not line up with its container.

## How it works

The slices are `position:absolute`. If the host is not positioned they attach to the nearest *positioned ancestor* the moment the host's own GSAP transform clears at rest, which is a different layer. So `.x3d` sets `position: relative`: the host is the containing block of its own slices.

Every card gets one, not only the ones a component built. `card()` stamps each opaque card with a `--slab:<role>` marker and **one build pass**, `applySlabs`, turns every marked card into an owned slab: it adds `x3d` and `position:relative` and puts the slices as the card's first child. A card that already is a slab is left alone; a card with `overflow:hidden` (it clips content, which would flatten the sides) gets `data-slab-exempt="clip"`.

## How it composes

The pass runs after a scene builds and after the satellites are added, so nothing is left as a bare marker.

## Rules and gates

| rule | enforced by |
| --- | --- |
| slab hosts are `position:relative`; no static host; no unresolved `--slab:` marker | `lint:components` C15, `lint:transitions` T7 |

## Related

[extrusion/slab](./slab.md), [components/card](../components/card.md)
