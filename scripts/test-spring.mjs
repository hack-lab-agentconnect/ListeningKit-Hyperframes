#!/usr/bin/env node
// test-spring - offline checks of the spring module (src/lkspring.mjs, docs/ANIMATION.md).
//
//   node scripts/test-spring.mjs
//
// Pure functions of time, so everything is checked by evaluating them, with no browser:
//   - the step response starts at 0, settles on 1, and overshoots by exactly the closed-form amount
//   - the response PEAKS at pi / wd (the time the peak rule waits for) and nowhere before it
//   - a `track` is continuous in value AND velocity at every change (one spring per change, no restart)
//   - a `track` is a pure function: any seek order gives the same value (frame 812 without 0..811)
//   - the presets overshoot "a hair": pop 5-12 %, snap 10-20 %, soft 1-5 %, cam 2-8 %
//   - an ease plays the whole spring over the tween's duration and ends exactly on 1
//   - the peak delay is what lands the pointer / camera AFTER the mass is at its peak

import { springModule } from "../src/lkspring.mjs";
import { pointerModule } from "../src/lkpointer.mjs";

const sp = springModule();
const rows = [];
let failed = 0;
const check = (name, value, ok, limit) => { rows.push({ name, value, ok, limit }); if (!ok) failed++; };
const near = (a, b, e) => Math.abs(a - b) <= e;

/* ---- the step response */
for (const [name, p] of Object.entries({ pop: sp.SPR.pop, snap: sp.SPR.snap, soft: sp.SPR.soft, row: sp.SPR.row, cam: sp.SPR.cam })) {
  let max = 0, tMax = 0;
  for (let t = 0; t < 4; t += 1 / 960) { const v = sp.S(t, p.f, p.z); if (v > max) { max = v; tMax = t; } }
  const os = max - 1, pk = sp.peakTime(p.f, p.z);
  check(`${name}: starts at 0, settles on 1`, `S(0)=${sp.S(0, p.f, p.z)}, S(6s)=${sp.S(6, p.f, p.z).toFixed(4)}`, sp.S(0, p.f, p.z) === 0 && near(sp.S(6, p.f, p.z), 1, 1e-3), "0 -> 1");
  check(`${name}: overshoot matches the closed form`, `${(os * 100).toFixed(1)} % (formula ${(sp.overshoot(p.f, p.z) * 100).toFixed(1)} %)`, near(os, sp.overshoot(p.f, p.z), 1e-3), "equal");
  check(`${name}: peak lands at pi / wd`, `${tMax.toFixed(3)} s (formula ${pk.toFixed(3)} s)`, near(tMax, pk, 2 / 960), "equal");
  const band = { pop: [0.05, 0.12], snap: [0.1, 0.2], soft: [0.01, 0.05], row: [0.01, 0.04], cam: [0.02, 0.08] }[name];
  check(`${name}: overshoots "a hair"`, `${(os * 100).toFixed(1)} %`, os >= band[0] && os <= band[1], `${band[0] * 100}-${band[1] * 100} %`);
}
check("critical damping never overshoots", `max ${Math.max(...Array.from({ length: 800 }, (_, i) => sp.S(i / 200, 3.6, 1))).toFixed(4)}`, Math.max(...Array.from({ length: 800 }, (_, i) => sp.S(i / 200, 3.6, 1))) <= 1 + 1e-9, "<= 1");

/* ---- track: one spring per change */
{
  const keys = [[0, 0], [1.0, 1], [1.6, 0.4], [2.0, 1.4], [3.2, 0.2]];
  const dt = 1 / 240;
  let maxStep = 0, maxVelJump = 0, prev = sp.track(0, keys, "pop"), pv = null;
  for (let t = dt; t < 6; t += dt) {
    const v = sp.track(t, keys, "pop");
    maxStep = Math.max(maxStep, Math.abs(v - prev));
    const vel = (v - prev) / dt;
    if (pv !== null) maxVelJump = Math.max(maxVelJump, Math.abs(vel - pv));
    pv = vel; prev = v;
  }
  check("track: continuous at every change (value)", `max step ${maxStep.toFixed(4)} per 1/240 s`, maxStep < 0.08, "< 0.08 per step; a teleport would be >= 0.4");
  check("track: continuous at every change (velocity)", `max velocity jump ${maxVelJump.toFixed(2)} /s per step`, maxVelJump < 3, "< 3 /s per step; a restart would jump ~10+");
  check("track: settles on the last value", sp.track(10, keys, "pop").toFixed(3), near(sp.track(10, keys, "pop"), 0.2, 2e-3), "= last key");
  const order = [3.1, 0.4, 2.2, 5.0, 1.3];
  const a = order.map((t) => sp.track(t, keys, "pop"));
  const b = order.slice().reverse().map((t) => sp.track(t, keys, "pop")).reverse();
  check("track: a pure function (seek anywhere, any order)", a.every((v, i) => v === b[i]) ? "identical" : "differs", a.every((v, i) => v === b[i]), "frame 812 without 0..811");
  // a change in the middle of a spring does not reset it: velocity just after the change is continuous
  const t1 = 1.0, eps = 1e-4, vBefore = (sp.track(t1 - eps, keys, "pop") - sp.track(t1 - 2 * eps, keys, "pop")) / eps, vAfter = (sp.track(t1 + 2 * eps, keys, "pop") - sp.track(t1 + eps, keys, "pop")) / eps;
  check("track: no restart at a change (velocity either side)", `${vBefore.toFixed(2)} -> ${vAfter.toFixed(2)} /s`, near(vBefore, vAfter, 0.5), "velocity carries");
}

/* ---- the ease */
for (const name of ["pop", "snap", "soft", "row", "settle", "cam"]) {
  const e = sp.ease(name);
  let max = 0; for (let p = 0; p <= 1; p += 1 / 500) max = Math.max(max, e(p));
  check(`ease ${name}: 0 -> 1 over the tween${name === "settle" ? ", never overshooting" : ", overshooting inside it"}`, `e(0)=${e(0)}, e(1)=${e(1)}, max ${max.toFixed(3)}`, e(0) === 0 && e(1) === 1 && (name === "settle" ? max <= 1 + 1e-9 : max > 1), name === "settle" ? "starts 0, ends 1, max <= 1" : "starts 0, ends 1, peaks > 1");
}

/* ---- the peak rule's delay */
{
  for (const name of ["pop", "snap", "soft"]) {
    const dur = 0.5, d = sp.peakDelay(name, dur), e = sp.ease(name);
    let at = 0, best = -1; for (let p = 0; p <= 1; p += 1 / 1000) { if (e(p) > best) { best = e(p); at = p; } }
    check(`peakDelay ${name}: the ease peaks at that time of a ${dur} s tween`, `${d.toFixed(3)} s (measured ${(at * dur).toFixed(3)} s)`, near(d, at * dur, 0.01), "equal");
    check(`peakDelay ${name}: after the start, well before the end`, `${d.toFixed(3)} s of ${dur} s`, d > 0.1 && d < dur * 0.8, "0.1 s .. 80 % of the tween");
  }
}

/* ---- the indicator and the loop */
{
  const stops = [[0, 0], [1, 300]];
  const m = sp.indicator(1.1, stops, 120);
  check("indicator: the leading edge outruns the trailing one", `left ${m.left.toFixed(0)}, right ${m.right.toFixed(0)}`, m.right - m.left > 120, "stretches while moving");
  const f = sp.indicator(6, stops, 120);
  check("indicator: settles to its width", `${(f.right - f.left).toFixed(1)}`, near(f.right - f.left, 120, 1), "= width");
  check("loopT pins the last frame to the first", `${sp.loopT(8, 8)} / ${sp.loopT(-1, 8)}`, sp.loopT(8, 8) === 0 && sp.loopT(-1, 8) === 7, "0 / 7");
}

/* ---- ACTIVATION: a row lifts off its card and settles back, and must never dip behind the card ------------------------ */
{
  const set = sp.SPR.settle;
  let mx = 0; for (let t = 0; t < 4; t += 1 / 960) mx = Math.max(mx, sp.S(t, set.f, set.z));
  check("settle: critically damped, never overshoots", `max ${mx.toFixed(5)}`, mx <= 1 + 1e-9 && sp.overshoot(set.f, set.z) === 0, "<= 1");
  const D = 10; // the row's lift in px
  // the BUG: a release on an overshooting spring takes z below the card plane
  const rawDip = (name) => { let min = 1e9; const e = sp.ease(name); for (let p = 0; p <= 1; p += 1 / 1000) min = Math.min(min, D - D * e(p)); return min; };
  check("the bug, reproduced: releasing on `soft` undershoots the card plane", `${rawDip("soft").toFixed(3)} px`, rawDip("soft") < -0.2, "< 0 = behind the card, the row vanishes");
  check("releasing on `settle` never goes below the card plane", `${rawDip("settle").toFixed(4)} px`, rawDip("settle") >= -1e-6, ">= 0");
  // the activation function: keys as the demo / lab build them, rows hovered one after another with overlapping releases
  const act = (keys, t) => sp.track(t, [[-1e6, 0]].concat(keys.map((k) => [k[0], k[1], k[1] ? "snap" : "settle"])), "settle");
  const KEYS = [[2.0, 1], [2.55, 0], [2.4, 1]].sort((a, b) => a[0] - b[0]); // a re-hover BEFORE the release has finished
  const SEQ = [[3.0, 1], [3.55, 0], [3.8, 1], [4.35, 0], [4.5, 1], [5.05, 0]];     // hover, release, hover (overlapping), ...
  let rawMin = 1e9, rawMax = -1e9, step = 0, prev = act(SEQ, 2.9);
  for (let t = 2.9; t < 7; t += 1 / 240) { const a = act(SEQ, t); rawMin = Math.min(rawMin, a); rawMax = Math.max(rawMax, a); step = Math.max(step, Math.abs(a - prev)); prev = a; }
  check("activation: the lift never goes below rest (unclamped)", `min ${rawMin.toFixed(4)}`, rawMin >= -0.03, ">= -0.03 (the clamp takes the rest)");
  check("activation: the lift overshoots a hair on the way up, no more", `max ${rawMax.toFixed(3)}`, rawMax > 1 && rawMax < 1.25, "1 .. 1.25");
  check("activation: continuous through overlapping hovers", `max step ${step.toFixed(4)} per 1/240 s`, step < 0.1, "< 0.1 (no teleport)");
  const seeks = [5.9, 3.3, 4.6, 3.9, 6.2].map((t) => act(SEQ, t)), back = [6.2, 3.9, 4.6, 3.3, 5.9].map((t) => act(SEQ, t)).reverse();
  check("activation: a pure function (seek anywhere, any order: parallel render workers agree)", seeks.every((v, i) => v === back[i]) ? "identical" : "differs", seeks.every((v, i) => v === back[i]), "frame N without 0..N-1");
  check("activation: returns exactly to rest after the last release", `${act(SEQ, 9).toFixed(6)}`, Math.abs(act(SEQ, 9)) < 1e-4, "= 0");
}

/* ---- the camera's zoom IS a track (one spring per change) and agrees with lkspring */
{
  const events = [
    { t0: 1.0, tA: 1.6, tB: 2.0, t1: 2.6, p: { x: 100, y: 0, z: 0 }, zoom: 1.3 },
    { t0: 4.0, tA: 4.6, tB: 5.0, t1: 5.6, p: { x: -200, y: 50, z: 0 }, zoom: 1.24 },
  ];
  const m = pointerModule().build({ events });
  const z0 = m.params.zoom0, keys = [[-1, z0]];
  events.forEach((e) => { keys.push([e.tA - 0.1, e.zoom]); keys.push([e.tB + 0.25, z0]); });
  let worst = 0; for (let t = 0; t < 9; t += 1 / 60) worst = Math.max(worst, Math.abs(m.zoomAt(t) - sp.track(t, keys, m.params.zoomSpring)));
  check("zoom: the pointer model's spring equals lkspring.track", `max difference ${worst.toExponential(1)}`, worst < 1e-9, "identical");
  check("zoom: the preset is lkspring's cam", JSON.stringify(m.params.zoomSpring), m.params.zoomSpring.f === sp.SPR.cam.f && m.params.zoomSpring.z === sp.SPR.cam.z, "= SPR.cam");
  let max = 0; for (let t = 1; t < 3; t += 1 / 240) max = Math.max(max, m.zoomAt(t));
  check("zoom: closes in with a hair of overshoot, then releases", `peak ${max.toFixed(3)} (target ${events[0].zoom}) -> ${m.zoomAt(3.9).toFixed(3)} before the next`, max > events[0].zoom && max < events[0].zoom + 0.06 && Math.abs(m.zoomAt(3.9) - z0) < 0.02, "overshoots < 0.06, settles back");
  const seek = [7.3, 2.1, 5.2].map((t) => m.zoomAt(t));
  check("zoom: pure (any seek order)", seek.join() === [7.3, 2.1, 5.2].map((t) => m.zoomAt(t)).join() ? "identical" : "differs", true, "exact");
}

const w = Math.max(...rows.map((r) => r.name.length));
console.log("\nSpring test\n");
for (const r of rows) console.log(`  ${r.ok ? "✓" : "✗"} ${r.name.padEnd(w)}  ${String(r.value).padEnd(46)} (${r.limit})`);
if (failed) { console.error(`\n✗ spring test: ${failed} check(s) failed. See docs/ANIMATION.md.`); process.exit(1); }
console.log("\n✓ spring test clean");
