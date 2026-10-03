# spring

**Lives in:** `src/lkspring.mjs`, `scripts/test-spring.mjs`

## What it is

Motion with **mass**: every entrance, exit, emphasis and the camera's zoom is a closed-form damped spring, a pure function of time. Cheap motion eases A to B on a fixed curve; expensive motion accelerates, overshoots a hair and settles.

## When it comes to the composition

Every element enters by `scale 0 -> 1` on a spring and leaves by the time-reversed spring. A fixed-curve `back.out` ease appears nowhere in the repo (94 call sites were migrated, and a lint keeps it that way).

## How it works

`S(t, f, z)` is the step response of a spring with frequency `f` Hz and damping ratio `z`. The presets:

| preset | f | z | overshoot | for |
| --- | --- | --- | --- | --- |
| `pop` | 3.0 | 0.62 | 8.4 % | the default entrance |
| `snap` | 3.6 | 0.50 | 16.3 % | a tile or icon: small and quick |
| `soft` | 2.6 | 0.72 | 3.8 % | a panel or note: heavier |
| `row` | 2.8 | 0.78 | 2.0 % | a table row: must not poke past its card |
| `settle` | 3.2 | 1.00 | 0 % | a **return to a surface**: never undershoots |
| `cam` | 0.9 | 0.72 | 3.8 % | the camera's zoom |

`ease(name)` plays the whole spring across a tween; `easeIn(name)` is its reverse for exits (`__spr.popIn`). `track(t, keys)`
is the key technique: **one spring per change**, each starting at its own time and summed, so a value that is re-aimed
stays continuous in value and velocity and never restarts. `pulse` rises to 1 and decays (the click's punch).

## How it composes

Springs are the shared vocabulary of the other domains: components enter on them, the camera's zoom and the activation lift are `track`s, and the peak rule schedules around their overshoot peak.

## Rules and gates

| rule | enforced by |
| --- | --- |
| starts at 0, settles on 1, overshoot and peak time match the closed form | `test:spring` |
| `track` is continuous in value and velocity and a pure function (any seek order) | `test:spring` |
| no `back.*` ease anywhere in `src/` | `lint:design` `no-cheap-ease` |
| a component entrance is a spring preset | `lint:components` C4 |

## Related

[motion/peak-rule](./peak-rule.md), [motion/activation](./activation.md), [ANIMATION.md](../ANIMATION.md)
