// Emits compositions/<slug>.html from storyboards.mjs + Deepgram word timings.
//
// The visual layer is the ListeningKit design system, not a video-template look:
// flat #2A8CFF / #FFFFFF stages (never a gradient), plain rounded-md/rounded-lg
// surfaces with hard grey offset shadows, Heroicons 24 outline, the app's 8x8 Bayer dither, Satoshi only, and a tone that
// alternates per beat so the edit keeps cutting between white-on-blue and
// blue-on-white. See lkdesign.mjs and lkchrome.mjs for per-value provenance.
//
// Beats OVERLAP by XF so every change is a real transition, and each beat's
// animation is offset a further LEAD earlier than its narration names it ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â that
// offset is the J-cut: you see the next idea land before it is spoken.

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { beats as B } from "./scenes.mjs";
import { componentRuntimeJS } from "./components/anatomy.mjs";
import { springRuntimeJS } from "./lkspring.mjs";
import { colorRuntimeJS } from "./lkcolor.mjs";
import { componentsCSS } from "./components/index.mjs";
import { extrudeCSS, applySlabs } from "./lkextrude.mjs";
import { ARCS } from "./storyboards.mjs";
import { css } from "./lkchrome.mjs";
import { C } from "./lkdesign.mjs";
import {
  TREATMENTS,
  SEAMS,
  FLAG_TO_SEAM,
  XF_TO_SEAM,
  SEAM_ROTATION,
  motionCSS,
  motionRuntimeJS,
  withMotionClass,
} from "./lkmotion.mjs";
import { planFor, directorRuntimeJS } from "./lkdirector.mjs";
import { CLOCK } from "./lkclock.mjs";
import { satellitesFor, satelliteCSS as SATCSS } from "./lksatellites.mjs";

// Resolve from THIS file, never from the CWD. These modules now live in src/,
// and a script that only works when invoked from the repo root is one npm-script
// rename away from silently writing compositions to the wrong place.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "compositions");
const { INTRO, XF, LEAD, ENTER, OUTRO } = CLOCK; // see src/lkclock.mjs

// Deepgram Nova-3 mishears these. Caption text is corrected; the word timing is
// untouched. A listen-back of the synthesised audio should confirm the VO itself.
const ASR_FIXES = [
  [/Telmex/g, "Telnyx"],
  [/agency phone's object/g, "agency phones object"],
  [/canceling a contract data points that is/g, "canceling a contract, that is not twelve"],
[/the two AI An AI summary/g, "the two AI fields. An AI summary"],
  // agency-prospects
  [/doing a kind of Auto body shops/g, "doing a kind of work we know how to sell into. Autobody"],
  [/This is the spite of the whole database/g, "This is the spine of the whole database"],
  [/the Weibel field is how we mark where they/g, "the label field is how we mark where they"],
  [/so a high scoring tinting shop and a good market/g, "so a high-scoring tinting shop in a good market"],
  [/New, working, won, lost/g, "New. Working. Won. Lost."],
];
const fixCaptions = (t) => ASR_FIXES.reduce((s, [re, to]) => s.replace(re, to), t);

const ALL_KEYS = [
  "blockers", "count", "foot", "from", "head", "kicker", "label", "left", "lines", "marker",
  "mystery", "n", "note", "panels", "r", "reveal", "right", "hold", "links", "focus",
  "fieldGlow", "rowKeys", "bars", "rows", "steps", "sub", "to", "unit", "url", "cta", "title",
"api", "big", "verdict", "cursor", "dur", "labels", "fx",
];

/**
 * Which treatment, if any, this beat opted into.
/* overwhelm. The centring lives on the wrapper, never on the animated box ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â
 * A treatment is chosen at the STORYBOARD level, one key: `fx: "<name>"`. It is
 * deliberately not a beat argument: a treatment is a decision about how a moment
 * is animated, which belongs beside the beat's `kind` and `tone`, not inside the
 * content it animates.
 */
const treatmentOf = (b) => (b.fx ? TREATMENTS[b.fx] : null);

/**
 * Which seam this beat arrives on. The storyboard's flags still mean what they
 * always meant (zx -> zoom-in, slide -> push-left, blur -> blur), `xf: "<name>"`
 * picks one directly (a new seam name, or one of the old transition names), and a
 * beat with no intent takes the next seam in SEAM_ROTATION - so there is no such
 * thing as an unnamed cut (M6). Beat 0 has no seam.
 */
const seamOf = (b, i) => {
  if (i === 0) return null;
  if (b.xf) return SEAMS[b.xf] ? b.xf : XF_TO_SEAM[b.xf] || SEAM_ROTATION[(i - 1) % SEAM_ROTATION.length];
  for (const [flag, name] of Object.entries(FLAG_TO_SEAM)) if (b[flag]) return name;
  return SEAM_ROTATION[(i - 1) % SEAM_ROTATION.length];
};

/** Serialise a treatment + the beat's own animation into ONE standalone body. */
function composeAnimSrc(beat, built) {
  const base = built.anim.toString().replace(/^\s*\w+\s*\(/, "function (");
  const t = treatmentOf(beat);
  const args = JSON.stringify(beat.a);
  if (!t) {
    return `(function(A){const{${ALL_KEYS.join(",")}}=A;return (${base});})(${args})`;
  }
  const fx = t.anim.toString().replace(/^\s*\w+\s*\(/, "function (");
  // `only` treatments REPLACE the beat's animation. That is not a preference:
  // typewriter-run and wordmark-lockup are different ways of doing the same
  // moment, and running both would put two typewriters on one beat.
  const body = t.mode === "only" ? `__fxrun(tl,at,h);` : `__base(tl,at,h);__fxrun(tl,at,h);`;
  return `(function(A){const{${ALL_KEYS.join(",")}}=A;
const __base=${base};
const __fxrun=${fx};
return function (tl,at,h){h.A=A;${body}};
})(${args})`;
}

/** Scene-level CSS on top of the shared chrome in lkchrome.mjs. */
function sceneCSS() {
  return `
/* ---- stage centre: every beat composes around the middle of the frame, never
   a fixed top-left corner. */
.stagec{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
 justify-content:center;gap:34px;padding:110px 120px 150px;z-index:20;text-align:center}
.stagec .row{text-align:left}
.stagec .bar{text-align:left}
${extrudeCSS}${componentsCSS}

/* overwhelm. The centring lives on the wrapper, never on the animated box ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â
   GSAP writes the whole transform, so a translate(-50%,-50%) on the animated
   element would be overwritten the moment it scales. */
.ovwrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3}
.ovbox{z-index:3}
/* .ovorb is the orbiting anchor (GSAP positions it on an ellipse); .ovcard sits
   centred on it and is what flies in. Two elements so the orbit and the entrance
   never write the same transform. */
.ovorb{position:absolute;left:50%;top:50%;width:0;height:0;z-index:2}
.ovcard{position:absolute;left:0;top:0;text-align:left}
.ovt{font-size:36px;font-weight:700;line-height:1.15;white-space:nowrap}

/* zoom-out reveal */
.zw{display:flex;flex-direction:column;align-items:center;gap:40px}
.myst{display:flex;align-items:center;justify-content:center}
/* The number's own line box is taller than its glyphs, so the eyebrow sitting
   directly above it sat INSIDE that box on the counted beats. Breathing room
   here is what keeps the kicker legible rather than relying on the gap alone. */
.count{margin-top:64px;margin-bottom:48px}

/* record panel + note callout */
.pan{z-index:2}
/* The panel and the note are laid out as a ROW, not as absolutely positioned
   boxes. Positioned independently they were both centred/righted against the
   frame and overlapped by ~310px on every record beat in the film, which the
   layout check reported 12 times and which reads on screen as the note sitting
   on top of the record. In a row they cannot collide at any width. */
.recrow{display:flex;gap:44px;align-items:center;justify-content:center;width:100%;z-index:2}
.note{position:absolute;right:120px;top:50%;transform:translateY(-50%);z-index:4;text-align:left;width:560px}
.note.inrow{position:static;transform:none;width:auto;flex:0 0 600px;align-self:center}
.relsvg{z-index:1}

/* agent work */
.wk{z-index:2}

/* sentiment */
.sb{z-index:2;width:1120px}
.sb .note{right:auto;left:120px;top:auto;bottom:120px;transform:none;width:700px}

/* converge */
.cvf{display:flex;align-items:center;justify-content:center}
.cvchip{z-index:1}

/* journey cards */
.jcard{z-index:2;text-align:left}

/* typewriter */
.twl-line{display:flex;align-items:center;justify-content:center;min-height:64px}
.caret{margin-left:6px}

/* split */
.sp{z-index:2;text-align:left}
.spdiv{align-self:center;height:300px}

/* the wipe sheet a section transition crosses the frame on. It sits above the
   stage and below nothing, so the beat it covers is fully hidden by it. */
.flash{position:absolute;inset:0;z-index:85;opacity:0;pointer-events:none;
 background:radial-gradient(circle at 50% 50%,#FFFFFF 0,#FFFFFF 38%,${C.blueEdge} 100%)}
  // composition_heavy_overlay_count_high) ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â which is exactly why
${motionCSS}
${SATCSS}
`;
}

/** Group word timings into caption chunks. */
function chunkCaptions(words, maxWords = 9, maxChars = 62) {
  const out = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    const text = cur.map((x) => x.punctuated_word ?? x.word).join(" ");
    if (cur.length >= maxWords || text.length >= maxChars || /[.!?]$/.test(text)) {
      out.push({ start: cur[0].start, end: cur[cur.length - 1].end, text: fixCaptions(text) });
      cur = [];
    }
  }
  if (cur.length) {
    out.push({
      start: cur[0].start,
      end: cur[cur.length - 1].end,
      text: fixCaptions(cur.map((x) => x.punctuated_word ?? x.word).join(" ")),
    });
  }
  for (let i = 0; i < out.length - 1; i++) out[i].end = out[i + 1].start;
  return out;
}

function captions(caps) {
  return caps
    .map(
      (c) =>
        `      <div class="clip cap" data-start="${(INTRO + c.start).toFixed(3)}" data-duration="${(
          c.end - c.start
        ).toFixed(3)}" data-track-index="90"><span>${c.text}</span></div>`,
    )
    .join("\n");
}

function buildOne(slug) {
  const sb = ARCS[slug];
  const timing = JSON.parse(fs.readFileSync(path.join(ROOT, "assets", "timing", `${slug}.json`), "utf8"));
  const words = timing.results.channels[0].alternatives[0].words;
  const caps = chunkCaptions(words);
  const audioDur = words[words.length - 1].end;

  const seq = [...sb.beats.map((b) => ({ ...b, silent: false })), { ...sb.outro, silent: true }];
  const TOTAL = INTRO + seq[seq.length - 1].t + OUTRO;

  const plan = [];
  // Where the previous beat's pointer ended up: the next beat's pointer starts there,
  // so across cuts it reads as ONE mouse, not a new one per scene.
  let prevCursor = null;
  const mounts = [];
  const animSrc = [];

  // One sub-composition per beat.
  //
  // This is not tidiness, it is a correctness fix. Every card, pill and panel is
  // its own overlay, and a single file carrying all scenes reaches ~47 heavy
  // overlays at once. HyperFrames' capture layer renders solid-black past
  // roughly the halfway point of a composition that dense (lint:
  // composition_heavy_overlay_count_high) ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â which is exactly why
  // the first build came back with beats 12-18 blank. Each scene gets its own
  // file so any single capture only ever sees one scene's overlays.
  const subDir = path.join(OUT, slug);
  fs.mkdirSync(subDir, { recursive: true });
// Every path is project-root-relative. Compositions are served with the
  // project root as their base URL, so a sub-file must NOT reach up with "../"
  // (lint: invalid_parent_traversal_in_asset_path) - that 404s in Studio even
  // though a render happens to rewrite it.
  const subSrc = `compositions/${slug}/b`;
  const subAssets = "assets";

  seq.forEach((b, i) => {
const sceneAssetsPrefix = "assets";
    // TONE MUST BE AN INPUT TO THE SCENE BUILDER, NOT AN OVERRIDE APPLIED AFTER.
    //
    // Each scene computes `onBlue = tone === "blue"` INSIDE its factory, from its
    // own default parameter, and bakes the result into the markup - white text,
    // glass cards, white stage. Overriding `built.tone` afterwards only relabelled
    // the plan entry; it never re-ran the factory. So every journey beat rendered
    // blue-tone content (white type) on a white stage: pale, low-contrast, and
    // effectively invisible. Passing the storyboard's tone in means the factory
    // builds the markup for the stage it will actually sit on.
const built = B[b.kind]({ tone: b.tone, ...b.a });
    // The storyboard owns the stage tone so the two-tone rhythm is explicit and
    // editable in one place, rather than implied by whichever scene builder runs.
    if (b.tone) built.tone = b.tone;
    const treated = !!treatmentOf(b);
    // The `fx` class goes on only when a treatment runs. It gates the
    // treatment-only CSS (per-word/char spans are inline-block, and the marker
    // underline), so an untreated beat's DOM is byte-identical to before.
    // Injected as the last children of the stage wrapper so they ride the camera:
    //   - the depth set: components from the beat's own family, placed at different
    //     depths around the content (lksatellites.mjs). No text blocks: subtitles stay
    //     in the root's caption pill, outside the 3D world.
    //   - for beats that depict an interface, a cursor and its click ripple.
    let tail = "";
    const sats = b.silent ? null : satellitesFor(slug, b, i);
    if (sats) tail += sats.html;
    if (!b.silent) {
      // The one pointer of the beat: three states stacked (arrow / open hand / pointing
      // hand), switched by the director, plus the press ripple. See lkdirector.mjs.
      const ink = b.tone === "blue" ? " on-blue" : "";
      tail += `<div class="ripple${ink}" data-a="rip" data-layout-allow-overlap></div><div class="cursor" data-a="cur" data-layout-allow-overlap><i class="cs cs-n"></i><i class="cs cs-h"></i><i class="cs cs-c"></i></div>`;
    }
    let sceneHTML = treated ? withMotionClass(built.html) : built.html;
    if (tail) sceneHTML = sceneHTML.replace(/<\/div>\s*$/, tail + "</div>");
    // the one ownership pass: every marked card becomes a slab that owns its slices (lkextrude.applySlabs)
    sceneHTML = applySlabs(sceneHTML);
    const subId = `${slug}-b${i}`;
    // The anim bodies close over nothing but their own params, so they serialise
    // straight into the page as source. Function.prototype.toString() yields
    // shorthand-method source, which is not a valid expression, so re-declare it
    // as a function expression. toString() also drops closure scope, so each body
    // is wrapped in an IIFE that re-establishes every possible key from the literal
    // args object.
animSrc.push(composeAnimSrc(b, built));

    const start = +(INTRO + b.t - (i === 0 ? 0 : LEAD)).toFixed(3);
    const nextT = i + 1 < seq.length ? seq[i + 1].t : seq[i].t + OUTRO;
    // The pacing plan: clause cues from the real word timings, entrance slots, camera
    // shots and cursor stops (lkdirector.mjs). The silent outro has no narration to
    // pace against and keeps its own end-card animation.
    const nextSeam = i + 1 < seq.length ? seamOf(seq[i + 1], i + 1) : null;
    const dirPlan = b.silent ? null : planFor(b, words, nextT, { lead: LEAD, enter: ENTER, index: i, sats, prevCursor, exitFrom: nextSeam && SEAMS[nextSeam] ? SEAMS[nextSeam].exit : null });
    const dur = +(nextT - b.t + LEAD + (i + 1 < seq.length ? XF : 0)).toFixed(3);
    if (dirPlan && dirPlan.cursor) prevCursor = dirPlan.cursor.endPos;
    plan.push({
      i,
      sel: `.beat[data-b="${i}"]`,
      start,
      dur,
tone: built.tone,
      name: built.name,
      blueprint: built.blueprint,
      type: built.type,
      fx: b.fx || null,
      xf: seamOf(b, i),
      shots: dirPlan ? dirPlan.camera.shots.length : 0,
    });

    fs.writeFileSync(
      path.join(subDir, `b${i}.html`),
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>${css(sceneAssetsPrefix, "transparent")}${sceneCSS()}</style>
  </head>
  <body>
    <div id="root" data-composition-id="${subId}" data-start="0" data-duration="${dur.toFixed(3)}" data-width="1920" data-height="1080" data-fps="30">
${sceneHTML.replace(/(src=")assets\//g, `$1${subAssets}/`)}
    </div>
    <script>${treated ? motionRuntimeJS : ""}
      ${directorRuntimeJS}
      ${componentRuntimeJS}
      ${colorRuntimeJS}
      const CMP = ${JSON.stringify(built.cmp || {})}; // the scene's components, as data (src/components)
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      window.__timelines["${subId}"] = tl;
      const ANIM = ${animSrc[animSrc.length - 1]};
      const root = document.getElementById("root");
      ANIM(tl, ${ENTER}, {
        q: (s) => root.querySelector(s),
        qq: (s) => Array.from(root.querySelectorAll(s)),
      });
      // The pacing layer runs AFTER the scene has built its own timeline: it retimes
      // item entrances to the narration, then adds the camera and the cursor.
      __dir.run(tl, root, ${JSON.stringify(dirPlan)});
      // THE LIP: derived at render time from each slab host's own computed colour, in OKLCH (lkcolor.mjs)
      __lip.apply(root);
      tl.seek(0);
    </script>
  </body>
</html>
`,
      "utf8",
    );

    mounts.push(
      `      <div class="clip beat" data-layout-allow-overlap id="beat-${i}" data-b="${i}" data-composition-id="${slug}-b${i}" data-composition-src="${subSrc}${i}.html" data-start="${start}" data-duration="${dur}" data-track-index="${i + 1}"></div>`,
    );
  });

  const narration = JSON.parse(fs.readFileSync(path.join(ROOT, "narrations", `${slug}.json`), "utf8"));
  const n = narration.narration;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>${css()}${sceneCSS()}</style>
  </head>
  <body>
    <div id="root" data-composition-id="${slug}" data-start="0" data-duration="${TOTAL.toFixed(3)}" data-width="1920" data-height="1080" data-fps="30">
      <div class="stages" data-a="stages">
${plan
  .map(
    (b) =>
      `        <div class="stage ${b.tone === "white" ? "white" : ""}" data-s="${b.i}" style="opacity:0"></div>`,
  )
  .join("\n")}
      </div>
      <div id="dither"></div>
      <div class="flash"></div>
      

${mounts.join("\n")}


${captions(caps)}

      <div class="chapter" data-a="chapter">${plan.map((b) => `<i data-c="${b.i}"><b></b></i>`).join("")}</div>

      <audio id="${slug}-audio" src="assets/audio/${slug}.mp3" data-start="${INTRO}" data-duration="${audioDur.toFixed(3)}" data-has-audio="true" data-volume="1"></audio>
    </div>
    <script>
      ${springRuntimeJS}
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      window.__timelines["${slug}"] = tl;

      const PLAN = ${JSON.stringify(plan)};
      // The seams are DATA (lkmotion.mjs SEAMS): a clip shape for the stage-colour
      // reveal, and where the outgoing and incoming scenes travel. One generic
      // builder below turns any of them into tweens.
      const SEAMS = ${JSON.stringify(SEAMS)};
      const XF = ${XF};
      const LEAD = ${LEAD};
      const TOTAL = ${TOTAL.toFixed(3)};
      const OUTRO_END = TOTAL - 2.4;
const root = document.getElementById("root");

      tl.to({}, { duration: TOTAL }, 0);

      const stages = Array.from(root.querySelectorAll(".stage"));
      const chips = Array.from(root.querySelectorAll(".chapter i b"));

      function toneAt(i) { return PLAN[i].tone; }

      // Stage colour, dither palette, chapter rail - and the SEAM between beats.
      //
      // NOTHING FADES (DESIGN_SYSTEM 4). Elements enter by scale 0 -> 1 with overshoot and leave by
      // scale 1 -> 0; no element, scene or beat is ever tweened in opacity. A seam is:
      //   S-0.3..S   the OUTGOING scene removes every element: each scales DOWN to 0 (staggered, in the
      //              order its seam names), inside that beat's own timeline (lkdirector.mjs exit)
      //   S..C       the stage is empty. An exposure flare (a light overlay, not a fade of content)
      //              rises on a cosine to hide the stage-colour swap
      //   C          the peak: stage colour, dither and tone swap here, unseen
      //   ENTER..    the INCOMING scene's elements scale UP from 0 with overshoot, into the falling flare
      const FLASH_UP = 0.3;
      const FLASH_DOWN = 0.55;
      const flashEl = root.querySelector(".flash");
      PLAN.forEach((b, i) => {
        const st = stages[b.i];
        const tone = toneAt(i);
        const C = b.start + FLASH_UP;
        if (st) {
          if (i === 0) tl.set(st, { opacity: 1 }, 0);
          else {
            tl.set(st, { opacity: 1 }, C);
            tl.set(stages[i - 1], { opacity: 0 }, C);
          }
        }
        if (i > 0) {
          tl.call(() => {
            root.classList.toggle("tone-white", tone === "white");
            const dth = document.getElementById("dither");
            if (dth) dth.classList.toggle("on-white", tone === "white");
          }, null, C);
          if (flashEl) {
            // flare-ok: the exposure flare is a LIGHT OVERLAY (it hides the stage-colour swap), not a fade of content
            tl.fromTo(flashEl, { opacity: 0 }, { opacity: 1, duration: FLASH_UP, ease: "sine.inOut" }, b.start);
            tl.to(flashEl, { opacity: 0, duration: FLASH_DOWN, ease: "sine.out" }, C);
          }
        }
        const chip = chips[i];
        if (chip) {
          tl.set(chip, { scaleX: 0 }, b.start);
          tl.to(chip, { scaleX: 1, duration: b.dur, ease: "none" }, b.start);
        }
        // The beat element itself is never animated: it holds the scene, and the scene's own elements
        // scale in and out inside their own timelines.
      });

      // The subtitles are NORMAL bottom captions, in the root, outside the 3D world.
      Array.from(root.querySelectorAll(".cap")).forEach((c) => {
        const at = parseFloat(c.dataset.start);
        const sp = c.querySelector("span");
        if (sp) tl.fromTo(sp, { y: 16, scale: 0.97 }, { y: 0, scale: 1, duration: 0.22, ease: "power2.out" }, at);
      });

      // the subtitle pill and the chapter rail leave by scale too
      tl.to(".cap span", { scale: 0, duration: 0.35, ease: __spr.popIn }, OUTRO_END - 0.1);
      tl.to(".chapter", { scaleY: 0, duration: 0.35, ease: __spr.popIn }, OUTRO_END - 0.1);

      tl.seek(0);
    </script>
  </body>
</html>
`;
  fs.writeFileSync(path.join(OUT, `${slug}.html`), html, "utf8");
  return { slug, beats: seq.length, captions: caps.length, audio: +audioDur.toFixed(2), total: +TOTAL.toFixed(2) };
}

const only = process.argv[2];
const targets = only ? [only] : Object.keys(ARCS);
for (const s of targets) console.log(JSON.stringify(buildOne(s)));
