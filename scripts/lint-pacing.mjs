#!/usr/bin/env node
/**
 * Pacing lint for the ListeningKit HyperFrames series.
 *
 * Enforces docs/MOTION_CRITERIA.md. Design lint (lint-design.mjs) says what a frame
 * may LOOK like; this says how long a frame may go WITHOUT CHANGING. It exists because
 * the first generation of these films held single states for 8-23 seconds, and nothing
 * in the build could say so: every individual frame passed.
 *
 * It does not guess. For every beat it asks the same planner the build uses
 * (src/lkdirector.mjs planFor) what will happen and when - entrances pinned to the
 * narration, cursor clicks, camera moves - against the real Deepgram word timings, and
 * fails when there is dead air, a scene with no pointer, or a cut that repeats.
 *
 * Run by `npm run lint` and lefthook. No browser, no render: it takes about a second.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ARCS } from "../src/storyboards.mjs";
import { beats as SCENES } from "../src/scenes.mjs";
import { planFor, HAND, ENTRY_PEAK } from "../src/lkdirector.mjs";
import { satellitesFor } from "../src/lksatellites.mjs";
import { CLOCK } from "../src/lkclock.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The numbers, with the criterion each one enforces (docs/MOTION_CRITERIA.md). */
const LIMITS = {
  maxBeat: 10.5, // M1  hard ceiling: no single scene holds longer than this
  meanBeat: 7.0, // M1  the film as a whole cuts at least this often
  maxGap: 3.4, // M2  longest stretch (s) with no planned event inside a beat
  firstItem: 0.7, // M2b the first item enters within this long of the beat's own entrance
  minStops: 1, // M4  every narrated beat has a pointer with something to press
  toneRepeat: 0.2, // M7  at most this share of seams may fail to alternate the stage
  satelliteShare: 0.8, // M9  share of beats carrying a depth set
  // M14 (the peak rule) has no limit to tune: the pointer and camera wait for the entrance's overshoot peak (lkspring + lkdirector ENTRY_PEAK)
};

let failures = 0;
const fail = (id, msg) => {
  failures++;
  console.error(`  ✗ ${id}: ${msg}`);
};

for (const [slug, arc] of Object.entries(ARCS)) {
  const timingPath = path.join(ROOT, "assets", "timing", `${slug}.json`);
  if (!fs.existsSync(timingPath)) {
    fail("timing-missing", `${slug}: assets/timing/${slug}.json not found`);
    continue;
  }
  const words = JSON.parse(fs.readFileSync(timingPath, "utf8")).results.channels[0].alternatives[0].words;
  const seq = [...arc.beats, arc.outro];
  console.log(`\n${slug}  (${arc.beats.length} beats)`);

  let withSats = 0;
  let toneRepeats = 0;
  let total = 0;

  arc.beats.forEach((b, i) => {
    const label = `${slug} #${i} t=${b.t} ${b.kind}`;
    if (!SCENES[b.kind]) return fail("unknown-kind", `${label}: no scene factory "${b.kind}"`);
    const nextT = seq[i + 1].t;
    const dur = nextT - b.t;
    total += dur;
    if (dur > LIMITS.maxBeat) fail("M1-beat-too-long", `${label} holds ${dur.toFixed(1)}s (max ${LIMITS.maxBeat}s) - split it at a sentence boundary`);
    if (i > 0 && b.tone === seq[i - 1].tone) toneRepeats++;

    const sats = satellitesFor(slug, b, i);
    if (sats) withSats++;
    const plan = planFor(b, words, nextT, { lead: CLOCK.LEAD, enter: CLOCK.ENTER, index: i, sats, prevCursor: null });

    // Every moment something is planned to MOVE: item entrances, the pointer's clicks,
    // the camera's moves. Beat start and the seam bound the interval.
    const events = [
      CLOCK.ENTER,
      ...(plan.slots || []),
      ...plan.stops.map((s) => s.at),
      ...plan.camera.shots.map((s) => s.at + CLOCK.ENTER),
      dur,
    ].sort((x, y) => x - y);
    let worst = 0;
    let at = 0;
    for (let k = 1; k < events.length; k++) {
      const gap = events[k] - events[k - 1];
      if (gap > worst) {
        worst = gap;
        at = events[k - 1];
      }
    }
    if (worst > LIMITS.maxGap) fail("M2-dead-air", `${label}: ${worst.toFixed(1)}s with nothing planned from +${at.toFixed(1)}s (max ${LIMITS.maxGap}s)`);
    // M2b: a scene is never empty. If its items are retimed to the narration, the first one
    // must be on its way in almost immediately - never seconds into the beat.
    if (plan.slots && plan.slots[0] > CLOCK.ENTER + LIMITS.firstItem) {
      fail("M2-empty-scene", `${label}: first item enters at +${plan.slots[0].toFixed(1)}s - the scene is empty until then (max +${(CLOCK.ENTER + LIMITS.firstItem).toFixed(1)}s)`);
    }
    if (plan.stops.length < LIMITS.minStops) fail("M4-no-pointer", `${label}: the pointer has nothing to press`);
    // M14: THE PEAK RULE. The pointer is on screen all the time, the elements are not: the hand lands on an
    // item, and the camera pushes in on it, only once the item's entrance mass is at the peak of its overshoot.
    plan.stops.forEach((st, k) => {
      if (st.peakAt == null) return;
      if (st.at - HAND < st.peakAt - 0.01) fail("M14-before-peak", `${label} stop ${k}: the hand lands at +${(st.at - HAND).toFixed(2)}s, before item ${st.item}'s overshoot peak at +${st.peakAt.toFixed(2)}s`);
    });
    plan.camera.shots.filter((sh) => sh.mode === "in").forEach((sh) => {
      const st = plan.stops[sh.stop];
      if (st && st.peakAt != null && sh.at + plan.camera.enter < st.peakAt - 0.01) fail("M14-before-peak", `${label} camera push ${sh.stop}: starts at +${(sh.at + plan.camera.enter).toFixed(2)}s, before item ${st.item}'s overshoot peak at +${st.peakAt.toFixed(2)}s`);
    });
  });

  const mean = total / arc.beats.length;
  console.log(`  mean beat ${mean.toFixed(1)}s, longest ${Math.max(...arc.beats.map((b, i) => seq[i + 1].t - b.t)).toFixed(1)}s, depth sets on ${withSats}/${arc.beats.length}, stage repeats ${toneRepeats}`);
  if (mean > LIMITS.meanBeat) fail("M1-mean-too-long", `${slug}: mean beat ${mean.toFixed(1)}s (max ${LIMITS.meanBeat}s)`);
  if (toneRepeats / arc.beats.length > LIMITS.toneRepeat) fail("M7-tone-repeats", `${slug}: ${toneRepeats} seams do not alternate the stage (max ${Math.floor(LIMITS.toneRepeat * arc.beats.length)})`);
  if (withSats / arc.beats.length < LIMITS.satelliteShare) fail("M9-depth-set", `${slug}: only ${withSats}/${arc.beats.length} beats carry a depth set`);
}

if (failures) {
  console.error(`\n✗ pacing lint: ${failures} violation(s). See docs/MOTION_CRITERIA.md.`);
  process.exit(1);
}
console.log("\n✓ pacing lint clean");
