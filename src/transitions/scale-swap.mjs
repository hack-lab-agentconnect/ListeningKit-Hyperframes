/**
 * scale-swap - the outgoing composition scales away to nothing, the incoming scales up from nothing.
 *
 * The films' current cut (DESIGN_SYSTEM 4, M6), expressed at composition level: nothing fades.
 * The outgoing group scales 1 -> 0 on a `back.in`, the incoming group 0 -> 1 on a `back.out`, so for a
 * moment the stage is empty between them, and the gunshot flash hides the stage-colour change.
 * It is NOT a J-cut: the incoming composition is mounted when the outgoing one has gone.
 *
 * Use it where a wipe would be too loud, or where there is a continuous object to hand over (the
 * pointer, which lives on its own layer above both).
 */

import { RAMP, Z, flashPart, flashFrameJS, FLASH } from "./common.mjs";

export default {
  id: "scale-swap",
  summary: "The current scene scales to nothing; the next scales up from nothing, overshooting.",

  semantics: {
    kind: "swap",
    jcut: false,
    direction: "from the centre",
    use: "Between two scenes of similar weight, or wherever a wipe would be louder than the change: record to record, a list to its detail.",
    avoid: "When the two scenes need to be seen together at once (a wipe, which overlaps them, is the tool for that).",
    pairs: "any",
    needs: ["groups", "warp", "pointer-layer"],
    order: "ramp-out > scale-out > flash > scale-in > ramp-in",
  },

  params: {
    ramp: { ...RAMP },
    flash: { ...FLASH },
    out: 0.34, // the outgoing scale-out finishes at the seam
    in: 0.55, // the incoming scale-in starts at the seam
  },

  phases(p) {
    return [
      { id: "ramp-out", from: -p.ramp.out, to: 0 },
      { id: "scale-out", from: -p.out, to: 0 },
      { id: "flash", from: 0, to: p.flash.duration },
      { id: "scale-in", from: 0, to: p.in },
      { id: "ramp-in", from: 0, to: p.ramp.in },
    ];
  },

  timing(p, seam) {
    return { bStart: seam, aEnd: +(seam + 0.02).toFixed(3), complete: +(seam + p.in).toFixed(3) };
  },

  parent(ctx) {
    const p = ctx.params || this.params;
    const flash = flashPart();
    return {
      css: flash.css,
      html: flash.html,
      groupAStyle: "",
      groupBStyle: "transform:scale(0)",
      setupJS: `
      const FLASH = ${JSON.stringify(p.flash)};
      const SO = ${p.out}, SI = ${p.in};
      const backIn = (u) => { u = Math.max(0, Math.min(1, u)); const c1 = 1.7, c3 = c1 + 1; return c3 * u * u * u - c1 * u * u; };
      const backOut = (u) => { u = Math.max(0, Math.min(1, u)); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
      gsap.set([gA, gB], { transformOrigin: "50% 50%" });`,
      frameJS: `${flashFrameJS}
          // each composition leaves / arrives by SCALE, never opacity
          gsap.set(gA, { scale: t < SEAM - SO ? 1 : Math.max(0, 1 - backIn((t - (SEAM - SO)) / SO)) });
          gsap.set(gB, { scale: t < SEAM ? 0 : backOut((t - SEAM) / SI) });`,
    };
  },
};
