// Emits a transition demo (docs/TRANSITION_FX.md): two compositions joined by a transition chosen by name
// from src/transitions/.
//
//   npm run lab:transition                 the default: pixel-wipe
//   npm run lab:transition -- scale-swap   any registered transition
//   npm run render
//
// Writes compositions/<slug>.html plus compositions/<slug>/a.html (the pointer lab) and b.html (cards),
// where <slug> is "transition-demo" for the default and "transition-demo-<id>" for the others.
//
// What it demonstrates, in one 10-second film:
//   - TWO real compositions, mounted like the beats of a film, joined by one transition, called by name;
//   - the transition's PHASES in their declared order (ramp-out > flash > sweep > ramp-in for the pixel wipe);
//   - the SPEED RAMP, twice over: every scene runs on tau(t) (the clock accelerates into the cut, via an
//     inner/master timeline pair that works on any GSAP scene), AND the camera RUSHES at the scene, so the
//     transition itself reads as a speed ramp;
//   - EXTRUSION: the dots and cards are slabs with thickness, not paper-thin planes in 3D;
//   - the pixel wipe as a MASK: composition B is clipped to a sweep of pixel windows, so it is revealed
//     THROUGH composition A (a J-cut: B is already playing, A still visible, until the sweep completes);
//   - the POINTER lives in the PARENT, above every transition layer, so it is NEVER hidden by a transition;
//   - the CLICK is three 8-bit pixel rings (white core, blue stroke, black outline) on their own layer: above the elements, directly under the pointer.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { css } from "./lkchrome.mjs";
import { C, R } from "./lkdesign.mjs";
import { icon } from "./lkicons.mjs";
import * as TABLE from "./components/table/index.mjs";
import { familyScene } from "./components/family.mjs";
import { componentRuntimeJS } from "./components/anatomy.mjs";
import { colorRuntimeJS } from "./lkcolor.mjs";
import { componentsCSS } from "./components/index.mjs";
import { springRuntimeJS } from "./lkspring.mjs";
import { pointerRuntimeJS, LAB } from "./lkpointer.mjs";
import { fxRuntimeJS } from "./lkfx.mjs";
import { slab, extrudeCSS } from "./lkextrude.mjs";
import { makeDemo, demoSpec, rowPeakReal, innerTime, rowEntranceEnd } from "./lkdemo.mjs";
import { fxModule } from "./lkfx.mjs";
const warpOf = (demo) => fxModule().makeWarp(demo.warp);
import { Z } from "./transitions/common.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "compositions");

export function buildDemo(id) {
  const DEMO = makeDemo(id);
  const T = DEMO.transition;
  const slug = id === "pixel-wipe" ? "transition-demo" : `transition-demo-${id}`;
  const SUB = path.join(OUT, slug);
  fs.mkdirSync(SUB, { recursive: true });

  const FLOOR = 430;
  const RED = DEMO.colors.dot;
  const SPEC = demoSpec(DEMO);
  const aDur = DEMO.aEnd;
  const bDur = +(DEMO.duration - DEMO.bStart).toFixed(3);
  const idA = `${slug}-a`, idB = `${slug}-b`;
  const part = T.parent({ params: DEMO.params, W: 1920, H: 1080 });

  /** What a composition shares: the model (for the CAMERA only; the pointer is the parent's), the warp, the
   *  rush and the inner/master pair. */
  const shared = (id, offset, dur) => `
      ${componentRuntimeJS}
      ${colorRuntimeJS}
      ${pointerRuntimeJS}
      ${fxRuntimeJS}
      const SPEC = ${JSON.stringify(SPEC)};
      const WARP = __fx2.makeWarp(${JSON.stringify(DEMO.warp)});
      const RUSH = ${JSON.stringify(DEMO.rush)};
      const FLASH = ${JSON.stringify(DEMO.params.flash)};
      const OFFSET = ${offset};          // this composition's start on the film's clock
      const M = __ptr.build(SPEC);       // ONE model for the whole film, evaluated on tau
      const TAU0 = WARP.tau(OFFSET);     // where on tau this composition begins
      const root = document.getElementById("root");
      // scoped queries, never page-global ids: A and B are mounted in one page
      const world = root.querySelector(".world");
      const inner = gsap.timeline({ paused: true });   // the scene's OWN timeline (what a beat already is)
      const master = gsap.timeline({ paused: true });  // what the runtime sees: it drives inner on tau
      window.__timelines = window.__timelines || {};
      window.__timelines["${id}"] = master;
      let ZOOM_ADD = 0;
      /** the camera, at inner time it (the pointer and the rings are drawn by the parent) */
      function frame(it) {
        const c = M.cameraAt(TAU0 + it, ZOOM_ADD);
        gsap.set(world, { transformPerspective: 1600, transformOrigin: "50% 50%", x: c.x, y: c.y, z: c.z, rotationX: c.rotationX, rotationY: c.rotationY });
      }
      const drive = { t: 0 };
      master.to(drive, {
        t: ${dur}, duration: ${dur}, ease: "none",
        onUpdate() {
          const tg = drive.t + OFFSET;
          // no rush here: the speed ramp's zoom belongs to the ADJUSTMENT LAYER in the parent, so it scales
          // the composite (A, B and the wipe mask together) instead of each composition on its own
          inner.time(WARP.tau(tg) - TAU0, false);
        },
      }, 0);
`;

  const baseCSS = css("assets", "transparent") + extrudeCSS + `
.world{position:absolute;inset:0;transform-style:preserve-3d;z-index:20}
`;

  /* ------------------------------------------------------------------------------------ A */

  // no colour: the lip of a red dot is a deeper red, derived at render time from the dot's own colour (lkcolor.mjs)
  const DOT_SLAB = { layers: 8, step: 4, round: true, grow: { top: 4, right: 4, bottom: 4, left: 4 } };
  const aDots = LAB.dots
    .map((d, i) => `
      <div class="drop" data-i="${i}" style="height:${FLOOR - d.y}px"></div>
      <div class="fring" data-i="${i}"></div>
      <div class="dot x3d" data-i="${i}">${slab(DOT_SLAB)}<span>${i + 1}</span></div>`)
    .join("");

  const aHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>${baseCSS}
.floor{position:absolute;left:50%;top:50%;width:3600px;height:3600px;margin:-1800px 0 0 -1800px;
 background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.30) 0 2px,transparent 2px 120px),
  repeating-linear-gradient(90deg,rgba(255,255,255,.30) 0 2px,transparent 2px 120px)}
.dot{position:absolute;left:50%;top:50%;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;
 background:${RED};box-shadow:inset 0 0 0 4px #FF8F89,0 0 0 4px ${C.outline};
 display:flex;align-items:center;justify-content:center;font:900 44px 'Satoshi',sans-serif;color:#fff}
.drop{position:absolute;left:50%;top:50%;width:3px;margin-left:-1.5px;background:rgba(255,255,255,.55);transform-origin:50% 0}
.fring{position:absolute;left:50%;top:50%;width:130px;height:130px;margin:-65px 0 0 -65px;border-radius:50%;border:3px solid rgba(255,255,255,.75)}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${idA}" data-start="0" data-duration="${aDur}" data-width="1920" data-height="1080" data-fps="30">
      <div class="world">
        <div class="floor"></div>${aDots}
      </div>
    </div>
    <script>${shared(idA, 0, aDur)}
      const DOTS = ${JSON.stringify(LAB.dots)};
      gsap.set(".floor", { y: ${FLOOR}, rotationX: 90, transformOrigin: "50% 50%" });
      DOTS.forEach((d, i) => {
        gsap.set('.dot[data-i="' + i + '"]', { x: d.x, y: d.y, z: d.z });
        gsap.set('.drop[data-i="' + i + '"]', { x: d.x, y: d.y, z: d.z });
        gsap.set('.fring[data-i="' + i + '"]', { x: d.x, y: ${FLOOR}, z: d.z, rotationX: 90 });
      });
      // the dots ENTER by scale 0 -> 1 with overshoot, staggered, and react when the pointer arrives
      DOTS.forEach((d, i) => inner.fromTo('.dot[data-i="' + i + '"]', { scale: 0 }, { scale: 1, duration: 0.5, ease: __spr.snap }, 0.05 + 0.07 * i));
      inner.fromTo(".drop, .fring", { scale: 0 }, { scale: 1, duration: 0.4, ease: __spr.pop, stagger: 0.03 }, 0.1);
      SPEC.events.filter((e) => e.side === "a").forEach((e) => {
        const dot = '.dot[data-i="' + e.dot + '"]';
        inner.to(dot, { scale: 1.14, duration: 0.25, ease: "power2.out" }, e.tA);
        inner.to(dot, { scale: 1, duration: 0.5, ease: "power2.inOut" }, e.tA + 0.25);
        if (e.click != null) {
          inner.to(dot, { scale: 1.3, duration: 0.1, ease: "power2.out" }, e.click);
          inner.to(dot, { scale: 1.1, duration: 0.45, ease: __spr.snap }, e.click + 0.1);
        }
      });
      inner.to({ t: 0 }, { t: 14, duration: 14, ease: "none", onUpdate() { frame(inner.time()); } }, 0);
      // THE LIP: derived at render time from each slab host's own computed colour, in OKLCH (lkcolor.mjs)
      __lip.apply(root);
      master.seek(0);
    </script>
  </body>
</html>
`;

  /* ------------------------------------------------------------------------------------ B */

  // B is the TABLE component rising row by row (each row an owned slab that lifts out of the card), with its FAMILY
  // around it (components/family: satellites + an ear at the shared layout slots). Same call a film scene makes.
  const tProps = { ...TABLE.sample, tone: DEMO.table.tone, focus: 1, extrude: true };
  const fam = familyScene({ ...DEMO.family, back: true });
  // ACTIVATION must not overlap the entrance: both write the row's z and scale, so a hover may start only after the row
  // has finished rising and settled flat (asserted at build)
  for (const e of DEMO.bEvents) {
    const start = innerTime(DEMO, e.arrive), end = rowEntranceEnd(DEMO, e.row); // the first activation key lands at the hand's ARRIVAL
    if (start < end) throw new Error(`activation of row ${e.row} starts at inner ${start}s, before its entrance has finished at ${end}s`);
  }
  // THE PEAK RULE, asserted at build: the hand lands on a row only after that row's mass has peaked (real time)
  for (const e of DEMO.bEvents) {
    const peak = rowPeakReal(DEMO, e.row);
    if (e.arrive < peak) throw new Error(`peak rule: the hand lands on row ${e.row} at ${e.arrive}s, before its overshoot peak at ${peak}s`);
  }

  const bHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>${baseCSS}${componentsCSS}
.holder{position:absolute;left:50%;top:50%;transform-style:preserve-3d}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${idB}" data-start="0" data-duration="${bDur}" data-width="1920" data-height="1080" data-fps="30">
      <div class="world">
        <div class="holder" id="h-t">${TABLE.html(tProps)}</div>
        ${fam.html}
      </div>
    </div>
    <script>${shared(idB, DEMO.bStart, bDur)}
      const T = ${JSON.stringify(DEMO.table)};
      const TSTEPS = ${JSON.stringify(TABLE.steps(tProps))};
      const SATS = ${JSON.stringify(fam.sats.map((s) => ({ i: s.i, x: s.x, y: s.y, z: s.z })))};
      const SAT_STEPS = ${JSON.stringify(fam.steps)};
      const qq = (sel) => Array.from(root.querySelectorAll(sel));
      // place once, in 3D: the table's holder and the family at the shared layout slots
      gsap.set("#h-t", { x: T.x, y: T.y, z: T.z, scale: T.s, xPercent: -50, yPercent: -50 });
      SATS.forEach((s) => gsap.set('.sat[data-i="' + s.i + '"]', { x: s.x, y: s.y, z: s.z, xPercent: -50, yPercent: -50 }));
      // every component enters by its own steps (the SAME runtime a film scene uses): springs, scale only
      __cmp.play(inner, qq, TSTEPS, T.at);
      __cmp.play(inner, qq, SAT_STEPS, 0);
      const focus = qq(".trow[data-i='1']")[0];
      focus.style.background = focus.dataset.fill;
      // ACTIVATION: a row is FLAT in the card at rest. It lifts (its lip shows under it) only while the hand is on it (hover or
      // press) and settles back after. ONE pure function of time per row (lkspring track): overlapping hovers (row to row)
      // just sum, any seek order gives the same frame, and the row can never dip behind the card (clamped, settle spring).
      const ACT = ${JSON.stringify(Object.values(DEMO.bEvents.reduce((m, e, i) => { const sp = SPEC.events.filter((x) => x.side === "b")[i]; (m[e.row] = m[e.row] || { sel: '.trow[data-i="' + e.row + '"]', keys: [] }).keys.push([+(sp.tA - warpOf(DEMO).tau(DEMO.bStart)).toFixed(3), 1], [+(sp.tB + 0.25 - warpOf(DEMO).tau(DEMO.bStart)).toFixed(3), 0]); return m; }, {})))};
      __cmp.activate(inner, qq, { rows: ACT, lift: ${TABLE.LIFT_Z}, grow: 0.02 });
      inner.to({ t: 0 }, { t: 14, duration: 14, ease: "none", onUpdate() { frame(inner.time()); } }, 0);
      // THE LIP: derived at render time from each slab host's own computed colour, in OKLCH (lkcolor.mjs)
      __lip.apply(root);
      master.seek(0);
    </script>
  </body>
</html>
`;

  /* -------------------------------------------------------------------------------- parent */

  // two dithers, one per group (the one #dither id cannot be used twice)
  const dither = (css("assets").match(/#dither[^{]*\{[^}]*\}/g) || []).map((r) => r.replace(/#dither/g, ".dither")).join("\n");

  const parent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>${css("assets")}
${dither}
.adj{position:absolute;inset:0;z-index:10;transform-origin:50% 50%}
.grp{position:absolute;inset:0}
.grp .stage{position:absolute;inset:0}
${part.css}
/* THE LAYER ORDER, bottom to top: the composite (the adjustment layer: stage, dither, the 3D elements), the CLICK
   RINGS (their own full-screen layer), the POINTER. The rings sit directly under the pointer, above every element and
   outside both groups and the adjustment layer, so they PERSIST THROUGH A TRANSITION: a wipe or a flash never
   clips or covers them, exactly like the pointer. */
.ringsc{position:absolute;left:0;top:0;width:1920px;height:1080px;z-index:${Z.rings};pointer-events:none}
.cursor{z-index:${Z.pointer}}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${slug}" data-start="0" data-duration="${DEMO.duration}.000" data-width="1920" data-height="1080" data-fps="30">
      <div class="adj" id="adj" data-layout-allow-overlap>
      <div class="grp" id="gA" style="z-index:10;${part.groupAStyle}">
        <div class="stage"></div><div class="dither"></div>
        <div class="clip" id="${idA}" data-composition-id="${idA}" data-composition-src="compositions/${slug}/a.html" data-start="0" data-duration="${aDur}" data-track-index="1" data-layout-allow-overlap></div>
      </div>
      <div class="grp" id="gB" style="z-index:20;${part.groupBStyle}">
        <div class="stage white"></div><div class="dither on-white"></div>
        <div class="clip" id="${idB}" data-composition-id="${idB}" data-composition-src="compositions/${slug}/b.html" data-start="${DEMO.bStart}" data-duration="${bDur}" data-track-index="2" data-layout-allow-overlap></div>
      </div>
      ${part.html}
      </div>
      <canvas class="ringsc" id="rings" width="1920" height="1080" data-layout-allow-overlap></canvas>
      <div class="cursor" id="cur" data-layout-allow-overlap><i class="cs cs-n"></i><i class="cs cs-h"></i><i class="cs cs-c"></i></div>
    </div>
    <script>
      ${springRuntimeJS}
      ${pointerRuntimeJS}
      ${fxRuntimeJS}
      const SPEC = ${JSON.stringify(SPEC)};
      const WARP = __fx2.makeWarp(${JSON.stringify(DEMO.warp)});
      const RUSH = ${JSON.stringify(DEMO.rush)};
      const RINGS = ${JSON.stringify(DEMO.rings)};
      const SEAM = ${DEMO.seam};
      const M = __ptr.build(SPEC);
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      window.__timelines["${slug}"] = tl;
      const gA = document.getElementById("gA"), gB = document.getElementById("gB");
      const adj = document.getElementById("adj");
      const flashEl = document.getElementById("flash"); // present only for transitions that use a flash layer
      const cur = document.getElementById("cur");
      const nS = cur.querySelector(".cs-n"), hS = cur.querySelector(".cs-h"), cS = cur.querySelector(".cs-c");
      const rctx = document.getElementById("rings").getContext("2d");
      gsap.set(cur, { transformOrigin: "0px 0px" });
      // ---- the transition's own setup (src/transitions/${id}.mjs)${part.setupJS}
      let last = null;
      const drive = { t: 0 };
      tl.to(drive, {
        t: ${DEMO.duration}, duration: ${DEMO.duration}, ease: "none",
        onUpdate() {
          const t = drive.t, tau = WARP.tau(t);
          // ---- the transition's per-frame work (src/transitions/${id}.mjs)${part.frameJS}
          // the camera, as the compositions have it (same model, same tau, same recoil, same rush)
          // the ADJUSTMENT LAYER: one scale for the whole composite (the speed ramp's rush + the recoil)
          const zs = 1 + __fx2.kickAt(t - (SEAM + __fx2.FLASH.attack)) + __fx2.rushAt(t, RUSH);
          gsap.set(adj, { scale: zs });
          const c = M.cameraAt(tau, 0);
          const sx = (q) => ({ x: 960 + (q.x - 960) * zs, y: 540 + (q.y - 540) * zs, k: q.k * zs });
          // the POINTER: projected through that camera onto the screen, on the topmost layer
          const p = M.pointerAt(tau), pr = sx(__ptr.project(p, c));
          const a = sx(__ptr.project(M.pointerAt(tau - 0.02), c)), b = sx(__ptr.project(M.pointerAt(tau + 0.02), c));
          const s = M.stateAt(tau);
          gsap.set(cur, { x: pr.x, y: pr.y, rotation: clamp(-((b.x - a.x) / 0.04) / 70, -18, 18), scale: pr.k * (s === "c" ? 0.84 : 1) });
          // swap-ok: the three sprites are swapped, never faded
          if (s !== last) { nS.style.opacity = s === "n" ? 1 : 0; hS.style.opacity = s === "h" ? 1 : 0; cS.style.opacity = s === "c" ? 1 : 0; last = s; }
          // the CLICK: three pixel rings on THEIR OWN LAYER: above every element, directly under the pointer, outside the
          // adjustment layer (so a transition cannot clip or cover them). Glued to the item through the camera AND the
          // adjustment layer's zoom (sx), like the pointer.
          rctx.clearRect(0, 0, 1920, 1080);
          SPEC.events.forEach((e) => {
            if (e.click == null) return;
            const age = tau - e.click;
            if (age < 0 || age > RINGS.life + RINGS.stagger * RINGS.count) return;
            const q = sx(__ptr.project(e.p, c));
            __fx2.drawRings(rctx, age, Object.assign({ x: q.x, y: q.y, k: q.k, colors: e.rings }, RINGS));
          });
        },
      }, 0);
      tl.seek(0);
    </script>
  </body>
</html>
`;

  fs.writeFileSync(path.join(SUB, "a.html"), aHtml, "utf8");
  fs.writeFileSync(path.join(SUB, "b.html"), bHtml, "utf8");
  fs.writeFileSync(path.join(OUT, `${slug}.html`), parent, "utf8");
  return { demo: slug, transition: id, order: T.semantics.order, jcut: T.semantics.jcut, duration: DEMO.duration, seam: DEMO.seam, a: aDur, b: bDur, bStart: DEMO.bStart, events: SPEC.events.length };
}

// run directly: node src/build-demo.mjs [transition-id]
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const id = args.find((a) => !a.startsWith("--")) || "pixel-wipe";
  const info = buildDemo(id);
  console.log(JSON.stringify(info));
  // --entry points index.html at the demo (what scripts/entry.mjs does for the films), so `npm run render` renders it.
  // Without it nothing outside compositions/ is touched, which is what the pre-commit hook needs.
  if (args.includes("--entry")) {
    fs.copyFileSync(path.join(OUT, `${info.demo}.html`), path.join(ROOT, "index.html"));
    console.log(`✓ index.html -> compositions/${info.demo}.html`);
  }
}
