/**
 * follow - the camera trails the pointer, loosely, at its resting zoom.
 *
 * The default way to stay with the cursor: a slow heavy lag behind it (the pointer model's camera), leaning toward where
 * it is without zooming in. It is the connective tissue between the moves that DO something; it is gentle, so there can
 * be plenty of it. (Following with a push on every stop was the problem: too many zooms and the picture lost its
 * hierarchy. Following is not zooming.)
 *
 * A move's `pose` returns an INTENT { P, zoom, rx, ry }: the world point to frame, how close, and the tilt. The director
 * blends intents between moves and turns the result into a camera pose once. `pose` must be a self-contained arrow
 * function: it is serialised into the page.
 */

export default {
  id: "follow",
  summary: "Trail the pointer loosely at the resting zoom: a lean, not a push.",
  semantics: {
    kind: "follow",
    zoom: "gentle",
    breathing: false,
    use: "Between moments, while the pointer travels from one thing to the next: the camera stays with it without announcing anything.",
    avoid: "As the only move of a beat (it never gives the eye a rest) and as a stand-in for a push (it does not close in).",
    pairs: "after breathe, before push / pan / cutpush; never twice in a row",
  },
  params: { zoom: 1.12 },

  /** the pointer model's own lagged camera, minus any zoom push: ctx.follow(t) -> { aim, zoom, rotationX, rotationY } */
  pose: (t, shot, ctx) => {
    const c = ctx.follow(t);
    return { P: c.aim, zoom: c.zoom, rx: c.rotationX, ry: c.rotationY };
  },

  /** the film runtime's shot: a soft lean toward the stop, no fit-to-element zoom */
  film: (shot, ctx) => ({ mode: "in", fit: false, zoom: 1.12, rx: ctx.side * 2, ry: ctx.side * 5, dur: 1.0, ease: "smooth", creep: 18 }),
};
