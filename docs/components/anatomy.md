# anatomy

**Lives in:** `src/components/anatomy.mjs`

## What it is

The order and the ease of every component entrance, and the runtime that plays them (`__cmp`).

## When it comes to the composition

Every component is built from the same four parts in the same order: card, tile, icon, text.

## How it works

`EASE` maps roles to spring names; steps are JSON data (`spr:pop`) resolved at runtime, because a scene's animation is serialised into a page. `__cmp.play` adds the steps; `__cmp.lift` and `__cmp.activate` handle activation.

## How it composes

Underneath every component.

## Rules and gates

| rule | enforced by |
| --- | --- |
| order card, tile, icon, text; every ease a spring preset | `lint:components` C3, C4 |
| meets the component contract (markup, entrance, targets, roles) | `lint:components` |

## Related

[components/README](./README.md), [components/anatomy](./anatomy.md), [COMPONENTS.md](../COMPONENTS.md)
