# layout

**Lives in:** `src/components/layout.mjs`

## What it is

Where components stand around the main one: the shared slots (`SLOTS`, `slotsFor`).

## When it comes to the composition

One placement system for the films and every lab, so the arrangement around a component is never invented per scene.

## How it works

Slots have an x, y and z; back slots (z < 0) sit behind, foreground slots at the frame edge.

## How it composes

Used by `satellite`, `cutout` and `family`.

## Rules and gates

| rule | enforced by |
| --- | --- |
| films and labs take positions from here | `lint:components` C13 |
| meets the component contract (markup, entrance, targets, roles) | `lint:components` |

## Related

[components/README](./README.md), [components/anatomy](./anatomy.md), [COMPONENTS.md](../COMPONENTS.md)
