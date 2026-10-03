/**
 * push - a slow push in on the element that matters.
 *
 * The one move that closes in. It starts from the camera's current framing and eases toward the element over a second or
 * more, with a hair of overshoot as the mass lands (the camera spring). It is rationed: at most one per ~6 s of beat,
 * only on a focus (a click), and only after the element's own entrance has peaked (the peak rule), so it always has
 * something steady to arrive at. Too many of these is what flattened the earlier cut: every zoom is a claim that THIS is
 * the important thing, and they cannot all be.
 */

export default {
  id: "push",
  summary: "A slow push in on the focus element, landing with a hair of overshoot.",
  semantics: {
    kind: "push",
    zoom: "close",
    breathing: false,
    use: "On the one thing the narration is about right now: the focus click. At most one per ~6 s of beat.",
    avoid: "On every stop (that is what we are moving away from); on an element that has not finished arriving; twice in a row.",
    pairs: "after breathe or follow; before pull or pan",
  },
  params: { zoom: 1.75, from: 1.04 },

  pose: (t, shot, ctx, H) => {
    const k = shot.params || {}, from = k.from ?? 1.04, to = k.zoom ?? 1.75, d = Math.max(0.2, shot.t1 - shot.t0);
    // the camera spring, stretched over the shot: mass, a hair of overshoot, settle
    const u = Math.min(1.12, H.S((t - shot.t0) * (1.6 / d) * 0.9, 0.9, 0.72));
    const T = ctx.target(shot);
    return { P: { x: T.x * Math.min(1, u), y: T.y * Math.min(1, u), z: T.z * Math.min(1, u) }, zoom: from + (to - from) * u, rx: (shot.side || 1) * -2.5 * Math.min(1, u), ry: (shot.side || 1) * 6 * Math.min(1, u) };
  },

  film: (shot, ctx) => ({ mode: "in", fit: true, zoom: 1.85, rx: ctx.side * -3, ry: ctx.side * 7, dur: 1.4, ease: "smooth", creep: 55 }),
};
