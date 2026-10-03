/**
 * pan - a slow lateral slide from one element to the next, with a swing of yaw.
 *
 * The composition changes by the camera MOVING ACROSS it rather than zooming into it: the frame slides from where it was
 * to the next thing, the yaw swings against the direction of travel (a parallax that makes the depth set read), and the
 * zoom stays gentle. It is how a beat with several things to say can walk from one to the next without another push.
 */

export default {
  id: "pan",
  summary: "Slide across the composition to the next element, yaw swinging against the travel.",
  semantics: {
    kind: "pan",
    zoom: "gentle",
    breathing: false,
    use: "Between two focus points in one beat: the camera travels from the first to the next instead of pushing at each.",
    avoid: "With nothing to travel to (use yaw), and right after a cut (a pan needs a settled starting frame).",
    pairs: "after push / follow; before pull / breathe",
  },
  params: { zoom: 1.16, yaw: 10 },

  pose: (t, shot, ctx, H) => {
    const k = shot.params || {}, d = Math.max(0.3, shot.t1 - shot.t0), u = H.smoother(Math.min(1, Math.max(0, (t - shot.t0) / d)));
    const A = ctx.target({ target: shot.from }), B = ctx.target({ target: shot.to });
    const dir = B.x >= A.x ? 1 : -1;
    return {
      P: { x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u, z: A.z + (B.z - A.z) * u },
      zoom: k.zoom ?? 1.16,
      rx: 0,
      ry: -dir * (k.yaw ?? 10) * Math.sin(Math.PI * u), // swings against the travel and comes back as it arrives
    };
  },

  film: (shot, ctx) => ({ mode: "in", fit: false, zoom: 1.16, rx: 0, ry: ctx.side * 11, dur: 1.5, ease: "wide", creep: 0 }),
};
