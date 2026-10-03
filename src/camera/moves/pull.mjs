/**
 * pull - a slow pull back out to the wide frame.
 *
 * The release after a push or a cut-push: the camera lets go of the element and the whole composition comes back into
 * view, so the next beat starts from a frame the viewer can read. It is slow on purpose (the push was a decision, the
 * pull is a breath out) and it lands on `breathe`.
 */

export default {
  id: "pull",
  summary: "Release a push: the camera eases back out to the wide frame.",
  semantics: {
    kind: "pull",
    zoom: "none",
    breathing: true,
    use: "Right after a push or a cut-push, once the focus has done its job; also to open a beat that arrived zoomed.",
    avoid: "Without a push before it (there is nothing to release); faster than ~0.9 s (it reads as a snap).",
    pairs: "after push / cutpush; before breathe",
  },
  params: { zoom: 1.0 },

  pose: (t, shot, ctx, H) => {
    const k = shot.params || {}, from = shot.fromZoom ?? 1.6, to = k.zoom ?? 1.0, d = Math.max(0.2, shot.t1 - shot.t0);
    const u = H.smoother(Math.min(1, Math.max(0, (t - shot.t0) / d)));
    const T = ctx.target(shot);
    return { P: { x: T.x * (1 - u), y: T.y * (1 - u), z: T.z * (1 - u) }, zoom: from + (to - from) * u, rx: (shot.side || 1) * -1.5 * (1 - u), ry: (shot.side || 1) * 4 * (1 - u) };
  },

  film: (shot, ctx) => ({ mode: "out", fit: false, zoom: 0.96, rx: 0, ry: ctx.side * 3, dur: 1.2, ease: "wide", creep: 0 }),
};
