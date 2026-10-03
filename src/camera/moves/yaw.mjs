/**
 * yaw - the camera swings around the composition: a slow sweep that shows the depth.
 *
 * No target and no push: the camera stays wide and pivots a dozen degrees one way to the other while it drifts, so the
 * depth set and the extruded elements show their sides and the parallax does the work. It is the move for a beat that is
 * about the SHAPE of a thing (a relationship, a set) rather than one element of it.
 */

export default {
  id: "yaw",
  summary: "A slow wide sweep around the composition so the depth and the sides of things show.",
  semantics: {
    kind: "yaw",
    zoom: "none",
    breathing: true,
    use: "A beat about a set or a relationship: nothing singled out, so the camera shows the arrangement from two sides.",
    avoid: "Over a single focus element (push or follow it instead) and for less than ~2 s (it does not complete its sweep).",
    pairs: "opens or closes a beat; before follow",
  },
  params: { yaw: 13, zoom: 1.06 },

  pose: (t, shot, ctx, H) => {
    const k = shot.params || {}, d = Math.max(0.5, shot.t1 - shot.t0), u = H.smoother(Math.min(1, Math.max(0, (t - shot.t0) / d)));
    const a = k.yaw ?? 13, dir = shot.side || 1;
    return { P: { x: -dir * 60 * (1 - 2 * u), y: 14 * Math.sin(Math.PI * u), z: 0 }, zoom: k.zoom ?? 1.06, rx: 2.5 * Math.sin(Math.PI * u), ry: dir * a * (2 * u - 1) };
  },

  film: (shot, ctx) => ({ mode: "wide", fit: false, zoom: 1.07, rx: 2, ry: ctx.side * 13, dur: 1.8, ease: "wide", creep: 0 }),
};
