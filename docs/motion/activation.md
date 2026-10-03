# activation

**Lives in:** `src/components/anatomy.mjs`, `src/lkspring.mjs`

## What it is

An element inside a card is **flat at rest** and lifts toward the camera only while it is **activated**: hovered, pressed or focused. Activation is a pure function of time, one spring per change.

## When it comes to the composition

The row under the hand lifts to its slab's depth so its lip shows, and settles back flat when the hand leaves. Rest carries no hard shadow, so a table of rows does not read as a table of buttons.

## How it works

`__cmp.activate` gives each row one value `a(t) = track(t, keys)`: a `snap` spring up when the hand arrives, a `settle` spring back to 0 when it leaves. `z = lift * max(0, a)` and `scale = 1 + grow * a`.

**The bug this came from.** Moving the pointer from one row to the next made the row it left vanish. Release was an overshooting spring, which dipped to **-0.38 px**, *behind the card's opaque face*, so the row was hidden for about 0.2 s. And lift and release were separate tweens on the same `z`, whose start values GSAP captures lazily, so overlapping hovers depended on which tweens had already rendered, which differs across the render's parallel workers. The fixes are the three rules below.

## How it composes

Activation sits above the entrance: it may only start after a row has risen and settled (they write the same properties).

## Rules and gates

| rule | enforced by |
| --- | --- |
| a return to a surface never overshoots: use `settle` | `lint:design` `no-plane-dip`, `lint:components` C16 |
| activation is one pure function of time; the lift is clamped at 0 | `test:spring` (activation) |
| activation starts after the entrance has finished | `build-demo` and the lab (throw) |
| a lifted row settles back flat at rest | `lint:components` C16 |

## Related

[motion/spring](./spring.md), [extrusion/lip](../extrusion/lip.md), [ANIMATION.md](../ANIMATION.md) (section 5a)
