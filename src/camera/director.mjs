/**
 * camera/director.mjs - plans the camera for a beat: which moves, when, and how they hand over.
 *
 * The director is the half of the camera that DECIDES. Given a beat's length and its events (the pointer's clicks and
 * hovers, each at a world point or a film stop), it picks a STYLE (a small grammar of moves), lays the moves out in time,
 * and enforces the rules that keep a film readable:
 *
 *   ZOOM BUDGET     at most one CLOSE move (push, cutpush) per 6 s of beat, and none in a beat shorter than 4.5 s.
 *                   A close shot is a claim: "this is the thing". They cannot all be.
 *   BREATHING ROOM  at least 40 % of a beat is breathing moves (breathe, pull, yaw): the eye rests, the frame stays alive.
 *   VARIETY         a beat's style differs from the previous beat's; no two identical moves in a row inside a beat; a
 *                   film uses at least four different moves; at most 45 % of beats carry a close move.
 *   MIN SHOT        a move lasts at least 1.2 s (a cut-push's hard cut excepted): shorter reads as a twitch.
 *   PEAK RULE       a move that aims at an element starts only after that element's entrance has peaked (event.notBefore).
 *   THE CLICK       the click is the shared beat: it is the cut point of a cutpush, and every click adds a zoom punch.
 *
 * Pure planning: no DOM, no randomness; the same beat always gets the same camera.
 */

import { MOVES } from "./index.mjs";

export const LIMITS = {
  closeEvery: 6, // seconds of beat per close move
  closeMinBeat: 4.5, // no close move in a beat shorter than this
  breathingShare: 0.4, // minimum share of a beat that is breathing moves
  minShot: 1.2,
  blend: 0.7, // seconds a hand-over between two moves takes (a cut is 0)
  filmCloseShare: 0.45, // at most this share of a film's beats carry a close move
  filmMoves: 4, // a film uses at least this many different moves
  maxZoom: 2.0,
};

/** The order styles are dealt in, beat by beat. Two of five carry a close move (40 %), within the film budget. */
export const STYLE_ORDER = ["follow", "pushpan", "breathe", "cutpush", "yawsweep"];

export const STYLES = {
  breathe: { close: false, summary: "breathe throughout; the clicks are felt as zoom punches only" },
  follow: { close: false, summary: "breathe, then trail the pointer at the resting zoom, then breathe" },
  pushpan: { close: true, summary: "breathe, push in on the first focus, pan to the next, pull out" },
  cutpush: { close: true, summary: "breathe, CUT to the focus on its click, push, pull out" },
  yawsweep: { close: false, summary: "a wide yaw sweep around the composition, then follow, then breathe" },
};

/** Which style a beat gets: the dealt one, unless it needs a close move the beat is too short for, or repeats the last. */
export function styleFor(index, duration, prev) {
  let k = index % STYLE_ORDER.length, s = STYLE_ORDER[k];
  for (let guard = 0; guard < STYLE_ORDER.length; guard++) {
    const ok = (!STYLES[s].close || duration >= LIMITS.closeMinBeat) && s !== prev;
    if (ok) return s;
    k = (k + 1) % STYLE_ORDER.length; s = STYLE_ORDER[k];
  }
  return "follow";
}

/**
 * Plan one beat.
 *   spec: { duration, events: [{ t, kind: "click" | "hover", target: {x,y,z} | { stop }, notBefore? }], index, prev?, style?, side? }
 *   returns { duration, style, side, blend, shots: [{ move, t0, t1, blend?, target?, from?, to?, side, fromZoom? }], punch: [t...] }
 */
export function plan(spec) {
  const D = spec.duration, side = spec.side ?? (spec.index % 2 ? -1 : 1);
  const events = (spec.events || []).slice().sort((a, b) => a.t - b.t);
  const clicks = events.filter((e) => e.kind === "click");
  // a beat too short for an edge shot, a body and an edge shot (each at least minShot) just breathes
  const style = D < 3 * LIMITS.minShot ? "breathe" : (spec.style || styleFor(spec.index || 0, D, spec.prev));
  const notBefore = (e) => (e && e.notBefore != null ? e.notBefore : 0);
  const raw = [];
  const add = (move, t0, t1, extra = {}) => raw.push({ move, t0, t1, side, ...extra });
  const first = clicks[0], second = clicks[1], last = clicks[clicks.length - 1];
  const edge = LIMITS.minShot; // the opening and closing breath: never shorter than a shot may be

  if (style === "breathe") {
    add("breathe", 0, D);
  } else if (style === "follow") {
    add("breathe", 0, edge); add("follow", edge, D - edge, {}); add("breathe", D - edge, D);
  } else if (style === "yawsweep") {
    add("yaw", 0, Math.min(D * 0.5, 3.6)); add("follow", Math.min(D * 0.5, 3.6), D - edge); add("breathe", D - edge, D);
  } else if (style === "pushpan" && first) {
    const t0 = Math.max(edge, first.t - 0.95, notBefore(first));
    const holdEnd = second ? Math.min(second.t - 0.5, t0 + 2.6) : Math.min(D - edge - 1.2, t0 + 2.4);
    add("breathe", 0, t0);
    add("push", t0, Math.max(t0 + LIMITS.minShot, holdEnd), { target: first.target });
    let cur = Math.max(t0 + LIMITS.minShot, holdEnd);
    if (second && second.t + 0.4 < D - edge - LIMITS.minShot) { add("pan", cur, cur + 1.5, { from: first.target, to: second.target, target: second.target }); cur += 1.5; }
    add("pull", cur, Math.min(D - 0.4, cur + 1.2), { target: (second || first).target });
    add("breathe", Math.min(D - 0.4, cur + 1.2), D);
  } else if (style === "cutpush" && last) {
    const tc = Math.max(edge, last.t, notBefore(last));
    add("breathe", 0, tc);
    add("cutpush", tc, Math.min(D - edge - LIMITS.minShot, tc + 2.2), { target: last.target, blend: 0 });
    const t1 = Math.min(D - edge - LIMITS.minShot, tc + 2.2);
    add("pull", t1, Math.min(D - 0.4, t1 + 1.2), { target: last.target });
    add("breathe", Math.min(D - 0.4, t1 + 1.2), D);
  } else {
    add("breathe", 0, edge); add("follow", edge, D - edge); add("breathe", D - edge, D); // a close style with nothing to aim at
  }

  // normalise: clamp, drop what is too short (a cut excepted), merge identical neighbours, make contiguous
  let shots = raw.map((s) => ({ ...s, t0: Math.max(0, s.t0), t1: Math.min(D, s.t1) })).filter((s) => s.t1 - s.t0 >= LIMITS.minShot - 1e-9 || (s.move === "cutpush" && s.t1 - s.t0 > 0.3));
  shots.sort((a, b) => a.t0 - b.t0);
  const out = [];
  for (const s of shots) {
    const prev = out[out.length - 1];
    if (prev && prev.move === s.move && s.move !== "pan") { prev.t1 = Math.max(prev.t1, s.t1); continue; }
    out.push({ ...s });
  }
  if (!out.length || out[0].t0 > 0) out.unshift({ move: "breathe", t0: 0, t1: out.length ? out[0].t0 : D, side });
  for (let i = 0; i < out.length; i++) {
    out[i].t1 = i + 1 < out.length ? out[i + 1].t0 : D; // contiguous: each shot runs until the next begins
    if (out[i].move === "pull") { const p = out[i - 1]; out[i].fromZoom = p && p.move === "cutpush" ? (p.params && p.params.zoom) || 1.7 : 1.75; }
  }
  // a pull needs a push or cutpush before it (there is nothing to release otherwise)
  for (let i = out.length - 1; i >= 0; i--) if (out[i].move === "pull" && !(out[i - 1] && MOVES[out[i - 1].move].semantics.zoom === "close")) out[i].move = "breathe";
  const merged = [];
  for (const s of out) { const p = merged[merged.length - 1]; if (p && p.move === s.move && s.move !== "pan") p.t1 = s.t1; else merged.push(s); }

  return { duration: D, style, side, blend: LIMITS.blend, shots: merged, punch: clicks.map((c) => c.t), punchAmount: 0.05 };
}

/** Numbers a gate can check: close-move count and seconds, breathing share, distinct moves, shortest shot. */
export function stats(p) {
  const kind = (s) => MOVES[s.move].semantics;
  const close = p.shots.filter((s) => kind(s).zoom === "close");
  const breathing = p.shots.filter((s) => kind(s).breathing).reduce((a, s) => a + (s.t1 - s.t0), 0);
  return {
    close: close.length,
    closeSeconds: close.reduce((a, s) => a + (s.t1 - s.t0), 0),
    breathingShare: breathing / p.duration,
    moves: [...new Set(p.shots.map((s) => s.move))],
    shortest: Math.min(...p.shots.filter((s) => s.move !== "cutpush").map((s) => s.t1 - s.t0)),
    shots: p.shots.length,
    style: p.style,
  };
}

/** The rule set for ONE beat's plan: returns a list of violations (empty = fine). */
export function check(p) {
  const st = stats(p), bad = [];
  const budget = p.duration >= LIMITS.closeMinBeat ? Math.max(1, Math.floor(p.duration / LIMITS.closeEvery)) : 0;
  if (st.close > budget) bad.push(`${st.close} close moves in a ${p.duration.toFixed(1)} s beat (budget ${budget})`);
  if (st.breathingShare < LIMITS.breathingShare - 1e-9 && st.close > 0) bad.push(`only ${(st.breathingShare * 100).toFixed(0)} % breathing room (min ${LIMITS.breathingShare * 100} %)`);
  if (st.shortest < LIMITS.minShot - 1e-9) bad.push(`a move lasts ${st.shortest.toFixed(2)} s (min ${LIMITS.minShot} s)`);
  for (let i = 1; i < p.shots.length; i++) if (p.shots[i].move === p.shots[i - 1].move && p.shots[i].move !== "pan") bad.push(`two ${p.shots[i].move} in a row`);
  for (let i = 1; i < p.shots.length; i++) if (Math.abs(p.shots[i].t0 - p.shots[i - 1].t1) > 1e-6) bad.push("shots are not contiguous");
  return bad;
}

/**
 * Map a plan onto the FILM runtime's shots (lkdirector: one GSAP tween per shot). A move that aims at something refers to a
 * stop by index; the others frame the whole composition. Times are the plan's (relative to the beat's entrance).
 *   stopOf(target) -> the stop index for { stop } targets
 */
export function filmShots(p, { stopOf } = {}) {
  const sideCtx = { side: p.side };
  return p.shots.map((s, i) => {
    const f = MOVES[s.move].film(s, sideCtx);
    const aims = f.mode === "in";
    const target = s.move === "pan" ? s.to : s.target;
    return { at: +s.t0.toFixed(3), move: s.move, ...f, stop: aims && target && stopOf ? stopOf(target) : undefined };
  });
}
