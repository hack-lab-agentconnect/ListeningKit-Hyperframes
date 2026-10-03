// Emits compositions/pointer-lab.html: the 5-second pointer lab (docs/POINTER_MOTION.md section 4).
//
// Five red dots at five depths in a 3D scene, a floor grid and a drop-line under each so depth is
// legible, and the pointer carrying through it on its orbit, pointing at dots 1, 3, 5 and clicking
// 2 and 4, with the camera trailing it. It is built from src/lkpointer.mjs, the SAME model the
// films will use: `pointerAt(t)` / `cameraAt(t)` are evaluated inside one tween's onUpdate, so the
// page holds no state and a seek anywhere is exact.
//
//   npm run lab:pointer                      builds + points index.html at it
//   npm run render                           renders renders/<name>.mp4 (5 s)
//   npm run review -- --slug pointer-lab --at 0.5,1.0,1.5   frames, outside the repo

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { css } from "./lkchrome.mjs";
import { C } from "./lkdesign.mjs";
import { springRuntimeJS } from "./lkspring.mjs";
import { pointerRuntimeJS, LAB } from "./lkpointer.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FLOOR = 430; // y of the floor plane, px below the frame centre
const RED = "#E5322D";

const dots = LAB.dots
  .map(
    (d, i) => `
      <div class="drop" data-i="${i}" style="height:${FLOOR - d.y}px"></div>
      <div class="fring" data-i="${i}"></div>
      <div class="dot" data-i="${i}">${i + 1}</div>`,
  )
  .join("");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>${css("assets")}
/* ---- the lab world: a 3D context the camera moves through */
.world{position:absolute;inset:0;transform-style:preserve-3d;z-index:20}
.floor{position:absolute;left:50%;top:50%;width:3600px;height:3600px;margin:-1800px 0 0 -1800px;
 background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.30) 0 2px,transparent 2px 120px),
  repeating-linear-gradient(90deg,rgba(255,255,255,.30) 0 2px,transparent 2px 120px)}
.dot{position:absolute;left:50%;top:50%;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;
 background:${RED};box-shadow:inset 0 0 0 4px #FF8F89,0 0 0 4px ${C.outline};
 display:flex;align-items:center;justify-content:center;font:900 44px 'Satoshi',sans-serif;color:#fff}
.drop{position:absolute;left:50%;top:50%;width:3px;margin-left:-1.5px;background:rgba(255,255,255,.55);transform-origin:50% 0}
.fring{position:absolute;left:50%;top:50%;width:130px;height:130px;margin:-65px 0 0 -65px;border-radius:50%;
 border:3px solid rgba(255,255,255,.75)}
.hud{position:absolute;left:36px;bottom:30px;z-index:90;font:700 22px 'Satoshi',sans-serif;color:#fff;opacity:.85}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="pointer-lab" data-start="0" data-duration="${LAB.duration}.000" data-width="1920" data-height="1080" data-fps="30">
      <div class="stages"><div class="stage" style="opacity:1"></div></div>
      <div id="dither"></div>
      <div class="world" id="world">
        <div class="floor" id="floor"></div>${dots}
        <div class="ripple on-blue" id="rip"></div>
        <div class="cursor" id="cur"><i class="cs cs-n"></i><i class="cs cs-h"></i><i class="cs cs-c"></i></div>
      </div>
      <div class="hud">pointer lab · 5 dots at z −620 … +330 · camera trails the pointer</div>
    </div>
    <script>
      ${springRuntimeJS}
      ${pointerRuntimeJS}
      const SPEC = ${JSON.stringify(LAB.spec())};
      const DOTS = ${JSON.stringify(LAB.dots)};
      const FRONT = ${LAB.front}, FLOOR = ${FLOOR}, DUR = ${LAB.duration};
      const M = __ptr.build(SPEC);
      const root = document.getElementById("root");
      const world = document.getElementById("world");
      const cur = document.getElementById("cur");
      const rip = document.getElementById("rip");
      const nS = cur.querySelector(".cs-n"), hS = cur.querySelector(".cs-h"), cS = cur.querySelector(".cs-c");
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      window.__timelines["pointer-lab"] = tl;

      // static scene: floor plane, dots, drop-lines and floor rings, each placed once in 3D
      gsap.set("#floor", { y: FLOOR, rotationX: 90, transformOrigin: "50% 50%" });
      DOTS.forEach((d, i) => {
        gsap.set('.dot[data-i="' + i + '"]', { x: d.x, y: d.y, z: d.z });
        gsap.set('.drop[data-i="' + i + '"]', { x: d.x, y: d.y, z: d.z });
        gsap.set('.fring[data-i="' + i + '"]', { x: d.x, y: FLOOR, z: d.z, rotationX: 90 });
      });
      gsap.set(cur, { transformOrigin: "0px 0px" });

      // a dot reacts when the pointer arrives (a pulse) and when it is clicked (a pop)
      SPEC.events.forEach((e) => {
        const dot = '.dot[data-i="' + e.dot + '"]';
        tl.to(dot, { scale: 1.14, duration: 0.25, ease: "power2.out" }, e.tA);
        tl.to(dot, { scale: 1, duration: 0.5, ease: "power2.inOut" }, e.tA + 0.25);
        if (e.click != null) {
          tl.to(dot, { scale: 1.45, duration: 0.1, ease: "power2.out" }, e.click);
          tl.to(dot, { scale: 1.1, duration: 0.45, ease: __spr.snap }, e.click + 0.1);
          tl.set(rip, { x: 960 + e.p.x - 40, y: 540 + e.p.y - 40, z: e.p.z, scale: 0.2, opacity: 0.95 }, e.click);
          tl.to(rip, { scale: 1.9, opacity: 0, duration: 0.6, ease: "power2.out" }, e.click);
        }
      });

      // ONE tween drives the pointer and the camera: both are pure functions of t
      const clock = { t: 0 };
      let last = null;
      tl.to(clock, {
        t: DUR, duration: DUR, ease: "none",
        onUpdate() {
          const t = clock.t;
          const p = M.pointerAt(t), q1 = M.pointerAt(t - 0.02), q2 = M.pointerAt(t + 0.02);
          const vx = (q2.x - q1.x) / 0.04;
          const s = M.stateAt(t);
          gsap.set(cur, { x: 960 + p.x, y: 540 + p.y, z: p.z, rotation: clamp(-vx / 70, -18, 18), scale: s === "c" ? 0.84 : 1, opacity: 1 });
          if (s !== last) { nS.style.opacity = s === "n" ? 1 : 0; hS.style.opacity = s === "h" ? 1 : 0; cS.style.opacity = s === "c" ? 1 : 0; last = s; }
          const c = M.cameraAt(t);
          gsap.set(world, { transformPerspective: 1600, transformOrigin: "50% 50%", x: c.x, y: c.y, z: c.z, rotationX: c.rotationX, rotationY: c.rotationY });
        },
      }, 0);
      tl.seek(0);
    </script>
  </body>
</html>
`;

fs.writeFileSync(path.join(ROOT, "compositions", "pointer-lab.html"), html, "utf8");
console.log(JSON.stringify({ lab: "pointer-lab", duration: LAB.duration, dots: LAB.dots.length, events: LAB.events().length }));
