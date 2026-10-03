/**
 * The listeningKit frame: background, dither, icon primitives, chapter rail,
 * progress bar. Shared by every scene so the series reads as one system.
 *
 * Nothing here is invented. See lkdesign.mjs for the per-value provenance.
 */

import { C, DITHER, M, R, SHADOW, TYPE, hardDrop } from "./lkdesign.mjs";

/**
 * Box helpers. Plain border-radius + a hard offset shadow - no clip-path, no
 * mask, no SVG ring defs. See lkdesign.mjs R and SHADOW for why.
 */
export const box = (fill, r = R.md, border = null, shadow = SHADOW.grey, shadowY = SHADOW.y) =>
  `background:${fill};border-radius:${r}px;box-shadow:${hardDrop(shadowY, shadow)}${
    border ? `,inset 0 0 0 1.5px ${border}` : ""
  }`;

const FONTFACE = (assets) =>
  [300, 400, 500, 700, 900]
    .map(
      (w) =>
        `@font-face{font-family:'Satoshi';src:url('${assets}/fonts/Satoshi-${
          { 300: "Light", 400: "Regular", 500: "Medium", 700: "Bold", 900: "Black" }[w]
        }.woff') format('woff');font-weight:${w};font-display:block}`,
    )
    .join("\n");

/**
 * `stageBg` is C.blue for the ROOT composition and "transparent" for the
 * per-beat sub-compositions. A sub-file gets the same stylesheet, so an opaque
 * body there would paint over the root's .stage layers â€” which silently kills
 * every white-stage beat and renders blue type on blue as invisible.
 */
export const css = (assets = "assets", stageBg = C.blue) => `
/* ---- fonts: Satoshi only. tailwind.config.js aliases mono to sans on purpose. */
${FONTFACE(assets)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:${stageBg}}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;
 font-family:'Satoshi',system-ui,sans-serif;font-synthesis:none;
 -webkit-font-smoothing:antialiased}
.clip{position:absolute;inset:0}
.ringdefs{position:absolute;top:0;left:0;pointer-events:none}

/* ---- stage. Flat colour, never a gradient: the app's shell is a flat
   backgroundColor with a dither layer on top (OnboardingShell.tsx:65,70).
   One .stage div per beat, so the background itself cuts between beats. */
.stages{position:absolute;inset:0;z-index:0}
.stage{position:absolute;inset:0;background:${C.blue}}
.stage.white{background:${C.white}}

/* ---- dither. The app's is a WebGL simplex fBm field put through an 8x8 Bayer
   ordered dither at colorNum 4, pixelSize 3 (DitherCanvas.tsx:101-126), masked
   to the left and right edges at opacity-55 (OnboardingShell.tsx:15,70).
   Recreating that per-pixel in canvas JS produced a heavy overlay that both
   looked wrong and counted against the capture layer's overlay budget, so the
   visible surface here is the ordered-dither lattice itself: two 3px-period
   repeating gradients crossed at 45 degrees, which is what 8x8 Bayer looks like
   once quantised, plus the app's edge mask. It animates by sliding the lattice,
   so the frame is never static. */
#dither{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.5;
 background-image:
  repeating-linear-gradient(45deg, rgba(255,255,255,.85) 0 1.5px, rgba(255,255,255,0) 1.5px 3px),
  repeating-linear-gradient(-45deg, rgba(255,255,255,.85) 0 1.5px, rgba(255,255,255,0) 1.5px 3px);
 background-size:6px 6px,6px 6px;
 mask-image:${DITHER.mask};-webkit-mask-image:${DITHER.mask}}
/* On a white stage the lattice is BLUE, but it keeps the app's edge mask.
   Removing the mask here (as an earlier pass did) laid a full-frame blue wash
   over every white beat: the stage stopped reading as white and white type on
   it dropped to roughly 1.3:1. The app masks its dither to the edges on BOTH
   backgrounds (OnboardingShell.tsx:15) - that is the behaviour to copy. */
#dither.on-white{opacity:.55;
 background-image:
  repeating-linear-gradient(45deg, rgba(42,140,255,.30) 0 1.5px, rgba(42,140,255,0) 1.5px 3px),
  repeating-linear-gradient(-45deg, rgba(42,140,255,.30) 0 1.5px, rgba(42,140,255,0) 1.5px 3px)}

/* ---- the one persistent element is a moving chapter rail, not a stuck
   eyebrow. It wipes, it moves, it changes - see .rail in build-beats. */
.chapter{position:absolute;left:0;right:0;bottom:0;height:6px;z-index:70;
 display:flex;gap:4px;padding:0 88px 0}
.chapter i{flex:1;height:6px;background:rgba(255,255,255,.22);overflow:hidden;position:relative}
.stage.white .chapter i{background:rgba(42,140,255,.16)}
.chapter i b{position:absolute;inset:0;transform-origin:left center;transform:scaleX(0);
 background:${C.white};display:block}
.stage.white .chapter i b{background:${C.blue}}

/* ---- logo lockup: the onboarding hero treatment (OnboardingShell.tsx:43-45) */
.lockup{position:absolute;z-index:70;display:flex;align-items:center;gap:18px}
.lockup img{width:64px;height:64px;border-radius:${R.logo}px;display:block}
.lockup .word{font-size:30px;font-weight:900;letter-spacing:0;text-transform:uppercase}
.lockup .obj{font-size:30px;font-weight:500;opacity:.72}
/* The logo is a blue tile with a white mark, so it needs NO filter on either
   stage — brightness(0) invert(1) (which used to be here) flattens both the
   background and the mark to solid white. */
.lockup.on-white img{filter:none}

/* ---- endcard lockup. The logo IS a blue tile with a white mark
   (apps/web/public/logo.svg), so on the blue stage it needs no backing plate -
   only a hard offset shadow to lift it off the field. Two earlier attempts were
   wrong: brightness(0) invert(1) flattened BOTH the blue background and the
   white mark to solid white (the end card shipped a blank white square), and a
   white plate behind an opaque blue logo is simply invisible. Tracking is 0: a
   tracked wordmark is not the wordmark. */
.ecmark{position:relative;width:168px;height:168px}
.ecmark img{position:absolute;inset:0;width:168px;height:168px;border-radius:${R.logo}px;
  display:block;box-shadow:0 ${SHADOW.yLg}px 0 0 ${SHADOW.greyGlass}}
.wordmark{font:${TYPE.h1};letter-spacing:0;text-transform:uppercase;color:${C.white};white-space:nowrap}

/* ---- type scale */
.hero{font:${TYPE.hero};letter-spacing:-.03em}
.h1{font:${TYPE.h1};letter-spacing:-.025em}
.h2{font:${TYPE.h2};letter-spacing:-.02em}
.h3{font:${TYPE.h3};letter-spacing:-.015em}
.body{font:${TYPE.body}}
.eyebrow{font:${TYPE.eyebrow};letter-spacing:.2em;text-transform:uppercase}
.label{font:${TYPE.label};letter-spacing:.14em;text-transform:uppercase}
.kv{font:${TYPE.monoish};letter-spacing:.04em}
.cap{font:${TYPE.caption}}
.blue{color:${C.blue}}
.white{color:${C.white}}
.dim{opacity:.72}
.dim2{opacity:.55}

/* ---- glass card on blue: border-white/30 bg-white/10 (OnboardingSteps.tsx:322) */
.glass{background:rgba(255,255,255,.10);border:1.5px solid rgba(255,255,255,.30);
 box-shadow:0 6px 0 0 rgba(9,32,63,0.30)}
.glass:hover{background:rgba(255,255,255,.20)}
/* inverted: the selected state, border-white bg-white text-[#2a8cff] (:321) */
.invert{background:${C.white};color:${C.blue}}
/* white surface on blue: rounded-[32px] bg-white text-slate-900 (:475) */
.surface{background:${C.white};color:${C.slate900};
 box-shadow:0 10px 0 0 rgba(13,42,76,0.22),0 26px 60px -28px rgba(15,30,51,.45)}
.hard{box-shadow:${M.hardShadow()}}

/* ---- captions: the onboarding dashed underline is the signature link style
   (OnboardingSteps.tsx:369). Captions use it as their rail. */
.cap{z-index:80;display:flex;justify-content:center;align-items:flex-end;padding:0 260px 74px;pointer-events:none}
.cap span{display:inline-block;max-width:1440px;text-align:center;font:${TYPE.caption};
 font-weight:400;color:${C.white};padding:14px 30px;border-radius:${R.md}px;
 background:rgba(10,24,48,.42);border:1.5px solid rgba(255,255,255,.16)}
#root.tone-white .cap span{color:${C.slate900};background:rgba(255,255,255,.88);border-color:${C.slate200}}

/* ---- shared diagram primitives */
.connector{fill:none;stroke:${C.white};stroke-width:3;stroke-linecap:round}
.connector.blue{stroke:${C.blue}}
.node{padding:22px 26px}
.node .nk{font:${TYPE.label};letter-spacing:.16em;text-transform:uppercase;opacity:.72}
.node .nv{font:${TYPE.h3};font-weight:900;margin-top:6px}

/* ---- icon primitive. Heroicons 24 outline, stroke currentColor, sw 1.5 -
   the app's own icon defaults (lkicons.mjs). Sits at the LEFT of a card.
   Radius is rounded-sm (8), NOT a large radius: the app has no fully-rounded
   tile in this position, and at 72px a 12px radius already reads as a lozenge.
   Two tile treatments, and the difference matters:
     .ico.on-blue  brand-blue tile, WHITE glyph  - on a white card
     .ico.on-white light tint tile, BLUE glyph    - on a blue stage
   A bare icon with no tile is fine either way. */
.ic{display:block;flex:none;overflow:visible}
.ico{display:flex;flex:none;align-items:center;justify-content:center;
 width:72px;height:72px;border-radius:${R.sm}px;
 background:${C.blue};color:${C.white};box-shadow:0 0 0 3px ${C.outline}}
.ico.on-white{background:${C.tint};color:${C.blue}}
/* Icon tile sitting on a BRAND BLUE card: the tile inverts to solid white with
   a blue glyph. A blue tile on a blue card is the icon disappearing, which is
   the exact failure the white-stage cards had. */
.ico.on-bluecard{background:${C.white};color:${C.blue}}
.ico.plain{background:none;width:auto;height:auto;color:inherit;box-shadow:none}
/* Compact tile for a chip / inline row, where the 72px panel tile would make the
   label wrap. Same colour rule as .ico - solid brand blue with a white glyph on
   a white card, inverted to solid white with a blue glyph on a blue card. */
.ico.xs{width:44px;height:44px;border-radius:${R.sm}px}
.irow{display:flex;align-items:center;gap:24px}
.irow > .itx{flex:1;min-width:0}

/* ---- grid + list rows used by the field-by-field beats */
.rows{display:flex;flex-direction:column;gap:14px}
.row{display:flex;align-items:center;gap:22px;padding:18px 24px;border-radius:${R.lg}px}
.row .rk{font:${TYPE.kv};width:270px;flex-shrink:0;opacity:.8}
.row .rv{font:${TYPE.h3};font-weight:500}
.row .rdot{margin-left:auto;width:12px;height:12px;border-radius:50%;background:currentColor;opacity:.28}

/* ---- countup, the one pure-number beat */
.count{display:flex;align-items:baseline;justify-content:center;gap:16px}
.count .n{font-size:300px;font-weight:900;line-height:.9;letter-spacing:-.045em;
 font-variant-numeric:tabular-nums}
.count .u{font-size:84px;font-weight:500;opacity:.72}

/* ---- bar chart (sentiment) */
.bar{display:flex;align-items:center;gap:20px;padding:14px 0}
.bar .bl{font:${TYPE.kv};width:130px;opacity:.8}
.bar .bt{flex:1;height:26px;border-radius:${R.sm}px;overflow:hidden;background:rgba(127,127,127,.14)}
.bar .bf{display:block;height:100%;width:0;border-radius:${R.sm}px}
.bar .bv{font:${TYPE.kv};width:150px;text-align:right;opacity:.8}

/* ---- journey / step cards */
.jr{display:flex;gap:20px;justify-content:center}
.jr .card{width:400px;padding:30px 28px;border-radius:${R.card}px}
.jr .num{width:44px;height:44px;border-radius:22px;display:flex;align-items:center;
 justify-content:center;font-size:20px;font-weight:700}
.jr .ch{font:${TYPE.h3};font-weight:900;margin-top:20px}
.jr .cs{font:${TYPE.body};font-weight:400;opacity:.72;margin-top:10px}
.jr .cm{font:${TYPE.kv};margin-top:18px;opacity:.6}

/* ---- transcript surface */
.tw{border-radius:${R.panel}px;overflow:hidden}
.thead{display:flex;align-items:center;justify-content:space-between;padding:20px 28px;
 border-bottom:1.5px solid rgba(127,127,127,.14)}
.tscroll{height:400px;overflow:hidden;padding:24px 32px;position:relative}
.tline{font:400 30px/1.55 'Satoshi',sans-serif;margin-bottom:18px;opacity:.9}
.tline.hit{font-weight:900}
.wave{display:flex;align-items:flex-end;gap:4px;height:92px;padding:18px 28px}
.wave i{flex:1;height:var(--h);border-radius:3px;transform-origin:bottom}

/* ---- data table: moved to src/components/table (its css lives with the component) */

/* ---- working / progress theater */
.wrow{display:flex;align-items:center;gap:20px;padding:18px 24px;border-radius:${R.lg}px}
.spin{width:28px;height:28px;border-radius:50%;border:3px solid rgba(127,127,127,.2);
 border-top-color:currentColor}
.wrow[data-state=done] .spin{display:none}
.chk{width:30px;height:30px;margin-left:auto}
.chk path{stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}

/* ---- chips that converge (constellation). R.lg, NOT R.pill: these are cards
   carrying an object name, not status badges, and a 999px radius turned them
   into lozenges. Fully-rounded is for real pills only (DESIGN_SYSTEM 2.3). */
.chip{padding:13px 22px;border-radius:${R.lg}px;font-size:23px;font-weight:600;
 white-space:nowrap}

/* ---- cursor. The real product cursors, lifted from
   nebius-hackathon/apps/web/public/cursors/ - not a hand-drawn triangle.
   pointer.svg is the dark arrow with a light outline, so it survives on both
   the blue and the white stage without a second asset. Sized large on purpose:
   at 34px it read as a speck on a 1920 frame. */
/* The cursor art is cropped to the arrow itself (viewBox 0 0 34 38) and drawn at
   exactly 2x: 68x76 px, arrow tip at (10,10) inside the box. It used to be an
   80x64 canvas with a 30px arrow in one corner, drawn at 168px - so the "large
   cursor" was a 63px arrow floating in 100px of nothing, and its tip sat ~10px
   off wherever it was aimed. Size and hotspot now mean what they say, and the
   director (lkdirector.mjs) aims the TIP at a measured element.
   left/top are pinned to 0 so a GSAP x/y is a stage coordinate, not an offset
   from wherever a flex container decided an inset-less box should sit. */
.cursor{position:absolute;left:0;top:0;width:0;height:0;z-index:75;pointer-events:none}
/* Three states stacked on one anchor, each offset so ITS hotspot sits on the anchor:
     .cs-n  the arrow           viewBox 0 0 34 38   at 2.4x -> tip at (12,12)
     .cs-h  the open hand       viewBox -6 -6 89 75 at 2x   -> middle fingertip (40,4)
     .cs-c  the pointing hand   viewBox -6 -6 89 75 at 2x   -> fingertip (30,4)
   The director switches them (arrow -> hand on hover -> pointing hand on the press ->
   arrow). Only the active one has opacity 1. The cursor is the subject of every scene,
   so it is drawn large: ~90px of arrow on a 1920 frame. */
.cursor .cs{position:absolute;display:block;opacity:0;background-repeat:no-repeat;background-size:100% 100%} /* swap-ok: sprite swap */
.cursor .cs-n{left:-12px;top:-12px;width:82px;height:91px;opacity:1;background-image:url('assets/cursors/pointer.svg')} /* swap-ok */
.cursor .cs-h{left:-40px;top:-4px;width:178px;height:150px;background-image:url('assets/cursors/hover.svg')}
.cursor .cs-c{left:-30px;top:-4px;width:178px;height:150px;background-image:url('assets/cursors/click.svg')}
/* The click ripple. A ring, because it is a transient effect, never a surface. */
.ripple{position:absolute;left:0;top:0;z-index:74;width:80px;height:80px;border-radius:50%;
 pointer-events:none;border:4px solid ${C.blueEdge}}
.ripple.on-blue{border-color:${C.white}}

/* ---- how a Twenty object is NAMED on screen.
   The camelCase API name was being set in the same weight and size as the
   human title beside it, in a different case pattern, at low opacity. Three
   competing shapes of type for one idea. The rule now: the human title is the
   display element, and the API name is a small uppercase monospace-ish tag in
   a translucent chip - present for accuracy, visually subordinate. */
.apichip{display:inline-block;font:500 19px/1 'Satoshi',system-ui,sans-serif;
 letter-spacing:.02em;padding:9px 14px;border-radius:${R.sm}px;
 background:rgba(42,140,255,.10);border:1.5px solid rgba(42,140,255,.22);
 color:${C.blue};white-space:nowrap;vertical-align:middle}
.on-blue .apichip,.apichip.on-blue{background:rgba(255,255,255,.14);
 border-color:rgba(255,255,255,.30);color:${C.white}}
`;

/**
 * The dither. Ported from DitherCanvas.tsx: simplex fBm field, mixed between
 * two colours, then 8x8 Bayer ordered-dithered at colorNum levels. The app
 * caps it at 20fps; so do we, and time comes off the timeline so every frame
 * is deterministic under seek.
 */
export const ditherJS = `
(function () {
  var cv = document.getElementById('dither');
  if (!cv) return;
  var ctx = cv.getContext('2d', { alpha: false });
  var BAYER = ${JSON.stringify(
    [
      0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52, 11, 59, 7,
      55, 40, 24, 36, 20, 43, 27, 39, 23, 2, 50, 14, 62, 1, 49, 13, 61, 34, 18, 46, 30, 33,
      17, 45, 29, 10, 58, 6, 54, 9, 57, 5, 53, 42, 26, 38, 22, 41, 25, 37, 21,
    ],
  )};
  var CFG = ${JSON.stringify({
    colorNum: DITHER.colorNum,
    pixelSize: DITHER.pixelSize,
    amp: DITHER.waveAmplitude,
    freq: DITHER.waveFrequency,
    speed: DITHER.waveSpeed,
    oct: DITHER.octaves,
  })};
  var BG = ${JSON.stringify(DITHER_FIELD(C.ditherBg))};
  var WAVE = ${JSON.stringify(DITHER_FIELD(C.ditherWave))};
  // The field is repainted per tone. On the blue stage it is the app's own
  // blue-on-blue wave (OnboardingShell.tsx:6-7) screened at DITHER.opacity; on
  // the white stage the same shader runs white -> pale brand blue and is
  // multiplied, so the dither reads on paper without tinting it.
  var PALETTES = {
    blue: { bg: BG, wave: WAVE, opacity: 0.38, blend: "screen", mask: ${JSON.stringify(
      DITHER.mask,
    )} },
    white: { bg: [255, 255, 255], wave: [226, 240, 255], opacity: 0.34, blend: "multiply", mask: "none" },
  };
  function applyPalette(name) {
    var p = PALETTES[name] || PALETTES.blue;
    BG = p.bg; WAVE = p.wave;
    cv.style.opacity = p.opacity;
    cv.style.mixBlendMode = p.blend;
    cv.style.maskImage = p.mask;
    cv.style.webkitMaskImage = p.mask;
    last = -1;
  }
  window.__ditherPalette = applyPalette;
  var W = 0, H = 0, cols = 0, rows = 0, img = null, last = -1;

  function hash(x, y) {
    var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }
  // value-noise fBm: same 4-octave structure as the app's simplex fbm()
  function fbm(x, y) {
    var v = 0, a = 1, f = 1;
    for (var i = 0; i < CFG.oct; i++) {
      var xi = Math.floor(x), yi = Math.floor(y);
      var xf = x - xi, yf = y - yi;
      var u = xf * xf * (3 - 2 * xf), v2 = yf * yf * (3 - 2 * yf);
      var n00 = hash(xi, yi), n10 = hash(xi + 1, yi);
      var n01 = hash(xi, yi + 1), n11 = hash(xi + 1, yi + 1);
      var n = (n00 * (1 - u) + n10 * u) * (1 - v2) + (n01 * (1 - u) + n11 * u) * v2;
      v += a * Math.abs(n * 2 - 1);
      x *= CFG.freq; y *= CFG.freq; a *= CFG.amp;
    }
    return v;
  }

  function resize() {
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.ceil(W / CFG.pixelSize);
    cv.height = Math.ceil(H / CFG.pixelSize);
    cols = cv.width; rows = cv.height;
    img = ctx.createImageData(cols, rows);
  }

  function field(t) {
    var d = img.data, step = 1 / (CFG.colorNum - 1), i = 0;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var px = x / cols, py = y / rows;
        // The app feeds uv straight into a 4-octave simplex fbm; at 640x360 that
        // reads as a broad cloud, so the field is tiled several times across the
        // frame to get the fine wave the product actually shows.
        var f = fbm(px * 11 + t * CFG.speed * 6, py * 7 - t * CFG.speed * 4);
        f = f < 0 ? 0 : f > 1 ? 1 : f;
        var r = BG[0] + (WAVE[0] - BG[0]) * f;
        var g = BG[1] + (WAVE[1] - BG[1]) * f;
        var b = BG[2] + (WAVE[2] - BG[2]) * f;
        // 8x8 Bayer, -0.25 bias, Rec.709 luma-dependent black point.
        // DitherCanvas.tsx:105-126
        var thr = BAYER[(y & 7) * 8 + (x & 7)] / 64 - 0.25;
        r += thr * step; g += thr * step; b += thr * step;
        var lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        var bias = lum < 0.45 ? 0.2 : lum > 0.8 ? 0 : 0.2 * (1 - (lum - 0.45) / 0.35);
        r -= bias; g -= bias; b -= bias;
        var q = CFG.colorNum - 1;
        r = Math.floor(Math.max(0, Math.min(1, r)) * q + 0.5) / q;
        g = Math.floor(Math.max(0, Math.min(1, g)) * q + 0.5) / q;
        b = Math.floor(Math.max(0, Math.min(1, b)) * q + 0.5) / q;
        d[i++] = r * 255; d[i++] = g * 255; d[i++] = b * 255; d[i++] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  var clock = { t: 0 };
  window.__dither = clock;

  function tick() {
    // Quantise time to the app's 20fps cap so the field crawls, not strobes.
    var f = Math.floor(clock.t * ${DITHER.maxFps}) / ${DITHER.maxFps};
    if (f !== last) { last = f; field(f); }
  }
  window.__ditherTick = tick;

  resize();
  field(0);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(cv);
})();
`;

/** float triple -> 0-255 ints, matching how the app passes colour uniforms. */
function DITHER_FIELD(c) {
  return c.map((v) => Math.round(v * 255));
}
