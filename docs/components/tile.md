# tile

**Lives in:** `src/components/tile/index.mjs`

## What it is

The icon tile: a rounded blue tile with a heroicon.

## When it comes to the composition

The first thing in a card to enter after the card, then the icon, then the text.

## How it works

Entrance `spr:snap`, tile first then icon (the icon scales in last, from a rotation).

## How it composes

Inside a card or a pill.

## Rules and gates

| rule | enforced by |
| --- | --- |
| tile first, icon last | `lint:components` C3 |
| meets the component contract (markup, entrance, targets, roles) | `lint:components` |

## Related

[components/README](./README.md), [components/anatomy](./anatomy.md), [COMPONENTS.md](../COMPONENTS.md)
