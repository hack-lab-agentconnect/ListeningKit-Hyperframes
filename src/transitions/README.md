# transitions/

Cuts between two compositions, called by name. A transition is a small module with a fixed contract, so a
storyboard can say `xf: "pixel-wipe"` without knowing how it is built, and a new one can be added without
touching the films.

| id | kind | J-cut | what it is |
|---|---|---|---|
| `pixel-wipe` | wipe | **yes** | the incoming composition is revealed *through* a sweep of pixel windows (a mask, not an overlay) |
| `scale-swap` | swap | no | the outgoing composition scales to nothing, the incoming scales up from nothing |

`npm run lab:transition [id]` builds a 10-second demo (two compositions joined by that transition);
`npm run render` renders it.

## The order things happen

Every transition lists its **phases, in order, relative to the seam** (the moment the next composition
starts). The order is part of the contract (`semantics.order` must equal the phases, and `npm run test:fx`
checks it), because the order is what makes a transition read as one move:

```
pixel-wipe   ramp-out  >  flash  >  sweep  >  ramp-in
scale-swap   ramp-out  >  scale-out  >  flash  >  scale-in  >  ramp-in
```

- **ramp-out / ramp-in** - the speed ramp, shared by all transitions (`common.mjs RAMP`): the clock runs at up
  to 3.2x into the seam and back to 1x out of it (`tau`), **and the camera rushes at the scene** (+0.8 zoom,
  ease-in, then ease-out): the transition itself is the speed ramp, not just the clock.
- **flash** - the gunshot: a hard 3-frame attack to 0.5, a fast tail, gone by 0.5 s.
- **sweep / scale-out / scale-in** - the transition's own motion.

## The contract (`index.mjs validate`)

```js
export default {
  id, summary,
  semantics: { kind: "wipe" | "swap", jcut: boolean, use, avoid, pairs, needs: [...], order },
  params: { ramp: { out, in, peak, rush }, flash: { ... }, ...its own },
  phases(params)         // [{ id, from, to }] in order, relative to the seam
  timing(params, seam)   // { bStart, aEnd, complete }: when B must mount, A must stay, and it is done
  parent(ctx)            // { css, html, groupAStyle, groupBStyle, setupJS, frameJS }
}
```

`semantics` is what lets a build choose sensibly: `use` says what it is for, `avoid` what it is not, `jcut`
whether the two compositions overlap (`timing.bStart < timing.aEnd`), `needs` what the host must provide.

`parent(ctx)` is what the **parent composition** needs to run it. The parent holds two *groups* (`gA`, `gB`:
each a stage colour, a dither and one mounted composition) and, above them, the layers every transition
shares in a fixed order: **flash < click rings < pointer**. The pointer is last and topmost, so no
transition can hide it.

- `groupBStyle` - e.g. `clip-path:url(#pxclip)` for the pixel wipe: composition B is shown only through the
  windows.
- `setupJS` - runs once. `frameJS` - runs every frame with `t` (real seconds), `SEAM`, `gA`, `gB` and
  `flashEl` in scope.

## Rules a transition must keep

1. **Nothing fades.** Scale, mask, translate: never opacity (M13). The flash is the one light overlay.
2. **Never cover the frame.** If it reveals, it reveals *through* something; the old scene stays visible
   wherever the new one has not arrived.
3. **The pointer is above it** (it lives on the parent, above all transition layers).
4. **Pure functions of time.** No `Math.random`, no state; seeded where it needs variety.
5. **Declare `use` and `avoid`.** A transition that cannot say when not to use it is not finished.

## Adding one

1. `src/transitions/<id>.mjs` with the contract above; compose `common.mjs` for the ramp, flash and z-order.
2. Register it in `index.mjs`.
3. `npm run test:fx` - the contract is validated for every registered transition.
4. `npm run lab:transition <id>` and read frames across the seam.
