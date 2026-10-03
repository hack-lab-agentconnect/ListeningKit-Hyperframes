# satellite

**Lives in:** `src/components/satellite/index.mjs`, `src/components/layout.mjs`

## What it is

A family member standing around the main component: card, tile, icon and label, extruded, never pressed.

## When it comes to the composition

The depth set: related objects as background and foreground the main component rises out of.

## How it works

Placed by `layout.mjs` slots. Entrance `spr:pop`, the director also floats it slowly.

## How it composes

Around the main component; one slot holds an ear cutout.

## Rules and gates

| rule | enforced by |
| --- | --- |
| positions come from `layout.mjs` | `lint:components` C13 |
| a satellite is never pressed | `lint:components` C12 |
| meets the component contract (markup, entrance, targets, roles) | `lint:components` |

## Related

[components/README](./README.md), [components/anatomy](./anatomy.md), [COMPONENTS.md](../COMPONENTS.md)
