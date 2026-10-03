# adjustment-layer

**Lives in:** `src/build-demo.mjs`, `src/lkfx.mjs`, `src/transitions/common.mjs`

## What it is

The adjustment layer is one wrapper element (`#adj`) around the whole composite. It carries **effects that apply to
everything beneath it** and nothing else. The name comes from video editing: an adjustment layer in an editor is a layer
whose effects act on every layer below it, so you grade or scale the whole picture once instead of touching each clip.

It holds both compositions (group A and group B), the wipe's mask edges and the flash. It does **not** hold the rings or
the pointer: those sit above it, so an effect applied to the layer can never reach them.

## When it comes to the composition

A transition between two compositions is where it matters. Without it, "zoom the whole frame as the speed ramp hits"
would have to be implemented inside both compositions, kept in sync, and would still not move the mask or the flash. With
it, one number is set per frame and everything beneath moves as one picture:

```js
const zs = 1 + __fx2.kickAt(t - (SEAM + FLASH.attack)) + __fx2.rushAt(t, RUSH);
gsap.set(adj, { scale: zs });
```

- **rush** (`rushAt`): the camera rushes at the scene into the seam (+0.8 zoom, ease-in), then settles out.
- **recoil** (`kickAt`): a small kick after the flash fires, then it falls away.

The compositions themselves apply no rush of their own; `test:fx` and `lint:transitions` (T4) fail if one does.

## How it works

- `.adj{position:absolute;inset:0;z-index:10;transform-origin:50% 50%}`: it scales about the frame centre.
- Its children keep their own stacking (group A z 10, group B z 20, mask edges z 60, flash z 85), all **inside** the
  adjustment layer's stacking context. Nothing inside can rise above the rings or the pointer, however high its z-index.
- Anything that must stay **screen-locked to a world point** while the layer scales has to apply the same scale. The
  pointer and rings do this explicitly: they project the world point through the camera, then through the layer's zoom:

```js
const sx = (q) => ({ x: 960 + (q.x - 960) * zs, y: 540 + (q.y - 540) * zs, k: q.k * zs });
```

  So the cursor and the ring stay glued to the row they point at while the layer zooms under them.

## How it composes

| relation | what |
| --- | --- |
| below it | stage, dither, group A, group B, mask edges, flash, every component |
| above it | `#rings` (z 90), then the cursor (z 95) |
| beside it | the camera: the camera moves the **stage inside** each composition; the adjustment layer scales the **whole composite**. They multiply, which is why the pointer applies both. |
| hands over to | nothing; it is a wrapper, not a move |

## Rules and gates

| rule | enforced by |
| --- | --- |
| exactly one `#adj`, wrapping `#gA`, `#gB` and the mask, with the pointer outside it | `lint:transitions` T4, `test:fx` |
| the adjustment layer carries the scale | `lint:transitions` T4 |
| neither composition applies its own rush or recoil | `lint:transitions` T4, `test:fx` |
| composite < rings < pointer in z-order | `lint:transitions` T5, `test:fx` |
| nothing in it fades: the effects are scale and mask, never opacity | `lint:design` `no-fade` |

## Related

[layers/README](./README.md), [transitions/speed-ramp](../transitions/speed-ramp.md), [layers/rings](./rings.md),
[layers/pointer](./pointer.md), [TRANSITION_FX.md](../TRANSITION_FX.md).
