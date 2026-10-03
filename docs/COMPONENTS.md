---
title: "Components - one directory each, one anatomy"
tags: [hyperframes, components, 3d, motion]
status: active
created: 2026-10-03
---

# Components

Every piece of UI in the films (the card, the tile, the pill, the chip, the table) is a component in
`src/components/<id>/`, called by name. A scene *composes* components; it does not re-implement them. So
all of them share one **anatomy**, one **extrusion**, and one set of **pointer targets**, and a change to
how a table rises is made once, in `components/table/`. Not to be confused with
[COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md), which maps the *treatments* and seams.

Code: `src/components/` (registry `index.mjs`, `anatomy.mjs`, one directory per component). Gate:
`npm run lint:components` (section 6).

## 1. The anatomy (the same for every component)

```
1. the CARD (or the row, or the pill)   overshoots out from its own centre
2. the blue TILE
3. the HEROICON                          last of the three
4. the TEXT                              rises, with overshoot
```

- **Nothing fades.** Every entrance is `scale 0 -> 1` on a **spring** (`spr:pop`, `snap`, `soft`; see [ANIMATION.md](./ANIMATION.md)), plus a rise in `y` where the
  thing is "coming out of the screen"; every exit is `scale 1 -> 0`. A component never writes opacity.
- **Solid and padded**, never hollow: a pill or chip always has a face and a tile.
- The order and the ease live in one file (`anatomy.mjs`: `EASE`, `GAP`, `ORDER`), so changing the feel of
  the whole product is one edit.

## 2. A component is data plus markup

```js
export const id, summary
export const semantics = { kind, use, avoid, tone, needs }   // when to use it, when not, how it inverts
export const sample = { ... }                                 // props that render it (the gate, the lab)
export const css = `...`
export function html(props)       // markup; a slab when props.extrude
export function steps(props)      // the entrance as ordered DATA: { sel, at, dur, from, to, ease, role }
export function targets(props)    // what the pointer may do: { items, focus, focusCell?, tail, press }
```

`steps` is data, not code, because a scene's animation is serialised into its sub-composition page with
`toString()`, which drops closure scope. The steps travel as JSON (`CMP`) and one runtime,
`__cmp.play(tl, qq, steps, t0)` (`anatomy.mjs`), plays them. They are the same tweens a scene would have
written by hand, so the director still retimes the rows to the narration.

## 3. Rising out of the screen: the table

`components/table` is the pattern. A real table (not a card pretending to be one): a header band, column
heads, and **rows that rise one at a time**. Row *i* rises at `0.8 + 0.16 i` s (`y 44 -> 0`, `scale 0 -> 1`,
`spr:pop`), and **its cells resolve after it**. The focus row then lifts toward the camera (`scale
1.015`), and the focus column head and cells emphasise. Each row is a **slab**, so it has thickness as it
rises and while the camera orbits it.

The director no longer knows about tables: `groupsFor("table")` asks `TABLE.targets(props)` for the items
(`.trow[data-i]`), the focus row and the tail, so the pointer's walk down the rows comes from the component.

## 4. Extrusion: restrained

Every component that stands in the 3D world is a **slab** (`lkextrude.mjs`): the face is a host with
`class="x3d"` (`transform-style: preserve-3d`) and `slabFor(role)` puts a few solid slices behind it. It is
**restrained on purpose**: a few pixels of side, with real depth showing when the camera tilts. The black outer
stroke and the card do the separating; the slab only stops a component being a paper-thin sticker in a 3D scene.

This was tuned down twice after review. A deep slab, then a slab with an oblique "lean" and perspective
compensation, both made every component read as a block. Both are **off** (`lean` and `prism` options exist but
default off), and the gate rejects a prism slab.

| role | depth (px) | minimum | used by |
|---|---|---|---|
| `panel` | 30 | 20 | the table card |
| `card` | 22 | 14 | satellites |
| `pill` | 18 | 12 | pills |
| `row` | 10 | 6 | table rows |
| `chip` | 8 | 5 | chips |
| `sticker` | 8 | 5 | cutouts (silhouette copies) |

A component declares `export const roles = { ... }`; the gate checks the depth is between the role's minimum and
its depth. Other rules: a host **must not** have `overflow:hidden` (it flattens the sides to the plane); the **face
under a slab must be solid** (a translucent row fill lets the dark slices show through as a bar; the table blends
its tints into opaque colours); slices are static, so they never fight the host's own tweens.

### The extrusion is owned by the element

A slab belongs to the element it is on. It is not a separate layer behind it. Two things make that true, and a
bug taught both:

1. **The host is the slices' containing block.** The slices are absolutely positioned, so the host must be
   `position: relative` (`.x3d` sets it). Without it the slices attach to the nearest *positioned ancestor* as soon as
   the host's own GSAP transform clears at rest, and the extrusion appears to come from whatever layer is behind the
   element (the "lower white element" whose depth did not line up with its container). With it, the extrusion moves,
   scales and rotates with the element and keeps the same depth wherever it goes.
2. **Every card gets one**, not just the ones a component built. `card()` stamps each opaque card with a `--slab:`
   marker and one build pass (`applySlabs` in `lkextrude.mjs`) turns every marked card into an owned slab: it adds
   `x3d` and `position:relative`, and puts the slices as the card's FIRST child. A card that already is a slab is left
   alone; a card with `overflow:hidden` (it clips its content, which would flatten the sides) gets
   `data-slab-exempt="clip"`. Nothing is left unprocessed (an unresolved marker fails the gate).

### Depth belongs to activation, not to rest

An element INSIDE a component (a row, a cell, a tile) is **flat in its card's plane at rest**: its slab is behind
the card face, hidden, and it carries no hard shadow. The depth and the shadow show only:

- **while it rises** (a transition): a row lifts out of the card to its slab's depth (`z` = `DEPTH.row`) while it
  scales in, then **settles back flat** (`kind: "to"`, `z: 0`);
- **while it is activated**: the focus row, a hovered cell or a pressed one lifts again (`__cmp.lift(..., z)`) and
  settles back when the hand leaves. In a film the lift is driven by the same events that move the pointer.

The return to rest uses `spr:settle`, which cannot undershoot the card plane (an overshooting return dipped behind the card face and the row vanished, see ANIMATION.md 5a); overlapping hovers are one pure function of time per row (`__cmp.activate`). A row that stayed lifted at rest would show a hard shadow under every row of the table, all the time (a bug we had:
every row looked like a button). Overshoot is in height and depth, never width (`spr:row`, 2 %), so a rising row can
never poke past its card, and the big table card itself uses the heavier `soft` spring (4 %).

### The lip: derived from the element, never chosen

The side of a slab (the **lip** that shows when an element lifts on hover, on a press, or while it rises) has **no
colour of its own**. Nothing in `lkextrude.mjs` is a colour: each slice carries only its depth (`data-t`, 0 at the
face to 1 at the back). At render time `__lip.apply(root)` (`lkcolor.mjs`) reads each slab host's **computed
background**, converts it to **OKLCH**, multiplies the **lightness** down (x 0.78 at the face to x 0.58 at the back)
and keeps the **hue and the chroma**; if the darker colour does not fit sRGB at that chroma, the chroma (never the
hue) is reduced until it does. So:

- the lip of the blue card is a deeper blue, of a red dot a deeper red, of a pale row a deeper pale blue, of white a
  neutral grey (white has no hue to keep);
- a new colour needs **no second colour defined** for it, and the lip follows the element through hover, press and
  transition because it is computed from the element's actual colour;
- OKLCH is perceptual: lowering L darkens without the hue drift and muddy greys of HSL or "mix with black".

It runs after a scene's own animation has set its colours (the focus row's fill, for instance), once, before the first
seek. A host with no solid background gets no lip; a cutout (an image) has no background to derive from, so its
slices shade the image's own pixels with a filter. `npm run test:color` checks the maths (round-trip, hue kept within
1.5 deg, chroma kept, lightness lowered by the factor, in gamut, deterministic), and C17 / T11 check that every page
with slabs derives its lip and that no slice carries a colour.

### The three layers: elements, rings, pointer

```
 top      THE POINTER      .cursor   z 95   always visible, through every transition
          THE CLICK RINGS  #rings    z 90   their own full-screen layer, directly under the pointer
 bottom   THE COMPOSITE    .adj      z 10   the stage and every 3D element (cards, rows, satellites, ears)
```

The rings are **above every element and outside both compositions and the adjustment layer**, so a wipe or a flash can
never clip or cover them, exactly like the pointer: they **persist through a transition**. A ring is drawn at the
pressed point's screen position (through the camera and the adjustment layer's zoom), so it stays glued to the item.
(An earlier version put the ring under the components, then inside the card; both were wrong: the ring is a layer of
its own, under the pointer.)

## 5. The pointer

A component declares what the pointer may do (`targets`): the `items` the narration walks through, the
`focus` it presses, a `focusCell` it emphasises, a `tail`, and the `press` (item and stage) that picks the
click-ring colours (white and/or blue, see TRANSITION_FX.md section 5). Elements carry `data-hit`
(`row`, `table`, `pill`, `tile`, `chip`) so the same selectors serve the pointer, the camera and the rings.
The hover (open hand) and the press (pointing hand, three 2 px rings) come from the pointer model; a
component only says *where*.

## 6. How it is enforced

`npm run lint:components` renders every registered component with its own `sample` (on both stages where it
has a tone) and checks it. It runs in `npm run lint`, on pre-commit, and (inside `npm run lint`) pre-push.

| rule | requirement |
|---|---|
| C1 contract | `validate()`: id, summary, semantics (use / avoid / tone / needs), sample, html / steps / targets |
| C2 documented | its id is in this file (as `` `id` ``) and in `src/components/README.md` |
| C3 anatomy order | card, then tile, then icon, then text; table rows rise in order and their cells after them |
| C4 scale only | every step starts from `scale 0`, uses a spring preset (`spr:pop / snap / soft`), writes no opacity / blur |
| C5 targets | every pointer target and step selector resolves in the markup; a focus exists |
| C6 extrusion | extruded components have `x3d` hosts with >= 4 slices, no `overflow:hidden`, solid faces |
| C7 solid | no hollow pill or chip |
| C8 determinism | no `Math.random`, `Date.now`, timers, fetch |
| C9 one source | scenes build tables through the component, with no second copy of the markup |
| C10 restrained depth | every extruded role is between `MIN_DEPTH` and its `DEPTH`; no lean / prism slabs |
| C11 generated | in the **built films and the lab**, every `.sat`, `.tbl` and `.trow` is an `x3d` slab with slices and no `overflow:hidden` |
| C12 no decoration | satellites have a tile, a heroicon and a real name (never numerals); the lab carries no numbered chips |
| C13 one layout | satellite positions come from `components/layout.mjs` (the films and the lab) |
| C16 flat at rest | an inner element that lifts while rising settles back to `z = 0`: no hard shadow at rest, only on activation and during a transition |
| C17 derived lip | every page with slabs runs the OKLCH runtime (`__lip.apply`); no slice carries a colour; the lip is derived from the element's computed colour |
| C15 owned slabs | every slab host is `position:relative` (the containing block of its own slices), no unresolved `--slab:` marker, no static host: the extrusion belongs to the element, never to a layer behind it |
| C14 real cutouts | an ear cutout points at a real file in `assets/ears` (and its mirror); at most one per beat |

## 7. The components

### `card`
The surface everything stands on: `cardFor(tone, maxW, r)` is the only place the **card inversion** is
decided (white on the blue stage, brand blue on the white stage), with the outer black stroke, an inner ring
and the hard drop. Also `glass`, `frost`, `surface`, `blueCard`, `surfaceOnWhite`, `pill` (style),
`numChip`, `apiChip`. Moved out of `scenes.mjs`, which re-exports them.

### `tile`
The icon tile. Solid blue with a white glyph on a white card; inverted to white with a blue glyph on a blue
card. Tile first, glyph last.

### `pill`
A solid padded pill with a tile and a label: the pointer's press target. Extruded.

### `chip`
A numbered chip, or the API-name chip that names a Twenty object next to its title.

### `table`
See section 3.

### `cutout`
A **die-cut sticker** in the depth set: the brand's own ear cutouts (`assets/ears/ear1..8.webp`, from the hackathon
app's landing page, see `assets/ears/PROVENANCE.md`). One stands in each beat, in a back slot, chosen by what the beat is
about (`earFor(kind)`: the hook gets the surprised listener, a table the halftone ear, a count the bird, and so on), so
the space around the main component carries brand and meaning. It keeps its own white die-cut edge, gets the system's
black outer stroke (four zero-blur drop-shadows) and a light extrusion (black silhouette copies of the same image),
and enters by a spring while its rotation settles. It is also a `.sat`, so the director animates it with the rest of
the depth set; like every satellite it is never pressed.

### `satellite`
A member of the main component's **family**, standing around it: a card with a tile, a heroicon and a real name
(a related object, or one of the object's other fields), extruded. It is background and foreground for the main
component to rise out of, so it is **never pressed** by the pointer. *Where* it stands is not the scene's choice:
`components/layout.mjs` (`SLOTS`, `slotsFor`) is the one placement system, used by the films (`lksatellites.mjs`)
and by every lab, so the arrangement around a component is always the same. Nothing decorative goes in the
family: no numerals, no stray chips, no subtitle text (M9).

## 8. The sample

`npm run lab:components` builds `compositions/components-lab.html` (9 s) and `npm run render` renders it: the table
rising row by row with its family around it (five satellites at the shared layout slots), all extruded and
orbited by the camera, with the pointer (arrow, open hand on hover, pointing hand on press, three 2 px rings) aimed at targets
*measured* from the laid-out components (`offsetLeft` / `offsetTop`), never typed coordinates. Every
component in it is built through `src/components/`, the same call a film scene makes.

## 9. Adding one

Copy `components/table/`, register it in `components/index.mjs`, describe it here (a `### \`id\`` heading)
and in the README table, then `npm run lint:components` and `npm run lab:components`. It cannot be committed
until it obeys section 6.
