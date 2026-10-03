/**
 * pixel-wipe - the incoming composition is revealed THROUGH a sweep of pixel windows.
 *
 * It is a MASK, not an overlay. The incoming composition's group is clipped by an SVG clipPath made
 * of one square per grid cell; the cells scale 0 -> 1 as the sweep reaches them, and wherever a cell
 * has grown, the incoming composition shows through it while the outgoing one stays everywhere
 * else. The only thing painted over a scene is a 2 px outline on the cells that are still growing.
 * Nothing covers the frame.
 *
 * It is a J-CUT: the incoming composition is mounted at the seam, while the outgoing one is still
 * live and visible, and is already playing (its own entrances running) behind the first windows.
 *
 * The transition ITSELF is the speed ramp: the clock accelerates into the cut (tau), the camera
 * rushes at the scene (rush) and the sweep's edge accelerates (accel < 1), while a gunshot flash
 * lands ON the sweep front (young cells are solid white for a few frames), never as a full-frame overlay.
 */

import { fxModule } from "../lkfx.mjs";
import { C } from "../lkdesign.mjs";
import { RAMP, Z, FLASH } from "./common.mjs";

const FX = fxModule();

export default {
  id: "pixel-wipe",
  summary: "A sweep of pixel windows reveals the next composition through the current one.",

  semantics: {
    kind: "wipe",
    jcut: true,
    direction: "left-to-right (a param: right | left | down | up)",
    use: "Between two scenes that are DIFFERENT in kind (a table to a pain point, a hook to a definition): the sweep is the change of subject, and the pixel edge reads as a hard cut with texture.",
    avoid: "Between two near-identical scenes (record to record): the sweep would be louder than the change. Never as the last cut before the end card.",
    pairs: "any",
    needs: ["groups", "warp", "pointer-layer"],
    order: "ramp-out > flash > sweep > ramp-in",
  },

  params: {
    ramp: { ...RAMP },
    flash: { ...FLASH },
    wipe: {
      cell: 120, sweep: 0.5, pop: 0.2, jitter: 0.06, dir: "right", seed: 41, accel: 0.7, flashU: 0.55,
      edgeWidth: 2, edgeColor: "#FFFFFF",
    },
  },

  /** The phases, in order, in seconds relative to the seam. */
  phases(p) {
    const D = FX.wipeDuration(p.wipe);
    return [
      { id: "ramp-out", from: -p.ramp.out, to: 0 },
      { id: "flash", from: 0, to: p.flash.duration },
      { id: "sweep", from: 0, to: D },
      { id: "ramp-in", from: 0, to: p.ramp.in },
    ];
  },

  /** When each composition must be mounted: B from the seam (J-cut), A until the sweep has finished. */
  timing(p, seam) {
    const D = FX.wipeDuration(p.wipe);
    return { bStart: seam, aEnd: +(seam + D + 0.06).toFixed(3), complete: +(seam + D).toFixed(3) };
  },

  /**
   * What the parent composition needs. `groupBStyle` clips composition B; `setupJS` runs once;
   * `frameJS` runs every frame with `t` (real seconds) and the page's SEAM / gA / gB / flashEl in scope.
   */
  parent(ctx) {
    const p = ctx.params || this.params;
    const W = ctx.W || 1920, H = ctx.H || 1080;
    const wipe = { ...p.wipe, W, H };
    const cols = Math.ceil(W / wipe.cell), rows = Math.ceil(H / wipe.cell);
    const rects = Array.from({ length: cols * rows }, () => '<rect x="0" y="0" width="0" height="0"/>').join("");
    return {
      css: `.pxedge{position:absolute;left:0;top:0;width:${W}px;height:${H}px;z-index:${Z.edges};pointer-events:none}`,
      html: `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><clipPath id="pxclip" clipPathUnits="userSpaceOnUse">${rects}</clipPath></defs></svg>
      <canvas class="pxedge" id="pxedge" width="${W}" height="${H}" data-layout-allow-overlap></canvas>`,
      groupAStyle: "",
      groupBStyle: "clip-path:url(#pxclip)",
      setupJS: `
      const WIPE = ${JSON.stringify(wipe)};
      const FLASH = ${JSON.stringify(p.flash)};
      const WIPE_LEN = __fx2.wipeDuration(WIPE);
      const clipRects = Array.from(document.querySelectorAll("#pxclip rect"));
      const edge = document.getElementById("pxedge"), ectx = edge.getContext("2d");
      let clipFree = false;`,
      frameJS: `
          // the sweep: each cell is a WINDOW onto composition B. B's group is clipped to the grown cells.
          const age = t - SEAM;
          ectx.clearRect(0, 0, ${W}, ${H});
          if (age >= WIPE_LEN + 0.02) {
            if (!clipFree) { gB.style.clipPath = "none"; clipFree = true; }
          } else {
            if (clipFree) { gB.style.clipPath = "url(#pxclip)"; clipFree = false; }
            const cells = __fx2.wipeCells(age, WIPE);
            for (let i = 0; i < clipRects.length; i++) { clipRects[i].setAttribute("width", 0); clipRects[i].setAttribute("height", 0); }
            const cols = ${cols};
            for (const c of cells) {
              const idx = c.j * cols + c.i, r = clipRects[idx];
              r.setAttribute("x", c.cx - c.s / 2); r.setAttribute("y", c.cy - c.s / 2);
              r.setAttribute("width", c.s); r.setAttribute("height", c.s);
            }
            __fx2.drawWipeEdges(ectx, cells, WIPE);
          }`,
    };
  },
};
