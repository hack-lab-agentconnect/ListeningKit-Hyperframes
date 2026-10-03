/**
 * cutpush - CUT to the element, then push.
 *
 * On the click, the camera does not travel: it CUTS (a hard, instant reframe) to the active element, then settles into a
 * push. The click is the cut point: it is the shared beat of video editing and motion design, and here the click and the
 * camera agree about it. A cut gives the beat an edit inside it, which a continuous follow never can.
 *
 * It is the strongest move in the set, so it is rationed harder than push: at most one per beat, only on the focus click,
 * and it is followed by a pull so the beat does not stay close.
 */

export default {
  id: "cutpush",
  summary: "On the click, cut to the active element and push in from there.",
  semantics: {
    kind: "cut",
    zoom: "close",
    breathing: false,
    use: "On the focus click of a beat, to put an edit inside the beat: the click is the cut point.",
    avoid: "More than once per beat; on a hover (the cut belongs to a click); without a pull after it.",
    pairs: "after breathe / follow; before pull",
  },
  params: { cut: 1.35, zoom: 1.7 },

  pose: (t, shot, ctx, H) => {
    const k = shot.params || {}, d = Math.max(0.3, shot.t1 - shot.t0), u = H.smoother(Math.min(1, Math.max(0, (t - shot.t0) / d)));
    const T = ctx.target(shot), c = k.cut ?? 1.35, z = k.zoom ?? 1.7;
    return { P: T, zoom: c + (z - c) * u, rx: (shot.side || 1) * -2 * (0.4 + 0.6 * u), ry: (shot.side || 1) * 5 * (0.4 + 0.6 * u) };
  },

  film: (shot, ctx) => ({ mode: "in", fit: true, zoom: 1.95, rx: ctx.side * -2, ry: ctx.side * 6, dur: 0.14, ease: "cut", creep: 80 }),
};
