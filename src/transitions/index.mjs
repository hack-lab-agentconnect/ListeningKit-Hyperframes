/**
 * transitions/ - the registry of cuts between compositions, called by name.
 *
 *   import { TRANSITIONS, get, list, validate } from "./transitions/index.mjs";
 *   const t = get("pixel-wipe");           // throws a helpful error for an unknown name
 *   t.phases(t.params)                     // the order things happen, relative to the seam
 *   t.timing(t.params, seam)               // when A must stay mounted until, and B must mount from
 *   t.parent({ params, W, H })             // what the parent composition needs to run it
 *
 * A storyboard (or a build script) names a transition; it does not know how it is built. To add one:
 * write src/transitions/<id>.mjs with the contract below, register it here, and `npm run test:fx`
 * will check the contract. See README.md in this directory.
 */

import pixelWipe from "./pixel-wipe.mjs";
import scaleSwap from "./scale-swap.mjs";

export const TRANSITIONS = {
  [pixelWipe.id]: pixelWipe,
  [scaleSwap.id]: scaleSwap,
};

export const DEFAULT = "pixel-wipe";

export function get(id) {
  const t = TRANSITIONS[id];
  if (!t) throw new Error(`unknown transition "${id}". Available: ${Object.keys(TRANSITIONS).join(", ")}`);
  return t;
}

/** One line each: id, kind, whether it is a J-cut, and what it is for. */
export const list = () =>
  Object.values(TRANSITIONS).map((t) => ({ id: t.id, kind: t.semantics.kind, jcut: t.semantics.jcut, order: t.semantics.order, use: t.semantics.use }));

/**
 * The contract. Returns a list of problems (empty = valid). Used by `npm run test:fx`.
 *   id, summary                        strings
 *   semantics { kind, jcut, use, avoid, pairs, needs[], order }
 *   params { ramp {out,in,peak,rush}, flash }
 *   phases(p) -> [{ id, from, to }]    in ORDER (non-decreasing `from`), each from <= to, relative to the seam
 *   timing(p, seam) -> { bStart, aEnd, complete }   a J-cut overlaps (bStart < aEnd); a swap does not need to
 *   parent(ctx) -> { css, html, groupAStyle, groupBStyle, setupJS, frameJS }   all strings
 */
export function validate(t) {
  const bad = [];
  const need = (cond, msg) => { if (!cond) bad.push(msg); };
  need(typeof t.id === "string" && t.id, "id");
  need(typeof t.summary === "string" && t.summary, "summary");
  const s = t.semantics || {};
  need(["wipe", "swap"].includes(s.kind), "semantics.kind is wipe | swap");
  need(typeof s.jcut === "boolean", "semantics.jcut is a boolean");
  need(typeof s.use === "string" && s.use.length > 20, "semantics.use says when to use it");
  need(typeof s.avoid === "string" && s.avoid.length > 20, "semantics.avoid says when not to");
  need(typeof s.order === "string" && s.order.includes(">"), "semantics.order lists the phases");
  need(Array.isArray(s.needs), "semantics.needs is a list");
  const p = t.params || {};
  need(p.ramp && ["out", "in", "peak", "rush"].every((k) => typeof p.ramp[k] === "number"), "params.ramp has out, in, peak, rush");
  need(p.flash && typeof p.flash.peak === "number" && typeof p.flash.duration === "number", "params.flash has peak, duration");
  let ph = [];
  try { ph = t.phases(p); } catch (e) { bad.push("phases() throws: " + e.message); }
  need(ph.length >= 3, "phases() lists at least three phases");
  need(ph.every((x) => x.from <= x.to), "every phase has from <= to");
  need(ph.every((x, i) => i === 0 || x.from >= ph[i - 1].from), "phases are listed in order of their start");
  need(s.order === ph.map((x) => x.id).join(" > "), `semantics.order matches phases() (${ph.map((x) => x.id).join(" > ")})`);
  let tm = {};
  try { tm = t.timing(p, 5); } catch (e) { bad.push("timing() throws: " + e.message); }
  need(typeof tm.bStart === "number" && typeof tm.aEnd === "number" && typeof tm.complete === "number", "timing() returns bStart, aEnd, complete");
  need(s.jcut ? tm.bStart < tm.aEnd : true, "a J-cut mounts B before A has ended");
  need(tm.complete >= tm.bStart, "complete is not before bStart");
  let part = {};
  try { part = t.parent({ params: p, W: 1920, H: 1080 }); } catch (e) { bad.push("parent() throws: " + e.message); }
  for (const k of ["css", "html", "groupAStyle", "groupBStyle", "setupJS", "frameJS"]) need(typeof part[k] === "string", `parent() returns ${k}`);
  return bad;
}
