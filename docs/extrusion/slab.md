# slab

**Lives in:** `src/lkextrude.mjs`, `scripts/test-fx.mjs`

## What it is

A slab gives a 3D element thickness. CSS has no extrude, so a slab is `layers` solid copies of the face's silhouette stacked behind it along -z.

## When it comes to the composition

Anything in the 3D world is a slab: cards, panels, rows, satellites, dots, ear cutouts. Seen from the front the slices are hidden behind the face; seen at an angle, or when the element lifts, they are its sides.

## How it works

Depth is a token per role and it is **restrained** on purpose: a few px of side, with the black outer stroke and the card doing the separating.

| role | depth px | min |
| --- | --- | --- |
| `panel` | 30 | 20 |
| `card` | 22 | 14 |
| `pill` | 18 | 12 |
| `row` | 10 | 6 |
| `chip` | 8 | 5 |
| `sticker` | 8 | 5 |

`slabFor(role)` emits the slices; each carries `data-t` (its depth, 0 at the face to 1 at the back) and **no colour**. A deep slab and an oblique "lean" were both tried and both made every component read as a block, so `lean` and `prism` exist but default off and the gate rejects them.

## How it composes

A slab host must be a 3D context (`x3d`), must not have `overflow:hidden` (it flattens the sides) and must have a **solid** face (a translucent fill shows its own slices through it).

## Rules and gates

| rule | enforced by |
| --- | --- |
| every extruded role is between its min and its depth; no lean or prism | `lint:components` C10 |
| no `overflow:hidden` on a host; slices exist and are static | `lint:components` C11, `lint:transitions` T7 |
| no colour in the slab markup | `test:color`, `lint:components` C17 |

## Related

[extrusion/ownership](./ownership.md), [extrusion/lip](./lip.md), [COMPONENTS.md](../COMPONENTS.md)
