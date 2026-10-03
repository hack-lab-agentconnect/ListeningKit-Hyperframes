/**
 * breathe - a wide, slow, almost-still frame: the camera's resting breath.
 *
 * Nothing is being pushed at. The camera drifts a few pixels, tilts a degree or two and swells by a few percent on slow,
 * unrelated periods, so the frame is alive without telling the eye where to go. This is the BREATHING ROOM the other
 * moves are cut against: a push only reads as a push after a stretch of this.
 */

export default {
  id: "breathe",
  summary: "A wide, slow drift: the frame alive without asking the eye to go anywhere.",
  semantics: {
    kind: "breathe",
    zoom: "none",
    breathing: true,
    use: "Establishing a beat, between two focused moments, and any time the narration is carrying the scene and nothing needs singling out.",
    avoid: "While the pointer is mid-travel and the viewer is following it (use follow), and for more than ~4 s without a click in it.",
    pairs: "opens most beats; before push / pan / cutpush",
  },
  params: { drift: 34, swell: 0.03, tilt: 2.2 },

  pose: (t, shot, ctx) => {
    const k = shot.params || {};
    const drift = k.drift ?? 34, swell = k.swell ?? 0.03, tilt = k.tilt ?? 2.2, ph = shot.phase || 0;
    return {
      P: { x: drift * Math.sin(0.7 * t + ph), y: drift * 0.55 * Math.sin(0.5 * t + 1 + ph), z: 0 },
      zoom: 1.0 + swell * (0.5 + 0.5 * Math.sin(0.45 * t + ph)),
      rx: tilt * 0.5 * Math.sin(0.37 * t + 2 + ph),
      ry: tilt * Math.sin(0.3 * t + ph),
    };
  },

  film: (shot, ctx) => ({ mode: "wide", fit: false, zoom: 1.03, rx: ctx.side * 1.5, ry: ctx.side * 3, dur: 1.6, ease: "wide", creep: 30 }),
};
