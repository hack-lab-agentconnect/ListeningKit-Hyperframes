#!/usr/bin/env node
// test-camera - offline checks of the camera director (src/camera/, docs/CAMERA.md).
//
//   node scripts/test-camera.mjs
//
// Everything is a pure function of time, so it is checked by evaluating it at 240 Hz:
//   - every move meets the registry contract and behaves as its semantics say (zoom class, travel, yaw, a cut is a cut)
//   - the director obeys its budget over 120 synthetic beats: close moves rationed, breathing room kept, no repeats, no
//     twitchy shots, the peak rule honoured, a close move only on a click
//   - across a film-length run of beats: styles vary, every move appears, close beats stay within the share
//   - the camera is continuous in position and velocity through every hand-over; the ONLY discontinuity is a cut-push's cut
//   - the click punches the frame, and it decays

import { MOVES, validate, get, cameraModule } from "../src/camera/index.mjs";
import { plan, stats, check, styleFor, STYLE_ORDER, STYLES, LIMITS, filmShots } from "../src/camera/director.mjs";
import { pointerModule } from "../src/lkpointer.mjs";
import { springModule } from "../src/lkspring.mjs";

const ptr = pointerModule(), spr = springModule();
const rows = [];
let failed = 0;
const check_ = (name, value, ok, limit) => { rows.push({ name, value, ok, limit }); if (!ok) failed++; };
const near = (a, b, e) => Math.abs(a - b) <= e;

const movePoses = Object.fromEntries(Object.values(MOVES).map((m) => [m.id, { pose: m.pose }]));
const cam = cameraModule(ptr, spr, movePoses);

/** a pointer model with clicks and NO zoom (the camera director owns zoom), and the ctx the moves need */
const A = { x: -300, y: 40, z: 60 }, B = { x: 280, y: -60, z: 40 };
const model = ptr.build({ events: [
  { t0: 1.0, tA: 1.6, tB: 2.0, t1: 2.6, p: A, click: 1.8 },
  { t0: 3.4, tA: 4.0, tB: 4.4, t1: 5.0, p: B, click: 4.2 },
] });
const ctx = {
  follow: (t) => model.cameraAt(t, 0),
  target: (shot) => (shot.target && shot.target.x !== undefined ? shot.target : A),
};
const DT = 1 / 240;

/* ---- the registry */
for (const [id, m] of Object.entries(MOVES)) {
  const bad = validate(m, id);
  check_(`move "${id}" meets the contract`, bad.length ? bad.join("; ") : "valid", bad.length === 0, "validate() is empty");
}
let threw = false; try { get("nope"); } catch (e) { threw = /Available: /.test(e.message); }
check_("an unknown move says what exists", threw ? "helpful error" : "silent", threw, "throws with the list");
check_("the vocabulary is a real set of different things", Object.keys(MOVES).join(", "), Object.keys(MOVES).length >= 7 && new Set(Object.values(MOVES).map((m) => m.semantics.kind)).size >= 6, ">= 7 moves, >= 6 kinds");

/* ---- each move, alone */
function solo(move, t0, t1, extra = {}) {
  const p = { duration: t1, blend: 0, shots: [{ move, t0, t1, side: 1, ...extra }], punch: [] };
  return cam.build(p, ctx);
}
function sweep(c, a, b, f) { const out = []; for (let t = a; t <= b; t += DT) out.push(f(c.at(t), t)); return out; }
{
  const br = solo("breathe", 0, 8), zs = sweep(br, 0, 8, (p) => p.zoom);
  check_("breathe: stays wide (zoom 1.00 - 1.04)", `${Math.min(...zs).toFixed(3)} - ${Math.max(...zs).toFixed(3)}`, Math.min(...zs) >= 0.999 && Math.max(...zs) <= 1.04, "no push");
  const xs = sweep(br, 0, 8, (p) => p.x); check_("breathe: drifts (it is alive, not frozen)", `x travels ${(Math.max(...xs) - Math.min(...xs)).toFixed(0)} px`, Math.max(...xs) - Math.min(...xs) > 20, "> 20 px");
  const f = solo("follow", 0.5, 7), fz = sweep(f, 0.5, 7, (p) => p.zoom);
  check_("follow: leans, does not push (zoom stays near rest)", `${Math.min(...fz).toFixed(3)} - ${Math.max(...fz).toFixed(3)}`, Math.max(...fz) <= 1.2, "<= 1.2");
  const ps = solo("push", 1, 4, { target: A }), pz = sweep(ps, 1, 5, (p) => p.zoom);
  check_("push: closes in hard, with a hair of overshoot", `${pz[0].toFixed(2)} -> peak ${Math.max(...pz).toFixed(2)} -> ${pz[pz.length - 1].toFixed(2)}`, pz[0] < 1.1 && Math.max(...pz) >= 1.7 && Math.max(...pz) <= LIMITS.maxZoom && pz[pz.length - 1] > 1.65, "1.04 -> ~1.75");
  const mono = (() => { let m = true; for (let i = 1; i < pz.length * 0.4; i++) if (pz[i] < pz[i - 1] - 1e-6) m = false; return m; })();
  check_("push: rises without hesitating", mono ? "monotonic on the way in" : "stalls", mono, "monotonic");
  const pl = solo("pull", 2, 4, { target: A, fromZoom: 1.75 }), plz = sweep(pl, 2, 5, (p) => p.zoom);
  check_("pull: eases back out to the wide frame", `${plz[0].toFixed(2)} -> ${plz[plz.length - 1].toFixed(2)}`, near(plz[0], 1.75, 0.02) && near(plz[plz.length - 1], 1.0, 0.02), "1.75 -> 1.0");
  const pn = solo("pan", 1, 3.5, { from: A, to: B, target: B }), pxs = sweep(pn, 1, 3.5, (p) => p.intent.P.x), pys = sweep(pn, 1, 3.5, (p) => p.intent.ry);
  check_("pan: slides across the composition, yaw swinging against the travel", `x ${pxs[0].toFixed(0)} -> ${pxs[pxs.length - 1].toFixed(0)}, yaw peak ${Math.min(...pys).toFixed(1)}`, near(pxs[0], A.x, 5) && near(pxs[pxs.length - 1], B.x, 5) && Math.min(...pys) < -8, "A -> B, yaw about -10");
  const yw = solo("yaw", 0, 4), yy = sweep(yw, 0, 4, (p) => p.intent.ry), yz = sweep(yw, 0, 4, (p) => p.zoom);
  check_("yaw: sweeps through the full angle at a wide zoom", `ry ${yy[0].toFixed(1)} -> ${yy[yy.length - 1].toFixed(1)}, zoom ${Math.max(...yz).toFixed(2)}`, yy[0] < -11 && yy[yy.length - 1] > 11 && Math.max(...yz) <= 1.1, "-13 .. +13, wide");
  const cp = solo("cutpush", 1, 3.2, { target: A }), cz = sweep(cp, 1, 3.2, (p) => p.zoom);
  check_("cutpush: arrives ALREADY framed (it is a cut), then pushes", `first frame ${cz[0].toFixed(2)} -> ${cz[cz.length - 1].toFixed(2)}`, cz[0] >= 1.3 && cz[cz.length - 1] > cz[0] + 0.25, "starts >= 1.3, ends > start + 0.25");
}

/* ---- the director: budget, breathing room, variety, the peak rule */
const mkEvents = (D, n, seed) => {
  const ev = [];
  for (let i = 0; i < n; i++) {
    const t = +(1.6 + (D - 3.2) * ((i + 0.5) / n) + ((seed * 7 + i * 3) % 5) * 0.05).toFixed(3);
    ev.push({ t, kind: i % 3 === 2 ? "hover" : "click", target: { x: -400 + ((seed * 131 + i * 197) % 800), y: -120 + ((seed * 53 + i * 71) % 240), z: 60 }, notBefore: Math.max(0, t - 0.7) });
  }
  return ev;
};
const beats = [];
{
  let prev = null, violations = [], budgetBreaks = 0, peakBreaks = 0, nonClickClose = 0, shortCloseBeats = 0;
  for (let i = 0; i < 120; i++) {
    const D = +(3.5 + ((i * 37) % 75) / 10).toFixed(1); // 3.5 .. 10.9 s
    const events = mkEvents(D, 1 + (i % 5), i);
    const p = plan({ duration: D, events, index: i, prev });
    beats.push(p);
    for (const v of check(p)) violations.push(`beat ${i} (${D}s, ${p.style}): ${v}`);
    const st = stats(p);
    if (D < LIMITS.closeMinBeat && st.close > 0) shortCloseBeats++;
    for (const s of p.shots) {
      if (MOVES[s.move].semantics.zoom === "close") {
        const e = events.find((x) => x.target === s.target);
        if (!e || e.kind !== "click") nonClickClose++;
        if (s.t0 + 1e-6 < (e ? e.notBefore : 0)) peakBreaks++;
      }
    }
    if (st.close > Math.max(1, Math.floor(D / LIMITS.closeEvery)) && D >= LIMITS.closeMinBeat) budgetBreaks++;
    prev = p.style;
  }
  check_("director: 120 beats, no rule broken", violations.length ? violations.slice(0, 2).join(" | ") : "0 violations", violations.length === 0, "budget, breathing room, min shot, no repeats, contiguous");
  check_("director: close moves are rationed (<= 1 per 6 s)", `${budgetBreaks} beats over budget`, budgetBreaks === 0, "0");
  check_("director: no close move in a beat under 4.5 s", `${shortCloseBeats} short beats with one`, shortCloseBeats === 0, "0");
  check_("director: a close move only ever lands on a CLICK", `${nonClickClose} on a hover / nothing`, nonClickClose === 0, "0 (the click is the cut point)");
  check_("director: the peak rule - a move aims only after the element has arrived", `${peakBreaks} early`, peakBreaks === 0, "0");
  const same = beats.filter((b, i) => i > 0 && b.style === beats[i - 1].style).length;
  check_("director: no two consecutive beats share a style", `${same} repeats in 120`, same === 0, "0");
  const closeBeats = beats.filter((b) => stats(b).close > 0).length;
  check_("director: close beats stay within the share (zoom means something)", `${closeBeats} of 120 = ${(closeBeats / 120 * 100).toFixed(0)} %`, closeBeats / 120 <= LIMITS.filmCloseShare, `<= ${LIMITS.filmCloseShare * 100} %`);
  const film = beats.slice(0, 30), used = new Set(film.flatMap((b) => b.shots.map((s) => s.move)));
  check_("director: a 30-beat film uses at least four different moves", [...used].join(", "), used.size >= LIMITS.filmMoves, `>= ${LIMITS.filmMoves}`);
  const styles = new Set(beats.map((b) => b.style));
  check_("director: every style gets dealt", [...styles].join(", "), STYLE_ORDER.every((s) => styles.has(s)), STYLE_ORDER.join(", "));
  const breathShare = beats.map((b) => stats(b).breathingShare), minShare = Math.min(...beats.filter((b) => stats(b).close > 0).map((b) => stats(b).breathingShare));
  check_("director: close beats keep their breathing room", `min ${(minShare * 100).toFixed(0)} %`, minShare >= LIMITS.breathingShare - 1e-9, `>= ${LIMITS.breathingShare * 100} %`);
  check_("director: deterministic", "identical twice", JSON.stringify(plan({ duration: 8, events: mkEvents(8, 3, 4), index: 4, prev: null })) === JSON.stringify(plan({ duration: 8, events: mkEvents(8, 3, 4), index: 4, prev: null })), "same beat, same camera");
  const sh = styleFor(3, 3.0, null);
  check_("director: a beat too short for a close move gets a calm style", sh, !STYLES[sh].close, "no close style under 4.5 s");
}

/* ---- the camera: continuity, hand-overs, the cut, the click punch */
{
  for (const style of STYLE_ORDER) {
    const events = [
      { t: 2.0, kind: "click", target: A, notBefore: 1.2 },
      { t: 4.6, kind: "click", target: B, notBefore: 3.6 },
      { t: 6.2, kind: "hover", target: A, notBefore: 5 },
    ];
    const p = plan({ duration: 9, events, index: 0, style });
    const c = cam.build({ ...p, punch: [] }, ctx);
    let step = 0, vj = 0, prev = c.at(0), pv = null, atT = 0, jumps = [];
    for (let t = DT; t <= 9; t += DT) {
      const q = c.at(t), d = Math.hypot(q.x - prev.x, q.y - prev.y, (q.z - prev.z) * 0.5) + Math.abs(q.zoom - prev.zoom) * 400;
      if (d > 60) jumps.push(+t.toFixed(3));
      step = Math.max(step, d);
      const v = d / DT; if (pv !== null) vj = Math.max(vj, Math.abs(v - pv)); pv = v; prev = q;
    }
    const cut = p.shots.find((s) => s.move === "cutpush");
    const expected = cut ? [+cut.t0.toFixed(3)] : [];
    const okJumps = jumps.every((j) => expected.some((e) => Math.abs(j - e) < 0.02)) && (!cut || jumps.length >= 1);
    check_(`camera, style "${style}": continuous everywhere except a cut`, `${jumps.length} jump(s)${jumps.length ? " at " + jumps.join(", ") : ""}${cut ? ` (the cut is at ${expected[0]})` : ""}; max step ${step.toFixed(1)}`, okJumps, cut ? "only the cut" : "none");
  }
  // a hand-over (push -> pan) is continuous through the blend
  const p = { duration: 8, blend: 0.7, shots: [{ move: "push", t0: 1, t1: 3.6, side: 1, target: A }, { move: "pan", t0: 3.6, t1: 5.1, side: 1, from: A, to: B, target: B }], punch: [] };
  const c = cam.build(p, ctx);
  let worst = 0; for (let t = 3.3; t < 4.6; t += DT) { const a = c.at(t), b = c.at(t + DT); worst = Math.max(worst, Math.hypot(a.x - b.x, a.y - b.y) + Math.abs(a.zoom - b.zoom) * 400); }
  check_("a hand-over blends smoothly (push into pan)", `max step ${worst.toFixed(1)} per 1/240 s`, worst < 25, "< 25 (no snap)");
  const w = c.baseIntentAt(3.6), w0 = c.baseIntentAt(3.6 - 1e-4);
  check_("a hand-over is continuous at its first instant", `zoom ${w0.zoom.toFixed(4)} -> ${w.zoom.toFixed(4)}`, Math.abs(w.zoom - w0.zoom) < 5e-3, "no jump at t0");
  // the click punch
  const pp = { duration: 6, blend: 0.7, shots: [{ move: "breathe", t0: 0, t1: 6, side: 1 }], punch: [3], punchAmount: 0.05 };
  const cp = cam.build(pp, ctx);
  const base = cp.baseIntentAt(3.07).zoom, punched = cp.intentAt(3.07).zoom, later = cp.intentAt(4.6).zoom - cp.baseIntentAt(4.6).zoom;
  check_("the click punches the frame", `+${(punched - base).toFixed(3)} zoom at the click`, punched - base > 0.03 && punched - base <= 0.06, "a small kick (~0.05)");
  check_("the punch decays and does not stay", `${later.toFixed(4)} 1.6 s later`, Math.abs(later) < 0.004, "~0");
  check_("before the click nothing is punched", `${(cp.intentAt(2.9).zoom - cp.baseIntentAt(2.9).zoom).toFixed(5)}`, cp.intentAt(2.9).zoom === cp.baseIntentAt(2.9).zoom, "= 0");
  // a seek is exact
  const t1 = [4.4, 1.2, 3.07].map((t) => cp.at(t).z), t2 = [3.07, 1.2, 4.4].map((t) => cp.at(t).z).reverse();
  check_("the camera is a pure function of time (any seek order)", t1.every((v, i) => v === t2[i]) ? "identical" : "differs", t1.every((v, i) => v === t2[i]), "exact");
}

/* ---- the film mapping */
{
  const p = plan({ duration: 8, events: [{ t: 2.4, kind: "click", target: { stop: 0 }, notBefore: 1.6 }, { t: 5.0, kind: "click", target: { stop: 1 }, notBefore: 4 }], index: 1, style: "pushpan" });
  const fs = filmShots(p, { stopOf: (t) => t.stop });
  check_("film mapping: every shot has what the runtime needs", fs.map((s) => `${s.move}@${s.at}`).join(" "), fs.every((s) => ["in", "out", "wide"].includes(s.mode) && typeof s.zoom === "number" && typeof s.dur === "number" && ["smooth", "wide", "cut"].includes(s.ease)), "mode, zoom, dur, ease");
  check_("film mapping: moves that aim name their stop; the wide ones do not", fs.map((s) => s.stop ?? "-").join(","), fs.filter((s) => s.mode === "in").every((s) => s.stop !== undefined) && fs.filter((s) => s.mode !== "in").every((s) => s.stop === undefined), "stop on in-shots only");
  const closeZ = fs.filter((s) => MOVES[s.move].semantics.zoom === "close").map((s) => s.zoom), gentleZ = fs.filter((s) => MOVES[s.move].semantics.zoom === "gentle").map((s) => s.zoom);
  check_("film mapping: only close moves reach the close zoom", `close ${closeZ.join(",")} / gentle ${gentleZ.join(",")}`, closeZ.every((z) => z >= 1.8) && gentleZ.every((z) => z <= 1.2), "close >= 1.8, gentle <= 1.2");
}

const w = Math.max(...rows.map((r) => r.name.length));
console.log("\nCamera test\n");
for (const r of rows) console.log(`  ${r.ok ? "✓" : "✗"} ${r.name.padEnd(w)}  ${String(r.value).padEnd(60)} (${r.limit})`);
if (failed) { console.error(`\n✗ camera test: ${failed} check(s) failed. See docs/CAMERA.md.`); process.exit(1); }
console.log("\n✓ camera test clean");
