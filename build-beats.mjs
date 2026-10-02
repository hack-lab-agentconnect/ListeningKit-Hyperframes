// Emits compositions/<slug>.html from storyboards.mjs + Deepgram word timings.
//
// The visual layer is the ListeningKit design system, not a video-template look:
// flat #2A8CFF / #FFFFFF stages (never a gradient), plain rounded-md/rounded-lg
// surfaces with hard grey offset shadows, Heroicons 24 outline, the app's 8x8 Bayer dither, Satoshi only, and a tone that
// alternates per beat so the edit keeps cutting between white-on-blue and
// blue-on-white. See lkdesign.mjs and lkchrome.mjs for per-value provenance.
//
// Beats OVERLAP by XF so every change is a real transition, and each beat's
// animation is offset a further LEAD earlier than its narration names it ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â that
// offset is the J-cut: you see the next idea land before it is spoken.

import fs from "node:fs";
import path from "node:path";
import { beats as B } from "./scenes.mjs";
import { ARCS } from "./storyboards.mjs";
import { css } from "./lkchrome.mjs";
import { C } from "./lkdesign.mjs";

const ROOT = path.resolve(".");
const OUT = path.join(ROOT, "compositions");
const INTRO = 0.8; // beat 0 must be on screen at t=0
const XF = 0.45; // transition overlap
const LEAD = 0.55; // J-cut: visuals land this long before the line is spoken
const OUTRO = 8.0;

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
  "api", "big", "verdict", "cursor", "dur", "labels",
];

/** Scene-level CSS on top of the shared chrome in lkchrome.mjs. */
function sceneCSS() {
  return `
/* ---- stage centre: every beat composes around the middle of the frame, never
   a fixed top-left corner. */
.stagec{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
 justify-content:center;gap:34px;padding:110px 120px 150px;z-index:20;text-align:center}
.stagec .row{text-align:left}
.stagec .bar{text-align:left}

/* overwhelm. The centring lives on the wrapper, never on the animated box ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â
   GSAP writes the whole transform, so a translate(-50%,-50%) on the animated
   element would be overwritten the moment it scales. */
.ovwrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3}
.ovbox{z-index:3}
.ovcard{position:absolute;left:50%;top:50%;margin:-52px 0 0 -260px;z-index:2;text-align:center}

/* zoom-out reveal */
.zw{display:flex;flex-direction:column;align-items:center;gap:40px}
.myst{display:flex;align-items:center;justify-content:center}

/* record panel + note callout */
.pan{z-index:2}
.note{position:absolute;right:120px;top:50%;transform:translateY(-50%);z-index:4;text-align:left;width:560px}
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
  const mounts = [];
  const animSrc = [];

  // One sub-composition per beat.
  //
  // This is not tidiness, it is a correctness fix. Every card, pill and panel is
  // its own overlay, and a single file carrying all scenes reaches ~47 heavy
  // overlays at once. HyperFrames' capture layer renders solid-black past
  // roughly the halfway point of a composition that dense (lint:
  // composition_heavy_overlay_count_high) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â which is exactly why
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
    const subId = `${slug}-b${i}`;
    // The anim bodies close over nothing but their own params, so they serialise
    // straight into the page as source. Function.prototype.toString() yields
    // shorthand-method source, which is not a valid expression, so re-declare it
    // as a function expression. toString() also drops closure scope, so each body
    // is wrapped in an IIFE that re-establishes every possible key from the literal
    // args object.
    const src = built.anim.toString().replace(/^\s*\w+\s*\(/, "function (");
    animSrc.push(`(function(A){const{${ALL_KEYS.join(",")}}=A;return (${src});})(${JSON.stringify(b.a)})`);

    const start = +(INTRO + b.t - (i === 0 ? 0 : LEAD)).toFixed(3);
    const nextT = i + 1 < seq.length ? seq[i + 1].t : seq[i].t + OUTRO;
    const dur = +(nextT - b.t + LEAD + (i + 1 < seq.length ? XF : 0)).toFixed(3);
    plan.push({
      i,
      sel: `.beat[data-b="${i}"]`,
      start,
      dur,
      tone: built.tone,
      name: built.name,
      blueprint: built.blueprint,
      type: built.type,
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
${built.html.replace(/(src=")assets\//g, `$1${subAssets}/`)}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      window.__timelines["${subId}"] = tl;
      const ANIM = ${animSrc[animSrc.length - 1]};
      const root = document.getElementById("root");
      ANIM(tl, 0, {
        q: (s) => root.querySelector(s),
        qq: (s) => Array.from(root.querySelectorAll(s)),
      });
      tl.seek(0);
    </script>
  </body>
</html>
`,
      "utf8",
    );

    mounts.push(
      `      <div class="clip beat" id="beat-${i}" data-b="${i}" data-composition-id="${slug}-b${i}" data-composition-src="${subSrc}${i}.html" data-start="${start}" data-duration="${dur}" data-track-index="${i + 1}"></div>`,
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

${mounts.join("\n")}

${captions(caps)}

      <div class="chapter" data-a="chapter">${plan.map((b) => `<i data-c="${b.i}"><b></b></i>`).join("")}</div>

      <audio id="${slug}-audio" src="assets/audio/${slug}.mp3" data-start="${INTRO}" data-duration="${audioDur.toFixed(3)}" data-has-audio="true" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      window.__timelines["${slug}"] = tl;

      const PLAN = ${JSON.stringify(plan)};
      const XF = ${XF};
      const LEAD = ${LEAD};
      const TOTAL = ${TOTAL.toFixed(3)};
      const OUTRO_END = TOTAL - 2.4;
      const root = document.getElementById("root");

      tl.to({}, { duration: TOTAL }, 0);

      const stages = Array.from(root.querySelectorAll(".stage"));
      const chips = Array.from(root.querySelectorAll(".chapter i b"));

      function toneAt(i) { return PLAN[i].tone; }

      // Stage colour, caption ink, dither palette and the chapter rail. The scene
      // bodies live in their own sub-compositions and time themselves; this is the
      // frame around them.
      PLAN.forEach((b, i) => {
        const st = stages[b.i];
        const tone = toneAt(i);
        if (st) {
          if (i === 0) tl.set(st, { opacity: 1 }, 0);
          else {
            tl.fromTo(st, { opacity: 0 }, { opacity: 1, duration: XF, ease: "power1.inOut" }, b.start);
            tl.to(stages[i - 1], { opacity: 0, duration: XF, ease: "power1.inOut" }, b.start);
          }
        }
        if (i > 0) {
          tl.call(() => {
            root.classList.toggle("tone-white", tone === "white");
            const dth = document.getElementById("dither");
            if (dth) dth.classList.toggle("on-white", tone === "white");
          }, null, b.start);
        }
        const chip = chips[i];
        if (chip) {
          tl.set(chip, { scaleX: 0 }, b.start);
          tl.to(chip, { scaleX: 1, duration: b.dur, ease: "none" }, b.start);
        }
      });

      // Crossfade the beats themselves. Scenes only animate IN, so without this
      // the XF overlap window shows the outgoing and incoming scene at full
      // opacity at the same time - two visual treatments stacked in one frame.
      Array.from(root.querySelectorAll(".beat")).forEach((el) => {
        const s = parseFloat(el.dataset.start);
        const d = parseFloat(el.dataset.duration);
        tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: XF, ease: "power1.inOut" }, s + d - XF);
      });

      Array.from(root.querySelectorAll(".cap")).forEach((c) => {
        const at = parseFloat(c.dataset.start);
        const sp = c.querySelector("span");
        if (sp) tl.fromTo(sp, { y: 16, scale: 0.97 }, { y: 0, scale: 1, duration: 0.22, ease: "power2.out" }, at);
      });

      tl.to(".cap", { opacity: 0, duration: 0.4 }, OUTRO_END - 0.1);
      tl.to(".chapter", { opacity: 0, duration: 0.4 }, OUTRO_END - 0.1);

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
