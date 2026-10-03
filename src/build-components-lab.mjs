// Emits compositions/components-lab.html: the table and its FAMILY, in 3D, with the pointer
// (docs/COMPONENTS.md section 9).
//
//   npm run lab:components      builds + points index.html at it
//   npm run render              renders renders/components-lab.mp4 (9 s)
//
// What it shows, in one composition:
//   - the main component, the TABLE (components/table), rising out of the screen: the card, the column
//     heads, then each row one at a time, its cells after it; the focus row lifts. The card is a panel
//     slab and every row a row slab (lkextrude DEPTH), so the sides show as the camera orbits.
//   - its FAMILY around it: satellites (components/satellite) placed by components/layout.mjs, the SAME
//     slots the films use, each a card + tile + icon + label of a real related object, extruded. There is
//     no decoration here: no numerals, no stray chips.
//   - the POINTER: arrow, open hand on hover, pointing hand on press, three 2 px rings on a click, aimed at
//     targets MEASURED from the laid-out table (offsetLeft/Top), never typed coordinates. It presses only
//     the main component, never a satellite.
//
// Every component is built through src/components/, the same call a film scene makes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { css } from "./lkchrome.mjs";
import { C, R } from "./lkdesign.mjs";
import { pointerRuntimeJS, LAB } from "./lkpointer.mjs";
import { fxModule, fxRuntimeJS } from "./lkfx.mjs";
import { extrudeCSS } from "./lkextrude.mjs";
import { componentRuntimeJS } from "./components/anatomy.mjs";
import { colorRuntimeJS } from "./lkcolor.mjs";
import { componentsCSS, get } from "./components/index.mjs";
import { LIFT_Z } from "./components/table/index.mjs";
import { familyScene } from "./components/family.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FX = fxModule();
const DUR = 9;

const TABLE = get("table");
const tableProps = { ...TABLE.sample, tone: "blue", focus: 1, extrude: true };

/** The family around the table: real related objects of agencyProspects, at the shared layout slots, with one ear. */
const fam = familyScene({ names: ["agencyLeads", "agencyCalls", "agencyCampaigns", "agencyOpportunities"], ear: "ear4", tone: "blue", back: true });
const sats = fam.sats, satHTML = fam.html, satSteps = fam.steps;

const colors = FX.ringColors("#FFFFFF", C.blue, C.blue);
const holders = [{ id: "t", x: -60, y: -60, z: -90, s: 0.84, html: TABLE.html(tableProps), steps: TABLE.steps(tableProps), at: 0.2 }];
const wrapHTML = holders.map((h) => `<div class="holder" id="h-${h.id}">${h.html}</div>`).join("\n        ");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>${css("assets")}${extrudeCSS}${componentsCSS}
.world{position:absolute;inset:0;transform-style:preserve-3d;z-index:20}
.holder{position:absolute;left:50%;top:50%;transform-style:preserve-3d}
/* the click rings are their own layer: above the elements (the world is z 20), directly under the pointer (z 95) */
.ringsc{position:absolute;left:0;top:0;width:1920px;height:1080px;z-index:90;pointer-events:none}
.cursor{z-index:95}
.hud{position:absolute;left:36px;bottom:30px;z-index:96;font:700 22px 'Satoshi',sans-serif;color:#fff;opacity:.85}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="components-lab" data-start="0" data-duration="${DUR}.000" data-width="1920" data-height="1080" data-fps="30">
      <div class="stages"><div class="stage" style="opacity:1"></div></div>
      <div id="dither"></div>
      <div class="world" id="world" data-layout-allow-overlap>
        ${wrapHTML}
        ${satHTML}
      </div>
      <canvas class="ringsc" id="rings" width="1920" height="1080" data-layout-allow-overlap></canvas>
      <div class="cursor" id="cur" data-layout-allow-overlap><i class="cs cs-n"></i><i class="cs cs-h"></i><i class="cs cs-c"></i></div>
      <div class="hud">components lab · the table and its family · extruded, in 3D</div>
    </div>
    <script>
      ${pointerRuntimeJS}
      ${fxRuntimeJS}
      ${componentRuntimeJS}
      ${colorRuntimeJS}
      const DUR = ${DUR}, FRONT = 70;
      const HOLDERS = ${JSON.stringify(holders.map((h) => ({ id: h.id, x: h.x, y: h.y, z: h.z, s: h.s, steps: h.steps, at: h.at })))};
      const SATS = ${JSON.stringify(sats.map((s, k) => ({ i: k, x: s.x, y: s.y, z: s.z })))};
      const SAT_STEPS = ${JSON.stringify(satSteps)};
      const RINGS = { count: 3, radius: 150, life: 0.62, stagger: 0.1, cell: 4, colors: ${JSON.stringify(colors)} };
      const ORBIT = ${JSON.stringify(LAB.orbit)};
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const root = document.getElementById("root"), world = document.getElementById("world");
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      window.__timelines["components-lab"] = tl;

      // 1. place each component in 3D, once. The holder is the placement; the component animates INSIDE it.
      const holder = {};
      HOLDERS.forEach((h) => { holder[h.id] = h; gsap.set("#h-" + h.id, { x: h.x, y: h.y, z: h.z, scale: h.s, xPercent: -50, yPercent: -50 }); });
      const qin = (id) => (sel) => Array.from(document.getElementById("h-" + id).querySelectorAll(sel));

      // the family stands around it at the shared layout slots (components/layout.mjs); centred on its slot
      SATS.forEach((s) => gsap.set('.sat[data-i="' + s.i + '"]', { x: s.x, y: s.y, z: s.z, xPercent: -50, yPercent: -50 }));
      __cmp.play(tl, (sel) => Array.from(root.querySelectorAll(sel)), SAT_STEPS, 0);

      // 2. every component enters by its own steps (the SAME runtime a film scene uses)
      HOLDERS.forEach((h) => __cmp.play(tl, qin(h.id), h.steps, h.at));
      // the focus row of the table lifts toward the camera once the rows have risen
      const focusRow = document.querySelector("#h-t .trow[data-i='${tableProps.focus}']");
      focusRow.style.background = focusRow.dataset.fill;
      // ACTIVATION: rows are flat in the card at rest; one lifts (its slab shows under it) only while the hand is on it
      // (set up below, from the same events that move the pointer) and settles back after.

      // 3. MEASURE where things are (layout offsets, never typed coordinates) and aim the pointer at them
      function centreOf(id, el) {
        const h = holder[id], host = document.getElementById("h-" + id);
        let x = 0, y = 0, n = el;
        while (n && n !== host) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
        const ox = x + el.offsetWidth / 2 - host.offsetWidth / 2, oy = y + el.offsetHeight / 2 - host.offsetHeight / 2;
        return { x: h.x + ox * h.s, y: h.y + oy * h.s, z: h.z + FRONT };
      }
      const rows = Array.from(document.querySelectorAll("#h-t .trow"));
      const ev = (arrive, p, click, zoom) => Object.assign({ t0: arrive - 0.6, tA: arrive, tB: arrive + (click ? 0.4 : 0.3), t1: arrive + (click ? 0.4 : 0.3) + 0.55, p, zoom }, click ? { click: arrive + 0.2 } : { circle: { r: 60, period: 1.0 } });
      const EVENTS = [
        ev(3.0, centreOf("t", rows[0]), false, 1.7),
        ev(4.4, centreOf("t", rows[${tableProps.focus}]), true, 2.0),
        ev(5.8, centreOf("t", rows[2]), false, 1.7),
        ev(7.2, centreOf("t", rows[2]), true, 2.0),
      ];
      // ONE pure function of time per row (lkspring track): hovering from row to row just sums, any seek order gives the
      // same frame, and a row can never dip behind the card. Activation starts after the entrance has finished (asserted).
      const rowIdx = [0, ${tableProps.focus}, 2, 2];
      const byRow = {};
      EVENTS.forEach((e, i) => { (byRow[rowIdx[i]] = byRow[rowIdx[i]] || []).push([e.tA, 1], [e.tB + 0.25, 0]); });
      const ENTRANCE_END = ${TABLE.rowAt(2) + 0.2 + 1.0};
      if (EVENTS[0].tA < ENTRANCE_END) throw new Error("activation starts before the table has finished rising");
      __cmp.activate(tl, (sel) => Array.from(document.querySelectorAll("#h-t " + sel)), { rows: Object.keys(byRow).map((r) => ({ sel: '.trow[data-i="' + r + '"]', keys: byRow[r] })), lift: ${LIFT_Z}, grow: 0.02 });
      const M = __ptr.build({ orbit: ORBIT, events: EVENTS });

      // 4. ONE tween drives camera + pointer + rings: pure functions of t, so a seek anywhere is exact
      const cur = document.getElementById("cur"), rc = document.getElementById("rings"), rctx = rc.getContext("2d");
      const nS = cur.querySelector(".cs-n"), hS = cur.querySelector(".cs-h"), cS = cur.querySelector(".cs-c");
      gsap.set(cur, { transformOrigin: "0px 0px" });
      let last = null;
      const clock = { t: 0 };
      tl.to(clock, {
        t: DUR, duration: DUR, ease: "none",
        onUpdate() {
          const t = clock.t, c = M.cameraAt(t, 0);
          gsap.set(world, { transformPerspective: 1600, transformOrigin: "50% 50%", x: c.x, y: c.y, z: c.z, rotationX: c.rotationX, rotationY: c.rotationY });
          const pr = __ptr.project(M.pointerAt(t), c), a = __ptr.project(M.pointerAt(t - 0.02), c), b = __ptr.project(M.pointerAt(t + 0.02), c);
          const s = M.stateAt(t);
          gsap.set(cur, { x: pr.x, y: pr.y, rotation: clamp(-((b.x - a.x) / 0.04) / 70, -18, 18), scale: pr.k * (s === "c" ? 0.84 : 1) });
          // swap-ok: the three sprites are swapped, never faded
          if (s !== last) { nS.style.opacity = s === "n" ? 1 : 0; hS.style.opacity = s === "h" ? 1 : 0; cS.style.opacity = s === "c" ? 1 : 0; last = s; }
          rctx.clearRect(0, 0, 1920, 1080);
          EVENTS.forEach((e) => {
            if (e.click == null) return;
            const age = t - e.click;
            if (age < 0 || age > RINGS.life + RINGS.stagger * RINGS.count) return;
            const q = __ptr.project(e.p, c);
            __fx2.drawRings(rctx, age, Object.assign({ x: q.x, y: q.y, k: q.k }, RINGS));
          });
        },
      }, 0);
      // THE LIP: derived at render time from each slab host's own computed colour, in OKLCH (lkcolor.mjs)
      __lip.apply(root);
      tl.seek(0);
    </script>
  </body>
</html>
`;

fs.writeFileSync(path.join(ROOT, "compositions", "components-lab.html"), html, "utf8");
if (process.argv.includes("--entry")) {
  fs.copyFileSync(path.join(ROOT, "compositions", "components-lab.html"), path.join(ROOT, "index.html"));
  console.log("✓ index.html -> compositions/components-lab.html");
}
console.log(JSON.stringify({ lab: "components-lab", duration: DUR, holders: holders.length }));
