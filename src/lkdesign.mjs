/**
 * ListeningKit video design system.
 *
 * Every value in this file is lifted from the app, not invented for the video.
 * Source of truth: C:\Users\0\.buzz\REPOS\listeningkit-hackathon
 *
 *   colors     apps/web/src/index.css, apps/web/src/pages/onboarding/*, packages/ui/src/button.tsx
 *   icons      @heroicons/react 24 outline (see lkicons.mjs)
 *   dither     apps/web/src/components/DitherCanvas.tsx, apps/web/src/pages/onboarding/OnboardingShell.tsx
 *   fonts      apps/web/src/globals.css, apps/web/tailwind.config.js
 *   motion     apps/web/src/pages/onboarding/OnboardingSteps.tsx, apps/web/src/index.css
 *   radii      apps/web/DASHBOARD_DESIGN.md, packages/ui/src/squircle.tsx
 */


/* ------------------------------------------------------------------ colors */

// The brand blue is NOT --ods-brand-600. That token (#2563eb) is legacy.
// The blue the product actually ships is the literal #2a8cff.
export const C = {
  blue: "#2A8CFF", // OnboardingShell.tsx:65, button.tsx:22, DashboardLayout.tsx:34
  blueHover: "#1F6FE6", // button.tsx:22
  blueEdge: "#7FBAFF", // the one edge colour in the system, used by every card
  // that needs to separate from a same-value neighbour - chiefly THE SPINE
  // (solid brand blue on the blue stage) and the object chips. #2A8CFF on
  // #2A8CFF is the card disappearing, and the hard drop's grey is a shadow,
  // not a stroke: putting the shadow ink on the border read as two unrelated
  // treatments. One lightened blue, both stages, no exceptions.
  blueGradTop: "#3B9BFF", // button.tsx:25 (blue-gradient)
  blueGradBot: "#2B7FFF", // button.tsx:25
  blueText: "#2B7FFF", // button.tsx:26, SquircleBadge.tsx:18
  tint: "#EFF6FF", // button.tsx:26, SquircleBadge.tsx:26
  tintHover: "#E0EDFE", // button.tsx:26
  selected: "#F4F9FF", // table.tsx:46, dropdown.tsx:259
  ditherFrame: "#F7FAFF", // tailwind.config.js:57
  panel: "#FBFCFE", // DashboardLayout.tsx:34
  ink: "#0D2A4C", // tailwind.config.js:52
  white: "#FFFFFF",
  slate900: "#0F172A", // OnboardingAuth.tsx:20
  slate600: "#475569",
  slate500: "#64748B",
  slate400: "#94A3B8",
  slate300: "#CBD5E1", // index.css:163
  slate200: "#E2E8F0", // OnboardingSteps.tsx:482
  slate100: "#F1F5F9", // ChatBubble
  slate50: "#F8FAFC", // OnboardingSteps.tsx:482
  chip: "#EAF0F6", // OnboardingSteps.tsx:498
  stroke: "#E4E7EC", // DashboardFormPrimitives.tsx:30
  hairline: "rgba(43,127,255,0.1)", // index.css:135
  // dither field colours, as linear floats (DitherCanvas.tsx:96)
  ditherBg: [0.165, 0.55, 1], // OnboardingShell.tsx:7
  ditherWave: [0.75, 0.9, 1], // OnboardingShell.tsx:6 ~= #BFE6FF
};

/* ------------------------------------------------------------------- radii */

/**
 * Plain border-radius, NOT a squircle.
 *
 * A squircle is an SVG clip-path applied to a FIXED-size box. Every card in
 * this series is content-sized, so wherever the path geometry and the real box
 * disagreed, the clip cropped the fill and the ring mask painted its border
 * outside the visible shape - that is where the smeared-edge masking artefact
 * came from. Plain rounded-sm/md is what the app's own content surfaces use
 * anyway (OnboardingAuth.tsx:35-37 rounded-xl, OnboardingSteps.tsx:319
 * rounded-3xl), so this is closer to the product, not further from it.
 */
export const R = {
  sm: 8, // tailwind rounded-sm
  md: 12, // tailwind rounded-md / button.tsx:253
  lg: 14, // DashboardFormPrimitives.tsx:220 (rounded-xl)
  tile: 16, // DashboardFormPrimitives.tsx:88
  card: 20, // BrandRevealStep.tsx:75
  panel: 24, // OnboardingAuth.tsx:37 rounded-2xl
  logo: 18, // OnboardingShell.tsx:43
  pill: 999,
};

/* ------------------------------------------------------------ hard shadows */

/**
 * A hard, zero-blur offset shadow straight down.
 *
 * This is the app's onboarding hard-shadow treatment (index.css:6-14
 * .shadow-hard) generalised from inset to offset, so a card sits ON the stage
 * instead of being pressed into it. Slightly grey rather than black, so it
 * reads as the brand's own shadow and not a generic drop shadow.
 */
export const SHADOW = {
  grey: "rgba(13,42,76,0.24)", // oklch(0 0 0 / 15%) retinted to the brand ink
  greySoft: "rgba(13,42,76,0.14)",
  greyGlass: "rgba(9,32,63,0.30)", // glass card sitting on the blue stage
  blue: "#117eff", // button.tsx hard-shadow, blue variant
  blueTop: "#1f6fe6",
  y: 6,
  yLg: 10,
};

/** The one card shadow: a flat grey block below, no blur. */
export const hardDrop = (y = SHADOW.y, color = SHADOW.grey) => `0 ${y}px 0 0 ${color}`;

/* -------------------------------------------------------------------- dither */

/**
 * Faithful port of apps/web/src/components/DitherCanvas.tsx.
 *   - simplex-ish fBm field, 4 octaves (DitherCanvas.tsx:66)
 *   - mix(bg, wave, f) (DitherCanvas.tsx:96)
 *   - 8x8 Bayer ordered dither, colorNum 4, pixelSize 3, -0.25 bias
 *     (DitherCanvas.tsx:105-126)
 * The app caps this at 20fps (DitherCanvas.tsx:222) - we match that.
 */
export const DITHER = {
  colorNum: 4, // OnboardingShell.tsx:8
  pixelSize: 3, // OnboardingShell.tsx:9
  waveAmplitude: 0.25, // :10
  waveFrequency: 2.5, // :11
  waveSpeed: 0.03, // :12
  octaves: 4, // DitherCanvas.tsx:66
  maxFps: 20, // DitherCanvas.tsx:222
  opacity: 0.55, // OnboardingShell.tsx:70 (opacity-55)
  mask: "linear-gradient(to right, black 0%, transparent 20%, transparent 80%, black 100%)", // :15
};

export const BAYER_8X8 = [
  0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52, 11, 59, 7, 55, 40, 24, 36, 20, 43,
  27, 39, 23, 2, 50, 14, 62, 1, 49, 13, 61, 34, 18, 46, 30, 33, 17, 45, 29, 10, 58, 6, 54, 9, 57, 5, 53, 42,
  26, 38, 22, 41, 25, 37, 21,
];

/* ------------------------------------------------------------------- motion */

// index.css:88-142 (shadow-hard), OnboardingSteps.tsx:716-718 (700ms ease-out),
// squircle.tsx:135 (stroke 150ms ease), DashboardFormSheet.tsx:51-67
export const M = {
  control: 0.15, // transition-colors duration-150
  beat: 0.7, // duration-700 ease-out
  progress: [0.32, [0.22, 1, 0.36, 1]], // DashboardFormSheet.tsx
  // Hard-shadow button, reproduced for cards and pills
  hardShadow: (btnShadow = "#117eff", btnShadowTop = "#1f6fe6") =>
    `inset 0 1px 0 0 ${btnShadowTop}, inset 0 -2px 0 0 ${btnShadow}, 0 0 3px 0 rgba(0,0,0,0.2)`,
};

/* --------------------------------------------------------------------- type */

// tailwind.config.js:63-71 - note mono is deliberately aliased to sans, so
// there is NO monospace in this system. Differentiation is weight + tracking.
//
// WEIGHTS ARE THE POINT. HyperFrames' own typography reference
// (skills/hyperframes-creative/references/typography.md) is blunt about this:
// "Weight contrast must be extreme. You default to 400 vs 700. Video needs
// 300 vs 900." The previous scale ran 700 for every display size and 500/600
// for support text - a 700-vs-500 frame, which reads as body copy at 96px. That
// is what made the first pass look flat and generic.
//
// The scale below is therefore Black (900) for display, Regular (400) for
// anything the viewer reads as prose, and Medium (500) for the middle. Only the
// tiny uppercase eyebrows/labels stay at 700, because at 17-20px a lighter cut
// disappears under the video encoder's letter-detail compression.
//
// One deliberate exception to the reference's "cross into serif or mono": the
// app aliases mono to sans on purpose (tailwind.config.js:63-71), so there is
// one voice. Flagged to the owner rather than unilaterally breaking the brand.
export const TYPE = {
  hero: "900 104px/1.02 'Satoshi', system-ui, sans-serif",
  h1: "900 84px/1.05 'Satoshi', system-ui, sans-serif",
  h2: "900 62px/1.08 'Satoshi', system-ui, sans-serif",
  // 500, not 700: h3 sits directly under the display sizes, so it has to RECEDE.
  h3: "500 38px/1.18 'Satoshi', system-ui, sans-serif",
  body: "400 30px/1.45 'Satoshi', system-ui, sans-serif",
  // OnboardingSteps.tsx:627 - the eyebrow, but as a centred stage label
  eyebrow: "700 20px/1 'Satoshi', system-ui, sans-serif",
  label: "700 17px/1.2 'Satoshi', system-ui, sans-serif",
  monoish: "500 21px/1.3 'Satoshi', system-ui, sans-serif",
  // The record/list KEY label ("direction", "status", "fromNumber") and the value
  // beside it. This token was referenced by lkchrome.mjs as TYPE.kv and DID NOT
  // EXIST, so every key label emitted a literal `font:undefined` and silently
  // inherited the body face - which is why the record keys read as undifferentiated
  // body text next to the values, and why the object chips looked inconsistent.
  // Same cut as monoish; it is the same role in the product.
  kv: "500 21px/1.3 'Satoshi', system-ui, sans-serif",
  // 400: captions are the floor of the frame, not a competing headline.
  caption: "400 34px/1.34 'Satoshi', system-ui, sans-serif",
};

/* ------------------------------------------------------------------ weights */

export const FONT_W = [300, 400, 500, 700, 900];
