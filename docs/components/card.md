# card

**Lives in:** `src/components/card/index.mjs`, `src/lkdesign.mjs`

## What it is

The card family: the surface everything else stands on. `cardFor`, the pill style and chips share inversion, the black outer stroke and the hard drop.

## When it comes to the composition

Every panel, note and node in a scene is a card. A white card on a blue stage, a blue card on white.

## How it works

`card(maxW, r, fill, stroke)` returns the style, and stamps an opaque card with the `--slab` marker so `applySlabs` makes it an owned slab. A translucent card is not a slab.

## How it composes

Below it: the stage. On it: tiles, text, rows.

## Rules and gates

| rule | enforced by |
| --- | --- |
| a card has the outer stroke and a hard drop; no blur, no bare shadow | `lint:design` |
| opaque cards become owned slabs | `lint:components` C15 |
| meets the component contract (markup, entrance, targets, roles) | `lint:components` |

## Related

[components/README](./README.md), [components/anatomy](./anatomy.md), [COMPONENTS.md](../COMPONENTS.md)
