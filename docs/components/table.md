# table

**Lives in:** `src/components/table/index.mjs`

## What it is

A real table: header, column heads and rows that **rise one at a time** out of the card.

## When it comes to the composition

Any beat that is about records. The focus row stays lifted; hovered rows lift while the hand is on them.

## How it works

The card is a `panel` slab entering on `spr:soft`. Each row lifts to its depth while it scales in on `spr:row`, **then settles flat** on `spr:settle`; its cells resolve after it. `geometry(props)` returns measured positions so a build can aim the pointer at a row without a browser.

## How it composes

Rows are flat at rest; activation lifts them (motion/activation). Click rings draw on the ring layer above, not in the card.

## Rules and gates

| rule | enforced by |
| --- | --- |
| rows rise one at a time, in order, cells after the row | `lint:components` C3 |
| rows settle flat at rest | `lint:components` C16 |
| scenes build tables through this component | `lint:components` C9 |
| meets the component contract (markup, entrance, targets, roles) | `lint:components` |

## Related

[components/README](./README.md), [components/anatomy](./anatomy.md), [COMPONENTS.md](../COMPONENTS.md), [motion/activation](../motion/activation.md)
