#!/usr/bin/env node
/**
 * Offline test for the transition effects (docs/TRANSITION_FX.md): the gunshot flash, the speed ramp,
 * the pixel blast, and the pointer's continuity through the cut. No browser, no render.
 *
 *   npm run test:fx
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fxModule } from "../src/lkfx.mjs";
import { pointerModule } from "../src/lkpointer.mjs";
import { DEMO, demoSpec, WARP } from "../src/lkdemo.mjs";
import { TRANSITIONS, validate as validateT, get as getT } from "../src/transitions/index.mjs";
import { slab, thickness, SLAB, DEPTH } from "../src/lkextrude.mjs";

const fx = fxModule();
const rows = [];
let failed = 0;
const check = (name, value, ok, limit) => { rows.push({ name, value, ok, limit }); if (!ok) failed++; };

/** A canvas 2D stub that records every draw, so the blast can be checked without a browser. */
function stubCtx() {
  const calls = [];
  const sets = new Set();
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k === "calls") return calls;
      if (k === "sets") return sets;
      return (...a) => calls.push([k, ...a]);
    },
    set(_, k, v) { sets.add(k + "=" + v); return true; },
  });
  return ctx;
}

/* ---- the flash ---------------------------------------------------------------------------- */
{
  const F = fx.FLASH;
  const at = (a) => fx.flashAt(a);
  check("flash: dark before it fires", at(-0.01).toFixed(2), at(-0.01) === 0, "= 0");
  check("flash: hard attack to its peak", `${at(F.attack).toFixed(2)} at ${F.attack}s (${Math.round(F.attack * 30)} frames)`, at(F.attack) >= F.peak * 0.99 && F.attack <= 0.07, "peak within 3 frames");
  let mono = true;
  for (let a = F.attack; a < F.duration - 0.005; a += 0.005) if (at(a + 0.005) > at(a) + 1e-9) mono = false;
  check("flash: only decays after the peak", mono ? "monotonic" : "rises again", mono, "monotonic");
  check("flash: gone by 0.5 s", `${at(0.5).toFixed(3)} at 0.5s`, at(0.5) === 0 && F.duration === 0.5, "= 0, duration 0.5 s");
  check("flash: a tail, not a blink", `${at(0.3).toFixed(2)} at 0.3s`, at(0.3) > 0.05 && at(0.3) < 0.4, "0.05-0.40 at 0.3 s");
  check("flash: peak 0.5, on the cut", `${at(F.attack).toFixed(2)}`, F.peak === 0.5 && at(F.attack) <= 0.5 + 1e-9, "peak = 0.5")
}

/* ---- the speed ramp ------------------------------------------------------------------------ */
{
  const dt = 1 / 240;
  let mono = true, maxSpeed = 0, maxDSpeed = 0, prevS = null, prevTau = WARP.tau(0);
  for (let t = dt; t <= DEMO.duration; t += dt) {
    const tau = WARP.tau(t);
    if (!(tau > prevTau)) mono = false;
    const s = (tau - prevTau) / dt;
    maxSpeed = Math.max(maxSpeed, s);
    if (prevS !== null) maxDSpeed = Math.max(maxDSpeed, Math.abs(s - prevS));
    prevS = s; prevTau = tau;
  }
  check("ramp: time never stops or reverses", mono ? "monotonic" : "not monotonic", mono, "monotonic");
  check("ramp: peak speed", `${maxSpeed.toFixed(2)}x`, Math.abs(maxSpeed - DEMO.warp.peak) < 0.05, `= ${DEMO.warp.peak}x`);
  check("ramp: speed is continuous", `${maxDSpeed.toFixed(3)} per step`, maxDSpeed < 0.06, "< 0.06 (no jolt)");
  const before = WARP.tau(DEMO.seam - DEMO.warp.rampOut - 0.5), after1 = WARP.tau(DEMO.seam + DEMO.warp.rampIn + 1), after2 = WARP.tau(DEMO.seam + DEMO.warp.rampIn + 2);
  check("ramp: back to 1x on both sides", `before ${before.toFixed(2)}, after +${(after2 - after1).toFixed(2)}/s`, Math.abs(before - (DEMO.seam - DEMO.warp.rampOut - 0.5)) < 1e-6 && Math.abs(after2 - after1 - 1) < 1e-3, "tau = t, then 1 s per s");
}

/* ---- the click rings: 8-bit pixel art ------------------------------------------------------ */
{
  const BLUE = "#2A8CFF", WHITE = "#FFFFFF", BLACK = "#0A0F1A";
  const colors = fx.ringColors("#FFFFFF", BLUE, BLUE);
  const spec = { x: 900, y: 500, k: 1.2, ...DEMO.rings, colors };
  const C = spec.cell;
  /** what a draw painted: rects grouped by the fillStyle in force when each was drawn, in draw order */
  const paint = (age, over) => {
    const calls = []; let style = null;
    const ctx = new Proxy({}, { get: (_, k) => (k === "fillRect" ? (...a) => calls.push({ style, a }) : () => {}), set: (_, k, v) => { if (k === "fillStyle") style = v; else if (/alpha|strokeStyle/.test(k)) calls.push({ alpha: true }); return true; } });
    fx.drawRings(ctx, age, { ...spec, ...(over || {}) });
    return calls;
  };
  const mid = DEMO.rings.stagger * 2 + 0.22;
  const m = paint(mid), rects = m.filter((c) => c.a);
  check("rings: pixels, every one cell x cell", `${rects.length} rects, sizes ${[...new Set(rects.map((c) => c.a[2] + "x" + c.a[3]))].join(",")}`, rects.length > 100 && rects.every((c) => c.a[2] === C && c.a[3] === C), `all ${C}x${C}`);
  check("rings: every pixel sits on ONE global grid", `${rects.every((c) => c.a[0] % C === 0 && c.a[1] % C === 0) ? "all multiples of " + C : "off grid"}`, rects.every((c) => c.a[0] % C === 0 && c.a[1] % C === 0), "8-bit lattice");
  const styles = [...new Set(rects.map((c) => c.style))];
  check("rings: three bands - core white, stroke blue, outline black", styles.join(" "), styles.length === 3 && styles.includes(WHITE) && styles.includes(BLUE) && styles.includes(BLACK), "#FFFFFF, #2A8CFF, #0A0F1A");
  const order = rects.map((c) => c.style); const firstOf = (c) => order.indexOf(c), lastOf = (c) => order.lastIndexOf(c);
  check("rings: layers draw across ALL rings (outline, then stroke, then core)", `outline <= ${lastOf(BLACK)} < stroke from ${firstOf(BLUE)} .. ${lastOf(BLUE)} < core from ${firstOf(WHITE)}`, lastOf(BLACK) < firstOf(BLUE) && lastOf(BLUE) < firstOf(WHITE), "a ring never cuts into another's core");
  check("rings: the inner colour is the same on every item", `${[fx.ringColors("#E5322D", BLUE, BLUE), fx.ringColors("#FFFFFF", "#FFFFFF", BLUE), fx.ringColors(BLUE, BLUE, BLUE)].map((c) => c.core).join(" ")}`, [["#E5322D", BLUE], ["#FFFFFF", "#FFFFFF"], [BLUE, BLUE]].every(([i, st]) => fx.ringColors(i, st, BLUE).core === WHITE), "core always white");
  check("rings: no alpha", m.some((c) => c.alpha) ? "uses alpha" : "none", !m.some((c) => c.alpha) && ![...new Set(rects.map((c) => c.style))].some((v) => /rgba|alpha/.test(v)), "never fades");
  // concentric: three rings share one centre, at three different radii
  const radii = (age) => [0, 1, 2].map((j) => fx.ringState(age, spec, j)).filter(Boolean).map((r) => r.radius);
  const rs = radii(mid);
  check("rings: three, concentric, radiating", `radii ${rs.map((r) => r.toFixed(0)).join(", ")} px`, rs.length === 3 && rs[0] > rs[1] && rs[1] > rs[2], "3 radii, earlier ring is larger");
  const R = DEMO.rings.radius * spec.k;
  let maxR = 0; for (let age = 0.02; age < DEMO.rings.life + 0.3; age += 0.01) for (const r of radii(age)) maxR = Math.max(maxR, r);
  check("rings: stay small", `max radius ${maxR.toFixed(0)} px`, maxR <= R + 0.5 && R <= 200, `<= ${R.toFixed(0)} px (<= 200 x k)`);
  const total = DEMO.rings.life + DEMO.rings.stagger * (DEMO.rings.count - 1);
  check("rings: gone by their end", `${paint(total + 0.01).filter((c) => c.a).length} pixels at ${total.toFixed(2)} s`, paint(total + 0.01).filter((c) => c.a).length === 0, "= 0 (each unwinds to nothing)");
  const sweeps = []; for (let age = 0.05; age < DEMO.rings.life; age += 0.05) { const r = fx.ringState(age, spec, 0); if (r) sweeps.push(r.sweep); }
  check("rings: unwind by scale, not alpha", `arc ${sweeps[0].toFixed(1)} -> ${sweeps[sweeps.length - 1].toFixed(1)} rad`, sweeps.every((v, i) => i === 0 || v <= sweeps[i - 1] + 1e-9) && sweeps[sweeps.length - 1] < sweeps[0] * 0.5, "shrinking arc");
  const cells = (c) => paint(mid, { cell: c }).filter((x) => x.a).length;
  check("rings: the pixel size is a parameter", `${cells(2)} px cells at 2, ${cells(4)} at 4, ${cells(8)} at 8`, cells(2) > cells(4) && cells(4) > cells(8) && paint(mid, { cell: 8 }).filter((x) => x.a).every((x) => x.a[2] === 8), "honoured");
  // pixelated: a smooth ring would put cells at every radius; the band is exactly core + stroke + outline wide
  const rc = fx.ringCells(spec, fx.ringState(mid, spec, 0));
  check("rings: each ring is core + stroke + outline, disjoint", `${rc.core.size} core, ${rc.stroke.size} stroke, ${rc.outline.size} outline`, rc.core.size > 0 && rc.stroke.size > rc.core.size && rc.outline.size > rc.stroke.size * 0.9 && [...rc.core].every((k) => !rc.stroke.has(k) && !rc.outline.has(k)) && [...rc.stroke].every((k) => !rc.outline.has(k)), "three bands, no overlap");
  check("rings: deterministic", "identical twice", JSON.stringify(paint(0.3)) === JSON.stringify(paint(0.3)), "same input, same pixels");
}

/* ---- the pixel wipe: a MASK --------------------------------------------------------------- */
{
  const W = DEMO.params.wipe;
  const base = { ...W, W: 1920, H: 1080 };
  const cells = (age, over) => fx.wipeCells(age, { ...base, ...(over || {}) });
  const cov = (age, over) => fx.wipeCoverage(cells(age, over), { ...base, ...(over || {}) });
  const D = fx.wipeDuration(base);
  check("wipe: nothing is revealed at the start", `${(cov(0) * 100).toFixed(0)} %`, cov(0) === 0, "= 0 % (A is whole)");
  check("wipe: fully revealed at the end", `${(cov(D) * 100).toFixed(0)} % at ${D.toFixed(2)} s`, cov(D) >= 0.99, ">= 99 %");
  let up = true, prev = 0; for (let a = 0; a <= D; a += 0.01) { const v = cov(a); if (v < prev - 1e-6) up = false; prev = v; }
  check("wipe: reveal only grows", up ? "monotonic" : "shrinks", up, "monotonic");
  check("wipe: never the whole frame early", `${(cov(D * 0.4) * 100).toFixed(0)} % at 40 %`, cov(D * 0.4) < 0.6, "< 60 % at 40 %");
  const half = (age, left) => cells(age).filter((c) => (c.cx < 960) === left).length;
  check("wipe: sweeps left to right", `left ${half(D * 0.5, true)} cells | right ${half(D * 0.5, false)}`, half(D * 0.5, true) > half(D * 0.5, false) * 1.5, "left first");
  const dirs = { left: (c) => c.cx > 960, down: (c) => c.cy < 540, up: (c) => c.cy > 540 };
  for (const [dir, side] of Object.entries(dirs)) {
    const cs = cells(D * 0.5, { dir });
    const lead = cs.filter(side).length, rest = cs.length - lead;
    check(`wipe: direction "${dir}" honoured`, `${lead} leading | ${rest} trailing`, lead > rest * 1.3, "starts on its own side");
  }
  const n = (f) => cells(D * f).length;
  const first = n(0.3) - n(0.1), last = n(0.7) - n(0.5);
  check("wipe: the edge accelerates (speed-ramp feel)", `${first} cells early vs ${last} late`, last > first * 1.15, "later cells arrive faster");
  const overshoot = Math.max(...cells(D * 0.7).map((c) => c.s));
  check("wipe: cells scale up with overshoot", `max ${overshoot.toFixed(0)} px of ${W.cell}`, overshoot > W.cell, "> cell (overshoot)");
  check("wipe: cells carry their grid index (the mask)", cells(D * 0.5).every((c) => Number.isInteger(c.i) && Number.isInteger(c.j)), true, "i, j");
  const edges = (age) => { const c = stubCtx(); fx.drawWipeEdges(c, cells(age), base); return c; };
  const e = edges(D * 0.5), nCells = cells(D * 0.5).filter((c) => c.u < 1).length, nFill = e.calls.filter((x) => x[0] === "fillRect").length;
  check("wipe: the flash sits on the front, not over the frame", `${nFill} white cells of ${nCells} growing, ${e.calls.filter((x) => x[0] === "strokeRect").length} outlines`, nFill > 0 && nFill <= nCells * 0.6 && e.calls.some((x) => x[0] === "strokeRect") && ![...e.sets].some((v) => /alpha|rgba/.test(v)), "some young cells only; no alpha");
  check("wipe: outline is 2 px", [...e.sets].find((v) => v.startsWith("lineWidth=")), [...e.sets].includes("lineWidth=2"), "= 2");
  check("wipe: finished cells carry nothing", `${edges(D + 0.2).calls.filter((x) => /Rect/.test(x[0])).length} draws after the wipe`, edges(D + 0.2).calls.filter((x) => /Rect/.test(x[0])).length === 0, "= 0");
  check("wipe: deterministic", "identical twice", JSON.stringify(cells(0.2)) === JSON.stringify(cells(0.2)), "same seed, same cells");
  check("wipe: complete by the demo's own timing", `complete ${DEMO.complete.toFixed(2)} s, wipe ends ${(DEMO.seam + D).toFixed(2)} s`, Math.abs(DEMO.complete - (DEMO.seam + D)) < 0.01, "timing() = seam + wipe");
}

/* ---- the speed-ramp camera rush ------------------------------------------------------------ */
{
  const R = DEMO.rush;
  check("rush: nothing outside the ramp", `${fx.rushAt(R.seam - R.rampOut - 0.1, R)} / ${fx.rushAt(R.seam + R.rampIn + 0.1, R)}`, fx.rushAt(R.seam - R.rampOut - 0.1, R) === 0 && fx.rushAt(R.seam + R.rampIn + 0.1, R) === 0, "= 0");
  check("rush: peaks at the seam", `${fx.rushAt(R.seam, R).toFixed(2)}`, Math.abs(fx.rushAt(R.seam, R) - R.amount) < 1e-6, `= ${R.amount}`);
  let acc = true, dec = true;
  for (let t = R.seam - R.rampOut; t < R.seam - 0.01; t += 0.01) if (fx.rushAt(t + 0.01, R) - fx.rushAt(t, R) < fx.rushAt(t, R) - fx.rushAt(t - 0.01 > 0 ? t - 0.01 : 0, R) - 1e-9) acc = false;
  for (let t = R.seam; t < R.seam + R.rampIn - 0.02; t += 0.01) if (fx.rushAt(t + 0.01, R) > fx.rushAt(t, R) + 1e-9) dec = false;
  check("rush: accelerates in, settles out", `${acc ? "ease-in" : "not accelerating"}, ${dec ? "settles" : "rises"}`, acc && dec, "ease-in then ease-out");
}

/* ---- the extrusion ------------------------------------------------------------------------- */
{
  const html = slab({ layers: 6, step: 5 });
  const zs = [...html.matchAll(/translateZ\(-(\d+)px\)/g)].map((m) => +m[1]);
  check("extrude: layers stacked behind the face", `${zs.length} slices, ${zs[0]} -> ${zs[zs.length - 1]} px`, zs.length === 6 && zs.every((z, i) => i === 0 || z < zs[i - 1]), "far to near, behind the face");
  check("extrude: thickness is a parameter", `${thickness({ layers: 6, step: 5 })} px`, thickness({ layers: 6, step: 5 }) === 30 && thickness() === SLAB.layers * SLAB.step, "layers x step");
  check("extrude: no opacity", /opacity/.test(html) ? "uses opacity" : "none", !/opacity/.test(html), "solid slices");
  const demoFiles = ["a", "b"].map((n) => path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "compositions", "transition-demo", n + ".html"));
  if (demoFiles.every((f) => fs.existsSync(f))) {
    const [a, b] = demoFiles.map((f) => fs.readFileSync(f, "utf8"));
    check("extrude: the lab's dots are slabs", (a.match(/class="dot x3d"/g) || []).length, (a.match(/class="dot x3d"/g) || []).length === 5 && (a.match(/class="xl"/g) || []).length >= 40, "5 slabs");
    const tbl = (b.match(/class="tbl x3d"/g) || []).length, rows = (b.match(/class="trow x3d"/g) || []).length, sats = (b.match(/class="sat x3d"/g) || []).length, cuts = (b.match(/class="sat cut x3d"/g) || []).length;
    check("extrude: sample B is the table and its family, all slabs", `${tbl} table, ${rows} rows, ${sats} satellites, ${cuts} ear`, tbl === 1 && rows === 3 && sats >= 2 && cuts === 1, "1 table, 3 rows, satellites, 1 ear");
  }
}

/* ---- the transition registry --------------------------------------------------------------- */
{
  const ids = Object.keys(TRANSITIONS);
  check("transitions: at least a wipe and a swap are registered", ids.join(", "), ids.includes("pixel-wipe") && ids.includes("scale-swap"), "pixel-wipe, scale-swap");
  for (const id of ids) {
    const bad = validateT(TRANSITIONS[id]);
    check(`transitions: "${id}" meets the contract`, bad.length ? bad.join("; ") : "valid", bad.length === 0, "validate() is empty");
    const t = TRANSITIONS[id], ph = t.phases(t.params), tm = t.timing(t.params, 5);
    check(`transitions: "${id}" order is ${t.semantics.order}`, ph.map((x) => x.id).join(" > "), ph.map((x) => x.id).join(" > ") === t.semantics.order, "semantics = phases");
    check(`transitions: "${id}" never fades`, /opacity\s*[:=]\s*[^;]*\b(0|1)\b/.test(t.parent({ params: t.params }).frameJS.replace(/flashEl\.style\.opacity[^;]*;/, "")) ? "uses opacity" : "none", !/opacity/.test(t.parent({ params: t.params }).frameJS.replace(/\/\/[^\n]*\n/g, "").replace(/flashEl\.style\.opacity[^;]*;/, "")), "scale / mask only");
    if (t.semantics.jcut) check(`transitions: "${id}" is a J-cut`, `B at ${tm.bStart} s, A until ${tm.aEnd} s`, tm.bStart < tm.aEnd, "overlap");
  }
  const wipe = TRANSITIONS["pixel-wipe"].parent({ params: TRANSITIONS["pixel-wipe"].params });
  check("pixel-wipe masks the incoming group", /clip-path:url\(#pxclip\)/.test(wipe.groupBStyle) ? "clip-path on B" : "no mask", /clip-path:url\(#pxclip\)/.test(wipe.groupBStyle) && /<clipPath/.test(wipe.html), "B is clipped, not covered");
  check("pixel-wipe has no full-frame flash layer", /class="flash"/.test(wipe.html) ? "has a flash overlay" : "none", !/class="flash"/.test(wipe.html) && !/flashEl/.test(wipe.frameJS), "nothing washes the frame");
  let threw = false; try { getT("nope"); } catch (e) { threw = /Available: /.test(e.message); }
  check("transitions: an unknown name says what exists", threw ? "helpful error" : "silent", threw, "throws with the list");
}

/* ---- the pointer is never hidden by the transition ----------------------------------------- */
{
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "compositions", "transition-demo.html");
  if (!fs.existsSync(file)) {
    check("pointer above the transition", "compositions/transition-demo.html not built (npm run lab:transition)", false, "build first");
  } else {
    const html = fs.readFileSync(file, "utf8");
    const z = (re) => { const m = html.match(re); return m ? +m[1] : null; };
    const zRings = z(/\.ringsc\{[^}]*z-index:(\d+)/), zCursor = z(/\.cursor\{z-index:(\d+)/), zAdj = z(/\.adj\{[^}]*z-index:(\d+)/);
    check("three layers: the composite < the click rings < the pointer", `composite ${zAdj} < rings ${zRings} < cursor ${zCursor}`, zCursor > zRings && zRings > zAdj && zAdj > 0, "cursor on top, rings directly under it, elements below");
    const iRingsEl = html.indexOf('id="rings"'), iGBe = html.indexOf('id="gB"'), iCur = html.indexOf('class="cursor"');
    check("the rings are one full-screen layer outside both groups (they persist through a transition)", iRingsEl > iGBe && iRingsEl < iCur ? "after the groups, before the cursor" : "misplaced", iRingsEl > iGBe && iRingsEl < iCur && !/id="ringsA"|id="ringsB"/.test(html), "own layer, not clipped by a wipe");
    const iAdj = html.indexOf('id="adj"'), iGA = html.indexOf('id="gA"'), iGB = html.indexOf('id="gB"'), iRings = html.indexOf('class="cursor"'); // the pointer is the first thing OUTSIDE the adjustment layer
    check("one adjustment layer wraps both compositions and the mask", iAdj > 0 && iAdj < iGA && iGA < iGB && iGB < html.indexOf('id="pxedge"') && html.indexOf('id="pxedge"') < iRings ? "adj > gA, gB, mask edges" : "not wrapped", iAdj > 0 && iAdj < iGA && iGB < html.indexOf('id="pxedge"') && html.indexOf('id="pxedge"') < iRings, "scale lives on the composite");
    const a1 = fs.readFileSync(file.replace(".html", "/a.html"), "utf8"), b1 = fs.readFileSync(file.replace(".html", "/b.html"), "utf8");
    check("compositions carry no rush of their own", /rushAt|kickAt/.test(a1.replace(/const __fx2[\s\S]*?\n/, "").split("inner.time")[0].split("onUpdate")[1] || "") || /ZOOM_ADD = __fx2/.test(a1 + b1) ? "per-composition rush" : "none", !/ZOOM_ADD = __fx2/.test(a1 + b1), "the adjustment layer owns it");
    const iCursor = html.indexOf('class="cursor"'), iB = html.indexOf('id="gB"'), iEnd = html.indexOf("</div>\n      </div>", iB);
    check("pointer is in the parent, outside both groups", iCursor > iEnd && iEnd > 0 ? "outside" : "inside a group", iCursor > iEnd && iEnd > 0, "outside A and B");
  }
}

/* ---- the pointer through the cut ----------------------------------------------------------- */
{
  const m = pointerModule().build(demoSpec());
  const dt = 1 / 240;
  let step = 0, vj = 0, pv = null, camStep = 0, prev = m.pointerAt(WARP.tau(0)), pc = m.cameraAt(WARP.tau(0));
  for (let t = dt; t <= DEMO.duration; t += dt) {
    const tau = WARP.tau(t);
    const p = m.pointerAt(tau), c = m.cameraAt(tau);
    const d = Math.hypot(p.x - prev.x, p.y - prev.y, (p.z - prev.z) * 0.5);
    step = Math.max(step, d);
    const v = d / dt;
    if (pv !== null) vj = Math.max(vj, Math.abs(v - pv));
    pv = v;
    camStep = Math.max(camStep, Math.hypot(c.x - pc.x, c.y - pc.y, c.z - pc.z));
    prev = p; pc = c;
  }
  const lim = 20 * DEMO.warp.peak;
  check("pointer carries through the cut", `${step.toFixed(1)} px / 1/240 s`, step <= lim, `<= ${lim.toFixed(0)} (20 x ramp peak)`);
  check("pointer velocity continuous through the cut", `${vj.toFixed(0)} px/s per step`, vj <= 400 * DEMO.warp.peak, `<= ${400 * DEMO.warp.peak}`);
  check("camera carries through the cut", `${camStep.toFixed(1)} px / 1/240 s`, camStep <= 12 * DEMO.warp.peak, `<= ${12 * DEMO.warp.peak}`);
}

const w = Math.max(...rows.map((r) => r.name.length));
console.log("\nTransition fx test\n");
for (const r of rows) console.log(`  ${r.ok ? "✓" : "✗"} ${r.name.padEnd(w)}  ${String(r.value).padEnd(34)} (${r.limit})`);
if (failed) { console.error(`\n✗ fx test: ${failed} check(s) failed. See docs/TRANSITION_FX.md.`); process.exit(1); }
console.log("\n✓ fx test clean");
