# click

**Lives in:** `src/lkpointer.mjs`, `src/lkfx.mjs`, `src/lkdirector.mjs`

## What it is

The click is the **shared event** of the whole system. It is the common beat in video editing and motion design, and here the pointer, the rings, the camera and the element all respond to it together.

## When it comes to the composition

A click presses the hand (the cursor shrinks to 0.84), radiates three pixel rings, adds a small zoom **punch** to the camera whatever move it is in, can be the **cut point** of a `cutpush`, and activates the pressed element (it lifts and shows its lip).

## How it works

The model emits `click` at a time; the rings draw from it, the camera director reads it (`punch` list, `cutpush` cut point), and the activation driver lifts the row from the same events, so all four are in step by construction rather than by hand-timing.

## How it composes

Hover and click differ: a hover is an open hand and a circle, a click is the press. Only a click can be a close camera move's target.

## Rules and gates

| rule | enforced by |
| --- | --- |
| a close camera move lands only on a click | `test:camera` |
| the click punches the frame and the punch decays | `test:camera` |
| rings: three pixel bands, no alpha, gone by their end | `test:fx` |

## Related

[layers/rings](../layers/rings.md), [camera/cutpush](../camera/cutpush.md), [motion/activation](../motion/activation.md)
