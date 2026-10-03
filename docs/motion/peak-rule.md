# peak-rule

**Lives in:** `src/lkspring.mjs`, `src/lkdirector.mjs`, `src/lkdemo.mjs`

## What it is

The pointer is on screen all the time; the elements are not. So the hand and the camera never aim at an element until its entrance **mass is at the peak of its overshoot**, and only then tween in close.

## When it comes to the composition

Before the peak the element is still rising and there is nothing steady to look at. Aiming at it earlier makes the camera chase a moving target. The rule applies to every press and every camera push.

## How it works

`peakTime(f, z) = pi / (w * sqrt(1 - z^2))` is when a spring first reaches its overshoot peak; `peakDelay(preset, dur)` is that moment inside a tween of length `dur` (0.224 s for a 0.5 s `pop`).
The director computes `peakOfItem(slots, i)` for every item it retimes, pushes each press to `peak + HAND (0.26 s) + 0.04`,
and starts each camera push no earlier than the peak. In the demo, `rowPeakReal` does the same through the speed-ramped clock and a build-time assertion throws if a hand would land early.

## How it composes

It is the bridge between motion and the camera/pointer: the spring says when the element is steady, the director schedules the hand and the push after it.

## Rules and gates

| rule | enforced by |
| --- | --- |
| the hand lands on an item only after its overshoot peak | `lint:pacing` M14 |
| the camera pushes only after the peak | `lint:pacing` M14 |
| the demo asserts it at build | `build-demo` (throws) |
| `peakDelay` equals the ease's measured peak | `test:spring` |

## Related

[motion/spring](./spring.md), [camera/director](../camera/director.md), [MOTION_CRITERIA.md](../MOTION_CRITERIA.md)
