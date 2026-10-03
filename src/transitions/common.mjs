/**
 * Parts every transition shares: the ramp parameters, the gunshot flash layer and the z-order of the
 * layers that sit above both compositions. A transition module composes these rather than redefining
 * them, so the order is the same for all of them: the flash, then the click rings, then the pointer,
 * which is always the topmost thing (it must never be hidden by a transition).
 */

import { C } from "../lkdesign.mjs";
import { fxModule } from "../lkfx.mjs";

const FX = fxModule();

/** The default speed ramp: the clock to 3.2x, and a camera rush of +0.8 zoom, over 0.7 s either side. */
export const RAMP = { out: 0.7, in: 0.7, peak: 3.2, rush: 0.8 };

/** The layers above the two compositions, bottom to top. The pointer is always last. */
export const Z = { edges: 60, flash: 85, rings: 90, pointer: 95 };

/** The gunshot flash layer (markup + css). Opacity is driven by `__fx2.flashAt` in the frame code. */
export const flashPart = () => ({
  css: `.flash{position:absolute;inset:0;z-index:${Z.flash};opacity:0;pointer-events:none;
 background:radial-gradient(circle at 50% 50%,#FFFFFF 0,#FFFFFF 46%,${C.blueEdge} 100%)}`,
  html: `<div class="flash" id="flash" data-layout-allow-overlap></div>`,
});

/** The statement every transition's frame code ends with: fire the flash relative to the seam. */
export const flashFrameJS = `
          // flare-ok: the gunshot flash is a LIGHT OVERLAY (peak 0.5), not a fade of content
          if (flashEl) flashEl.style.opacity = __fx2.flashAt(t - SEAM, FLASH);`;

export const FLASH = FX.FLASH;
export const wipeDurationOf = (wipe) => FX.wipeDuration(wipe);
