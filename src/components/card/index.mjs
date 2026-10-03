/**
 * components/card - the card family: the surface every other component stands on.
 *
 * Moved here from scenes.mjs (which re-exports it, so scenes call it unchanged). One rule decides the
 * colour: THE CARD INVERSION (a card is white on the blue stage and brand blue on the white stage;
 * `cardFor(tone, ...)` is the only place that is decided). Every card carries the system's outer
 * stroke (`hardDrop`, a black 4 px ring plus the hard drop) and an inner ring in the stage's other colour.
 *
 *   cardFor(tone, maxW, r, extra)   the card for the stage it sits on
 *   glass / frost / surface / blueCard / surfaceOnWhite   the underlying fills
 *   pill(w, h)                       a solid white button-pill (never hollow)
 *   numChip(n, onBlue)               a numbered chip
 *   apiChip(api, onBlue)             the small chip that names a Twenty object
 *   thickness                        an extruded card gets its slab from lkextrude.mjs (`x3d` + slab())
 */

import { C, R, SHADOW, hardDrop } from "../../lkdesign.mjs";

export const id = "card";
export const summary = "The surface: inverts per stage, outer black stroke, inner ring, hard drop.";
export const semantics = {
  kind: "surface",
  use: "Behind any group of content. Choose it with cardFor(tone): never hand-pick a fill.",
  avoid: "Hollow or translucent cards for content on the white stage (no edge); white on white.",
  tone: "inverts: white on blue, brand blue on white",
  needs: [],
};

/**
 * A FIXED-SIZE box. Plain border-radius now - no clip-path.
 *
 * The squircle version applied an SVG clip-path, which carries the shape but
 * does not size the box, so these had to be hard-coded and any mismatch between
 * the path geometry and the real box cropped the fill. Plain radius has no such
 * failure mode.
 */
export function sq(w, h, r, fill, stroke, strokeW = 1.5, extra = "", ownShadow = false) {
  // ownShadow: the caller passes its own box-shadow in `extra`, so emit none
  // here. Two declarations meant the later one silently won.
  return `width:${w}px;height:${h}px;background:${fill};border-radius:${r}px;` +
    (ownShadow ? "" : `box-shadow:${hardDrop(SHADOW.y)}`) +
    `${strokeW ? `,inset 0 0 0 ${strokeW}px ${stroke}` : ""};${extra}`;
}

/**
 * A CONTENT-SIZED card. rounded-md / rounded-lg + a hard, zero-blur grey
 * shadow straight down, so the card sits on the stage.
 */
export function card(maxW, r, fill, stroke, extra = "") {
  // --slab: the marker applySlabs() (lkextrude) turns into an owned slab. Opaque cards only: a translucent face
  // would show its own slices through it. Wide cards are panels, the rest cards.
  const mark = String(fill).startsWith("rgba") ? "" : `--slab:${maxW >= 900 ? "panel" : "card"};`;
  return `${mark}max-width:${maxW}px;background:${fill};border-radius:${r}px;` +
    // inner ring: the stage's other colour, one stroke, then the black outer stroke
    `box-shadow:inset 0 0 0 3px ${fill === C.white ? C.blueEdge : C.white},${hardDrop(SHADOW.y, SHADOW.grey)}` +
    (stroke ? `,inset 0 0 0 1.5px ${stroke}` : "") +
    (extra ? `;${extra}` : "");
}

/** The onboarding glass card: border-white/30 bg-white/10 + a grey hard drop. */
export function glass(maxW, r = R.card, extra = "") {
  return card(maxW, r, "rgba(255,255,255,0.10)", "rgba(255,255,255,0.30)", extra).replace(
    hardDrop(SHADOW.y, SHADOW.grey),
    `0 ${SHADOW.y}px 0 0 ${SHADOW.greyGlass}`,
  );
}

/**
 * A translucent card for the WHITE stage — the counterpart to glass().
 *
 * Every decorative card on a white beat was an opaque near-white fill (#FFFFFF,
 * #EFF6FF, #F8FAFC). On a white stage an opaque white card has no edge, so the
 * frame read as a flat wash with floating grey text, and the stacked cards in
 * the journey beat disappeared into it entirely. Translucent fills plus the
 * hairline stroke keep every layer legible against the stage behind it.
 *
 * The reconstructed record panel stays opaque: that one is standing in for a real
 * product surface, and a see-through CRM panel would misrepresent the product.
 */
export function frost(maxW, r = R.card, extra = "") {
  return card(
    maxW,
    r,
    "rgba(255,255,255,0.72)",
    "rgba(42,140,255,0.18)",
    `${extra}`,
  );
}

/** White surface on blue - rounded-2xl bg-white text-slate-900. */
export function surface(maxW, r = R.panel, extra = "") {
  return card(maxW, r, C.white, null, `color:${C.slate900};${extra}`);
}

/**
 * THE CARD INVERSION RULE. A card is WHITE on the blue stage and BRAND BLUE on
 * the white stage. Never white-on-white, never white-on-white-with-a-hairline.
 *
 * Both earlier attempts at the white stage were the same mistake wearing
 * different clothes: an opaque near-white fill, and then an opaque white fill
 * with a 1.5px blue hairline pretending to be an edge. Neither is a card - they
 * are the stage, redrawn. The stage already alternates, so the card has to
 * alternate against it or it has no job.
 *
 * The drop is the brand's own darker blue (button.tsx:22 #1f6fe6), not grey:
 * a grey shadow under a blue card reads as dirt, a blue one reads as depth.
 */
export function blueCard(maxW, r = R.card, extra = "") {
  return card(maxW, r, C.blue, null, `color:${C.white};${extra}`).replace(
    hardDrop(SHADOW.y, SHADOW.grey),
    hardDrop(SHADOW.y, C.blueHover),
  );
}

/**
 * Pick the card for the stage it will actually sit on.
 *
 * This is the only place the inversion is decided. A scene that hand-picks
 * `surface()` vs `frost()` per tone is how the record panel ended up with
 * literally identical branches on both tones (`onBlue ? surface(...) :
 * surface(...)`) and shipped white-on-white.
 */
export function cardFor(tone, maxW, r = R.card, extra = "") {
  return tone === "blue" ? surface(maxW, r, extra) : blueCard(maxW, r, extra);
}

/**
 * A white card that has to be visible ON A WHITE STAGE.
 *
 * Solid white on solid white has no edge — the hard drop alone was not enough to
 * separate three cards from each other. The fix is a hairline, not an alpha:
 * the fill stays fully solid (DESIGN_SYSTEM 1.1) and the stroke does the work the
 * translucency was faking.
 */
export function surfaceOnWhite(maxW, r = R.panel, extra = "") {
  return card(maxW, r, C.white, C.hairline, `color:${C.slate900};${extra}`);
}

/** White pill on blue - the h-14 rounded-xl font-bold CTA (OnboardingSteps:340). */
export function pill(w, h, extra = "") {
  return sq(
    w,
    h,
    R.md,
    C.white,
    null,
    0,
    `color:${C.slate900};box-shadow:inset 0 0 0 3px ${C.blueEdge},${hardDrop(SHADOW.y)};${extra}`,
    true,
  );
}

/** Numbered chip - rounded-full size-5/6 font-bold (OnboardingSteps:421). */
export function numChip(n, onBlue) {
  return sq(
    44,
    44,
    22,
    onBlue ? C.white : C.chip,
    null,
    0,
    `display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:${
      onBlue ? C.blue : C.slate900
    }`,
  );
}

/**
 * How a Twenty object is named on screen.
 *
 * `agencyProspects` was being set in `.kv` — same size class as the human title
 * beside it, different case pattern, at 0.55 opacity — so a record header carried
 * three competing shapes of type for one idea and read as an accident. The API
 * name is still shown, because a worker opening Twenty has to recognise it, but
 * it is now a small translucent chip that is visibly subordinate to the title.
 */
export function apiChip(api, onBlue = false) {
  return `<span class="apichip${onBlue ? " on-blue" : ""}">${api}</span>`;
}
