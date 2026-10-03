# rings

**Lives in:** `src/lkfx.mjs`, `src/build-demo.mjs`, `src/build-components-lab.mjs`

## What it is

The rings are the **click**: three concentric 8-bit pixel rings radiating from the press. They are drawn on **their own
full-screen canvas** (`#rings`, z 90), directly under the pointer and above every element, outside both compositions and
outside the adjustment layer.

## When it comes to the composition

A click lands, the hand presses, and the rings radiate from that point. Because the rings are their own layer, they
**persist through a transition**: a click just before a cut finishes its rings over the incoming scene, and a wipe or a
flash never clips or covers them, exactly like the pointer. (Two earlier placements were wrong: under the components,
which hid them behind cards, and inside the card, which tied them to one component. They are a layer of their own.)

## How it works

Each ring is **three pixel bands on one global grid** of `cell` px (default 4, range 3 to 8):

| band | colour | width |
| --- | --- | --- |
| core | white, the inner colour, the same on every item | 1 cell |
| stroke | the brand blue | 1 cell each side |
| outline | the system's black | 1 cell each side |

So a ring never vanishes into the background: on blue the white and black carry it, on white the blue and black do.
Layers are drawn across **all** rings (every outline, then every stroke, then every core), so a ring crossing another
never cuts into its core. Radius grows to 150 px times the perspective scale, 0.1 s between rings, 0.62 s each, and each
ring **unwinds** (its arc shortens to nothing) as it grows: it leaves by scale, never by alpha.

The ring is drawn at the pressed point's **screen** position: the world point is projected through the camera, then
through the adjustment layer's zoom, so it stays glued to the row as the frame moves.

## How it composes

| relation | what |
| --- | --- |
| below | the composite and the adjustment layer |
| above | the pointer is directly over it (z 95) |
| driven by | the pointer model's click event (`e.click`), shared with the camera's punch |
| colours | `ringColors()` returns a fixed `{ core, stroke, outline }`; it does not adapt to the item |

## Rules and gates

| rule | enforced by |
| --- | --- |
| three layers: composite < rings < pointer; rings outside both groups and `#adj` | `lint:transitions` T5, `test:fx` |
| pixels on one grid, three bands, no alpha, deterministic, gone by their end | `test:fx` (rings) |
| rings and pointer are the only things above the composite | `lint:transitions` T4 |

## Related

[layers/pointer](./pointer.md), [pointer/click](../pointer/click.md), [layers/adjustment-layer](./adjustment-layer.md),
[TRANSITION_FX.md](../TRANSITION_FX.md).
