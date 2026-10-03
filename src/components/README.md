# components/

The shared UI the films are built from: one directory per component, called by name, each declaring its
markup, its entrance, its pointer targets and its thickness. A scene composes these instead of
re-implementing them, so every card, tile, pill and table enters the same way and exposes the same
pointer logic. Method and rules: [docs/COMPONENTS.md](../../docs/COMPONENTS.md). Gate:
`npm run lint:components`.

| id | kind | what it is |
|---|---|---|
| `card` | surface | the card family (`cardFor`, `pill` style, chips): inversion, outer stroke, hard drop |
| `tile` | atom | the icon tile: tile first, heroicon last |
| `pill` | control | a solid padded pill with a tile, extruded; the pointer's press target |
| `chip` | atom | a numbered chip or the API-name chip |
| `table` | collection | a real table: header, column heads, rows that rise one at a time; the focus row lifts |
| `cutout` | family | a die-cut ear sticker (the brand's own cutouts, `assets/ears`), one per beat, chosen by what the beat is about; light extrusion, spring entrance |
| `satellite` | family | a family member around the main component: card + tile + icon + label, extruded; placed by `layout.mjs` |

```
src/components/
  index.mjs        the registry: get(), list(), validate(), componentsCSS
  layout.mjs       WHERE components stand around the main one (SLOTS, slotsFor): one placement system for films + labs
  anatomy.mjs      the order and ease of every entrance + the runtime that plays it (__cmp)
  card/ tile/ pill/ chip/ table/ satellite/ cutout/    index.mjs each
```

## A component is

```js
export const id, summary
export const semantics = { kind, use, avoid, tone, needs }
export const sample = { ...props that render it }          // used by the gate, the docs and the lab
export const css = `...`                                    // its own rules
export function html(props)                                 // markup; extruded when props.extrude
export function steps(props)                                // the entrance, as ordered DATA
export function targets(props)                              // { items, focus, focusCell?, tail, press }
```

`steps` is data (not code) because a scene's animation is serialised into a page with `toString()`, which
drops closure scope; the steps travel as JSON (`CMP`) and the one runtime `__cmp.play(tl, qq, steps, t0)`
plays them. The tweens are the same tweens a scene would have written by hand, so the director still
retimes rows to the narration.

## Using one in a scene

```js
import * as TABLE from "./components/table/index.mjs";
// factory:  html: TABLE.html(props),   cmp: { steps: TABLE.steps(props), ... }
// anim:     __cmp.play(tl, qq, CMP.steps, t0)
```

and the director takes the pointer's items from `TABLE.targets(props)`.

## Adding one

1. `src/components/<id>/index.mjs` with the contract above (copy `table/`).
2. Register it in `index.mjs`.
3. Describe it in `docs/COMPONENTS.md` and in the table above (the gate requires both).
4. `npm run lint:components`, then `npm run lab:components` and read the frames.
