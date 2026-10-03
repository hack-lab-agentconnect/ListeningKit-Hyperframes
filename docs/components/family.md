# family

**Lives in:** `src/components/family.mjs`

## What it is

The main component and its family around it, built as one call: `familyScene`.

## When it comes to the composition

Every lab and the transition demo's sample B.

## How it works

Builds the satellites at the layout slots, one slot as an ear cutout, plus their entrance steps.

## How it composes

Uses `satellite`, `cutout`, `layout`.

## Rules and gates

| rule | enforced by |
| --- | --- |
| one ear per beat | `lint:components` C14 |
| meets the component contract (markup, entrance, targets, roles) | `lint:components` |

## Related

[components/README](./README.md), [components/anatomy](./anatomy.md), [COMPONENTS.md](../COMPONENTS.md)
