# pill

**Lives in:** `src/components/pill/index.mjs`

## What it is

A solid padded pill with a tile, extruded; the pointer's press target.

## When it comes to the composition

Buttons and named controls.

## How it works

A `pill` slab, entrance `spr:pop`, tile and icon after.

## How it composes

Standalone or in a depth set.

## Rules and gates

| rule | enforced by |
| --- | --- |
| extruded at the pill depth | `lint:components` C10 |
| meets the component contract (markup, entrance, targets, roles) | `lint:components` |

## Related

[components/README](./README.md), [components/anatomy](./anatomy.md), [COMPONENTS.md](../COMPONENTS.md)
