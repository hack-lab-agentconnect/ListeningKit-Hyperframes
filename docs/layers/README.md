# layers

What is above what. A film frame is a small stack of layers, and each layer has one job. Getting the order wrong was the
source of several bugs (rings painted over cards, an extrusion attached to the wrong layer, a wipe clipping the cursor),
so the order is a contract, checked by `npm run test:fx` and `npm run lint:transitions`.

## The stack, bottom to top

```text
 z 95   POINTER            the one cursor; above everything, through every transition      docs/layers/pointer.md
 z 90   RINGS              the click's pixel rings; its own full-screen canvas              docs/layers/rings.md
 ─────  outside the adjustment layer: nothing a transition does can clip or cover the two above
 z 10   ADJUSTMENT LAYER   one wrapper over the whole composite; owns zoom and recoil       docs/layers/adjustment-layer.md
   │      z 85  FLASH      (scale-swap) the exposure overlay                                docs/layers/flash.md
   │      z 60  MASK EDGES (pixel-wipe) the wipe front's outlines
   │      z 20  group B    the incoming composition (stage, dither, components)             docs/layers/composite.md
   │      z 10  group A    the outgoing composition
   └─ stage  ›  dither  ›  the composition's own components (3D world: cards, rows, satellites, ears)
```

## Why this order

- **The pointer is the thread the viewer follows.** If a transition could cover it, the eye would lose its anchor at
  exactly the moment the scene changes. So it is the topmost layer and a transition never touches it.
- **The rings are the click, and the click must persist.** A click that lands just before a cut still has to finish. The
  rings are therefore not part of either composition and not inside the adjustment layer: they are drawn on their own
  canvas, at the pressed point's screen position, directly under the pointer.
- **The adjustment layer is how an effect reaches everything at once.** The speed-ramp rush and the post-flash recoil
  are a single scale on one wrapper, so both compositions, the mask and the flash move together and no composition has to
  know about it.

## Pages

| page | one line |
| --- | --- |
| [composite](./composite.md) | the picture: stage, dither and the components, per composition |
| [adjustment-layer](./adjustment-layer.md) | the one wrapper that carries the effects over everything beneath |
| [rings](./rings.md) | the click's pixel rings, on their own layer |
| [pointer](./pointer.md) | the cursor layer, on top |
| [flash](./flash.md) | the exposure overlay a swap uses |

## Related

[TRANSITION_FX.md](../TRANSITION_FX.md) (layer order and the speed ramp), [COMPONENTS.md](../COMPONENTS.md) (the three
layers section), [naming-conventions.md](../naming-conventions.md).
