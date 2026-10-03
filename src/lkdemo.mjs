/**
 * lkdemo.mjs - the transition demo's shared spec: two compositions joined by a transition chosen BY NAME
 * from src/transitions/ (docs/TRANSITION_FX.md).
 *
 *   A  the 5-second pointer lab: five red dots at five depths (extruded: they have thickness).
 *   B  a second sample: four design-system cards at four depths (extruded slabs).
 *
 * ONE pointer model runs the whole film, on the speed-ramped clock tau(t). The POINTER and its click
 * rings live in the PARENT, on layers above every transition layer, so no transition can hide the
 * pointer: it crosses the cut in plain sight, and only the scene it is flying through changes.
 */

import { fxModule } from "./lkfx.mjs";
import { LAB } from "./lkpointer.mjs";
import { C } from "./lkdesign.mjs";
import { get, DEFAULT } from "./transitions/index.mjs";
import * as TABLE from "./components/table/index.mjs";
import { springModule } from "./lkspring.mjs";

const FX = fxModule();

/** The demo for transition `id` (default: pixel-wipe). Everything that depends on the transition comes from it. */
export function makeDemo(id = DEFAULT) {
  const T = get(id);
  const p = T.params;
  const seam = 5.0; // the transition fires here: the moment the next composition starts
  const timing = T.timing(p, seam);
  return {
    id,
    transition: T,
    params: p,
    duration: 10,
    seam,
    warp: { seam, rampOut: p.ramp.out, rampIn: p.ramp.in, peak: p.ramp.peak },
    rush: { seam, rampOut: p.ramp.out, rampIn: p.ramp.in, amount: p.ramp.rush },
    bStart: timing.bStart,
    aEnd: timing.aEnd,
    complete: timing.complete,
    /** the click: three 8-bit pixel rings radiating out from the press (cell = the pixel size; core white, stroke blue, outline black) */
    rings: { count: 3, radius: 150, life: 0.62, stagger: 0.1, cell: 4 },
    /**
     * Sample B: the TABLE component (rows rise one at a time, each an owned slab) with its FAMILY around it
     * (components/family: satellites + one ear, at the shared layout slots). The stage is white, so the table
     * is the blue card. `at` is the table's start inside B (its own clock); `rowAt` gives each row.
     */
    table: { x: -60, y: -40, z: -90, s: 0.84, at: 0.2, tone: "white" },
    family: { names: ["agencyLeads", "agencyCalls", "agencyCampaigns", "agencyOpportunities"], ear: "ear4", tone: "white" },
    /** where the hand goes, in B's REAL time: a row and a column, hovered (open hand) or pressed (rings) */
    bEvents: [
      { row: 0, col: 1, arrive: 6.55, click: false },
      { row: 1, col: 1, arrive: 7.45, click: true },
      { row: 2, col: 2, arrive: 8.35, click: false },
      { row: 0, col: 0, arrive: 9.1, click: true },
    ],
    front: 70,
    /** item and stage colours, so a click picks white and/or blue for what it pressed */
    colors: { dot: "#E5322D", card: C.blue, stageA: C.blue, stageB: "#FFFFFF" },
  };
}

export const DEMO = makeDemo();
export const WARP = FX.makeWarp(DEMO.warp);

/** The whole film's pointer spec, in tau: A's five dots (already in tau) then B's four cards. */
export function demoSpec(demo = DEMO) {
  const warp = FX.makeWarp(demo.warp);
  const events = LAB.events().map((e) => ({
    ...e,
    side: "a",
    rings: FX.ringColors(demo.colors.dot, demo.colors.stageA, C.blue),
  }));
  const g = TABLE.geometry(TABLE.sample);
  for (const b of demo.bEvents) {
    const T = demo.table, c = g.rowCentre(b.row, b.col);
    const rise = 0.55, hold = b.click ? 0.4 : 0.3, fall = 0.55;
    const tau = (t) => warp.tau(t);
    const e = {
      t0: tau(b.arrive - rise), tA: tau(b.arrive), tB: tau(b.arrive + hold), t1: tau(b.arrive + hold + fall),
      // the world point of that cell: the table's holder + the measured offset from its centre, scaled
      p: { x: T.x + c.x * T.s, y: T.y + c.y * T.s, z: T.z + demo.front },
      zoom: b.click ? 2.0 : 1.7,
      row: b.row,
      side: "b",
      rings: FX.ringColors(demo.colors.card, demo.colors.stageB, C.blue),
    };
    if (b.click) e.click = tau(b.arrive + 0.2);
    else e.circle = { r: 50, period: 1.0 };
    events.push(e);
  }
  return { orbit: LAB.orbit, events };
}

/**
 * THE PEAK RULE for the demo: REAL time at which row `i` of B's table is at the peak of its overshoot. B runs on the
 * speed-ramped clock, so its own time `inner` is mapped back to real time (the ramp is still on at the start of B).
 */
export function rowPeakReal(demo, i) {
  const sp = springModule(), warp = FX.makeWarp(demo.warp);
  const inner = demo.table.at + TABLE.rowAt(i) + sp.peakDelay("row", 0.5);
  const want = warp.tau(demo.bStart) + inner;
  let lo = demo.bStart, hi = demo.duration;
  for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (warp.tau(mid) < want) lo = mid; else hi = mid; }
  return +((lo + hi) / 2).toFixed(3);
}

/** B's own (inner) time at REAL time `t`: B runs on the speed-ramped clock from its start. */
export function innerTime(demo, t) {
  const warp = FX.makeWarp(demo.warp);
  return +(warp.tau(t) - warp.tau(demo.bStart)).toFixed(3);
}

/** When row `i`'s entrance has FINISHED (inner time): the rise, then the settle back flat. Activation must start after. */
export const rowEntranceEnd = (demo, i) => +(demo.table.at + TABLE.rowAt(i) + 0.55 + 0.45).toFixed(3);
