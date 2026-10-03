#!/usr/bin/env node
/**
 * Offline continuity and behaviour test for the pointer and its camera (docs/POINTER_MOTION.md §5).
 *
 * No browser, no render: it samples src/lkpointer.mjs at 240 Hz and checks numbers. It exists
 * because the first pointer passed every lint and teleported on 94% of beats - a defect that is
 * invisible in any single frame and obvious in motion. A smoothness claim with no number behind it
 * is a guess.
 *
 *   npm run test:pointer
 *
 * Today it checks the 5-second lab (the model's acceptance). Once the films are ported it takes each
 * beat's plan through the same checks (see `checkModel`).
 */

import { pointerModule, LAB } from "../src/lkpointer.mjs";

const HZ = 240;
const DT = 1 / HZ;
const ptr = pointerModule();

/** The limits, with the failure each one catches (docs/POINTER_MOTION.md §5). */
const LIMIT = {
  teleportPx: 20, // per 1/240 s (~4,800 px/s). Old pointer: 1,445.
  velJumpPxs: 400, // change of velocity per 1/240 s. Old pointer: 346,837.
  orbitShare: 0.12, // lab: 5 dots in 5 s leaves little orbit. A normal beat must be >= 0.6.
  arrivePx: 40,
  camLagMin: 0.6,
  camLagMax: 1.6,
  camSpeedPxs: 450, // x/y drift of the camera
  zoomSpeed: 2.6, // zoom units per second: the push-in has mass, so it is allowed to be brisker than the drift
  camSpeedDegs: 20,
  zoomMin: 1.0,
  zoomMax: 2.2,
  camTeleportPx: 12, // per 1/240 s
  camVelJumpPxs: 300,
  camRotJumpDegs: 8,
};

const rows = [];
let failed = 0;
const check = (name, value, ok, limit) => {
  rows.push({ name, value, ok, limit });
  if (!ok) failed++;
};

/** max |x[i+1]-x[i]| and max |v[i+1]-v[i]| of a scalar-or-vector series (px per step, px/s per step). */
function maxStepStats(series, dist) {
  let step = 0, vjump = 0, prevV = null;
  for (let i = 1; i < series.length; i++) {
    const d = dist(series[i], series[i - 1]);
    step = Math.max(step, d);
    const v = d / DT;
    if (prevV !== null) vjump = Math.max(vjump, Math.abs(v - prevV));
    prevV = v;
  }
  return { step, vjump };
}

/** Run every check against one model. `spec` supplies the events the test expects it to honour. */
export function checkModel(spec, { duration, label = "model", measureLagTo = 12 } = {}) {
  const m = ptr.build(spec);
  const n = Math.floor(duration * HZ);
  const P = [], C = [], H = [];
  for (let i = 0; i <= n; i++) {
    const t = i * DT;
    P.push(m.pointerAt(t));
    C.push(m.cameraAt(t));
    H.push(m.holdAt(t));
  }

  // 1 + 2: the pointer does not teleport and its velocity is continuous
  const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z) * 0.5);
  const ps = maxStepStats(P, d3);
  check("no teleport (pointer)", `${ps.step.toFixed(1)} px / 1/240 s`, ps.step <= LIMIT.teleportPx, `<= ${LIMIT.teleportPx}`);
  check("continuous velocity (pointer)", `${ps.vjump.toFixed(0)} px/s per step`, ps.vjump <= LIMIT.velJumpPxs, `<= ${LIMIT.velJumpPxs}`);

  // 3: orbit is the default
  const orbit = H.reduce((s, h) => s + (1 - h), 0) / H.length;
  check("orbit is the default", `${(orbit * 100).toFixed(0)} % of the time`, orbit >= LIMIT.orbitShare, `>= ${(LIMIT.orbitShare * 100).toFixed(0)} %`);

  // 6: the pointer arrives at each event's hold
  let worstArrive = 0;
  for (const e of m.events) {
    const t = e.tB - 0.02; // by the END of the hold it must be there
    const p = m.pointerAt(t);
    const target = e.circle ? { x: e.p.x, y: e.p.y } : e.p;
    const slack = e.circle ? e.circle.r : 0;
    worstArrive = Math.max(worstArrive, Math.max(0, Math.hypot(p.x - target.x, p.y - target.y) - slack));
  }
  check("arrives at every event", `worst ${worstArrive.toFixed(0)} px off`, worstArrive <= LIMIT.arrivePx, `<= ${LIMIT.arrivePx} px`);

  // 7: the camera trails the pointer. Mean delay of the aim signal vs the pointer's guide, by
  // cross-correlating their speeds over a longer window (the orbit continues past the clip).
  const N = Math.floor(measureLagTo * HZ);
  const gx = [], cx = [];
  for (let i = 0; i < N; i++) {
    const t = i * DT;
    gx.push(m.guideAt(t).x * m.params.beta);
    cx.push(m.cameraAt(t).aim.x);
  }
  const vel = (a) => a.map((v, i) => (i ? (v - a[i - 1]) / DT : 0));
  const vg = vel(gx), vc = vel(cx);
  let best = -Infinity, bestLag = 0;
  for (let L = 0; L < 3 * HZ; L += 2) {
    let s = 0;
    for (let i = L + HZ; i < N; i++) s += vg[i - L] * vc[i];
    if (s > best) { best = s; bestLag = L; }
  }
  const lagS = bestLag * DT;
  check("camera follows, loosely (lag)", `${lagS.toFixed(2)} s behind the pointer`, lagS >= LIMIT.camLagMin && lagS <= LIMIT.camLagMax, `${LIMIT.camLagMin}-${LIMIT.camLagMax} s`);

  // 8: the camera is slow and the zoom stays in range
  let sp = 0, ang = 0, zmin = Infinity, zmax = -Infinity, zsp = 0;
  for (let i = 1; i < C.length; i++) {
    sp = Math.max(sp, Math.hypot(C[i].x - C[i - 1].x, C[i].y - C[i - 1].y) / DT);
    zsp = Math.max(zsp, Math.abs(C[i].zoom - C[i - 1].zoom) / DT);
    ang = Math.max(ang, Math.hypot(C[i].rotationX - C[i - 1].rotationX, C[i].rotationY - C[i - 1].rotationY) / DT);
    zmin = Math.min(zmin, C[i].zoom);
    zmax = Math.max(zmax, C[i].zoom);
  }
  check("camera zoom push has mass, not a snap", `${zsp.toFixed(2)} /s`, zsp <= LIMIT.zoomSpeed, `<= ${LIMIT.zoomSpeed} zoom/s`);
  check("camera is slow (translation)", `${sp.toFixed(0)} px/s`, sp <= LIMIT.camSpeedPxs, `<= ${LIMIT.camSpeedPxs}`);
  check("camera is slow (rotation)", `${ang.toFixed(1)} deg/s`, ang <= LIMIT.camSpeedDegs, `<= ${LIMIT.camSpeedDegs}`);
  check("zoom stays in range", `${zmin.toFixed(2)} - ${zmax.toFixed(2)}`, zmin >= LIMIT.zoomMin && zmax <= LIMIT.zoomMax, `${LIMIT.zoomMin}-${LIMIT.zoomMax}`);

  // 9: the camera is continuous on every channel (the overlapping-tween bug)
  const cs = maxStepStats(C, (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z));
  check("no teleport (camera)", `${cs.step.toFixed(1)} px / 1/240 s`, cs.step <= LIMIT.camTeleportPx, `<= ${LIMIT.camTeleportPx}`);
  check("continuous velocity (camera)", `${cs.vjump.toFixed(0)} px/s per step`, cs.vjump <= LIMIT.camVelJumpPxs, `<= ${LIMIT.camVelJumpPxs}`);
  const rs = maxStepStats(C, (a, b) => Math.hypot(a.rotationX - b.rotationX, a.rotationY - b.rotationY));
  check("no snap (camera tilt)", `${rs.step.toFixed(3)} deg / 1/240 s`, rs.step * HZ <= LIMIT.camRotJumpDegs * 10, `<= ${(LIMIT.camRotJumpDegs * 10 / HZ).toFixed(2)} deg`);

  return { label };
}

console.log(`\nPointer lab: ${LAB.duration}s, ${LAB.dots.length} dots, sampled at ${HZ} Hz\n`);
checkModel(LAB.spec(), { duration: LAB.duration, label: "lab" });

const w = Math.max(...rows.map((r) => r.name.length));
for (const r of rows) {
  console.log(`  ${r.ok ? "✓" : "✗"} ${r.name.padEnd(w)}  ${String(r.value).padEnd(28)} (${r.limit})`);
}
if (failed) {
  console.error(`\n✗ pointer test: ${failed} check(s) failed. See docs/POINTER_MOTION.md.`);
  process.exit(1);
}
console.log("\n✓ pointer test clean");
