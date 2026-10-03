# cutout

**Lives in:** `src/components/cutout/index.mjs`, `assets/ears/PROVENANCE.md`

## What it is

A die-cut ear sticker from the brand's own cutouts (`ear1` to `ear8`).

## When it comes to the composition

One per beat, in a back slot, chosen by what the beat is about (`earFor`).

## How it works

The cutout's own white edge plus the system's black outer stroke (four zero-blur drop shadows) and a light extrusion of silhouette copies; entrance `spr:pop` with a rotation that settles. It is also a `.sat`, so the director animates it with the depth set.

## How it composes

In the depth set.

## Rules and gates

| rule | enforced by |
| --- | --- |
| points at a real file in `assets/ears` and its mirror; at most one per beat | `lint:components` C14 |
| meets the component contract (markup, entrance, targets, roles) | `lint:components` |

## Related

[components/README](./README.md), [components/anatomy](./anatomy.md), [COMPONENTS.md](../COMPONENTS.md)
