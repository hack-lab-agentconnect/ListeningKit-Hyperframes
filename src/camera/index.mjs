/**
 * camera/ - the camera director's vocabulary: individual moves, called by name, blended into one camera.
 *
 *   import { MOVES, get, list, validate, cameraRuntimeJS, cameraModule } from "./camera/index.mjs";
 *
 * A MOVE is one way the camera behaves for a stretch of a beat (follow, breathe, push, pull, pan, yaw, cutpush). Each is a
 * module in `moves/` with the same contract as a transition: semantics (what it is for, what it is not), params, a pure
 * `pose(t, shot, ctx, H)`, and a `film(shot, ctx)` mapping for the film runtime. `director.mjs` PLANS a beat's moves under a
 * zoom budget and a variety grammar; `cameraModule` EVALUATES a plan: pure functions of time, blending between moves.
 *
 * WHY A VOCABULARY. One camera behaviour (follow the pointer and push on every stop) zoomed so often that no zoom meant
 * anything: the picture lost its hierarchy. Variety is not decoration here, it is how a close shot gets to mean "this one".
 *
 * BLENDING. Moves return an INTENT { P, zoom, rx, ry } (the point to frame, how close, the tilt), never a finished pose.
 * Where one move hands over to the next, the two intents are mixed with a weight that rises smoothly from 0 to 1 over the
 * shot's `blend` seconds (zero slope at both ends), then the camera pose is computed ONCE from the mixed intent. So a
 * hand-over is continuous in position and velocity; a `cut` (blend 0) is the only discontinuity, and it is a decision.
 *
 * THE CLICK is shared with the pointer: a click can be the cut point (`cutpush`) and always adds a small zoom PUNCH to
 * whatever the camera is doing, so the click is felt in the frame whatever the move.
 *
 * `cameraModule(ptr, spr, moves)` is one self-contained function: tests call it directly and `cameraRuntimeJS` serialises
 * the same function (and every move's `pose`) into a page as `__cam`, so what is tested is what renders.
 */

import follow from "./moves/follow.mjs";
import breathe from "./moves/breathe.mjs";
import push from "./moves/push.mjs";
import pull from "./moves/pull.mjs";
import pan from "./moves/pan.mjs";
import yaw from "./moves/yaw.mjs";
import cutpush from "./moves/cutpush.mjs";

export const MOVES = { follow, breathe, push, pull, pan, yaw, cutpush };

export function get(id) {
  const m = MOVES[id];
  if (!m) throw new Error(`unknown camera move "${id}". Available: ${Object.keys(MOVES).join(", ")}`);
  return m;
}

export const list = () => Object.values(MOVES).map((m) => ({ id: m.id, kind: m.semantics.kind, zoom: m.semantics.zoom, breathing: m.semantics.breathing, use: m.semantics.use }));

/** The kinds of move, and the zoom classes: `close` moves are rationed by the director; `breathing` moves are the rest. */
export const KINDS = ["follow", "breathe", "push", "pull", "pan", "yaw", "cut"];
export const ZOOMS = ["none", "gentle", "close"];

/**
 * The contract. Returns a list of problems (empty = valid). Used by test-camera / lint-camera.
 *   id, summary                      strings
 *   semantics { kind, zoom, breathing, use, avoid, pairs }
 *   params                           object
 *   pose(t, shot, ctx, H) -> { P: {x,y,z}, zoom, rx, ry }     a self-contained arrow function (it is serialised)
 *   film(shot, ctx) -> { mode, fit, zoom, rx, ry, dur, ease, creep }   the film runtime's shot
 */
export function validate(m, name) {
  const bad = [];
  const need = (c, msg) => { if (!c) bad.push(msg); };
  need(m.id === name, `id "${m.id}" must equal its registry name "${name}"`);
  need(typeof m.summary === "string" && m.summary.length > 10, "summary");
  const s = m.semantics || {};
  need(KINDS.includes(s.kind), `semantics.kind is one of ${KINDS.join(" | ")}`);
  need(ZOOMS.includes(s.zoom), `semantics.zoom is one of ${ZOOMS.join(" | ")}`);
  need(typeof s.breathing === "boolean", "semantics.breathing is a boolean (does the move give the eye a rest?)");
  need(typeof s.use === "string" && s.use.length > 20, "semantics.use says when to use it");
  need(typeof s.avoid === "string" && s.avoid.length > 20, "semantics.avoid says when not to");
  need(typeof s.pairs === "string" && s.pairs.length > 5, "semantics.pairs says what it goes with");
  need(m.params && typeof m.params === "object", "params");
  need(typeof m.pose === "function" && /^\s*(\(|\w+\s*=>)/.test(m.pose.toString()), "pose is a self-contained ARROW function (it is serialised into the page)");
  need(typeof m.film === "function", "film(shot, ctx) maps the move to the film runtime");
  if (typeof m.film === "function") {
    const f = m.film({}, { side: 1 });
    need(["in", "out", "wide"].includes(f.mode), "film().mode is in | out | wide");
    need(typeof f.zoom === "number" && typeof f.dur === "number", "film() has zoom and dur");
    need(["smooth", "wide", "cut"].includes(f.ease), "film().ease is smooth | wide | cut");
  }
  need(s.zoom !== "close" || s.breathing === false, "a close move is not a breathing move");
  return bad;
}

/**
 * The runtime. ONE self-contained function: `ptr` is the pointer model's module (for `pose`), `spr` the spring module
 * (for S and pulse), `moves` an object { id: { pose } } of the move poses.
 *
 * plan = { duration, blend, shots: [{ move, t0, t1, blend?, target?, from?, to?, side?, params?, fromZoom?, phase? }],
 *          punch: [click times], punchAmount }
 * ctx  = { follow(t) -> { aim, zoom, rotationX, rotationY }, target(shot) -> {x,y,z} }
 */
export function cameraModule(ptr, spr, moves) {
  const smoother = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
  const H = { S: spr.S, smoother };
  const mixP = (a, b, w) => ({ x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, z: a.z + (b.z - a.z) * w });
  const mix = (a, b, w) => ({ P: mixP(a.P, b.P, w), zoom: a.zoom + (b.zoom - a.zoom) * w, rx: a.rx + (b.rx - a.rx) * w, ry: a.ry + (b.ry - a.ry) * w });

  function build(plan, ctx) {
    const shots = plan.shots.slice().sort((a, b) => a.t0 - b.t0);
    const intentOf = (shot, t) => moves[shot.move].pose(t, shot, ctx, H);

    /** which shot is active at t (the last one that has started), and its index */
    function indexAt(t) {
      let k = 0;
      for (let i = 0; i < shots.length; i++) if (shots[i].t0 <= t + 1e-9) k = i;
      return k;
    }

    /** the blended intent at t, WITHOUT the click punch */
    function baseIntentAt(t) {
      const i = indexAt(t), s = shots[i], cur = intentOf(s, t);
      const bl = s.blend === undefined ? plan.blend : s.blend;
      if (i > 0 && bl > 0 && t < s.t0 + bl) return mix(intentOf(shots[i - 1], t), cur, smoother((t - s.t0) / bl));
      return cur;
    }

    /** the click's share of the frame: every click adds a small zoom punch (a pulse), whatever the move is */
    const punchAt = (t) => (plan.punch || []).reduce((z, c) => z + (plan.punchAmount ?? 0.05) * spr.pulse(t - c, 3.4), 0);

    function intentAt(t) {
      const b = baseIntentAt(t);
      return { P: b.P, zoom: b.zoom + punchAt(t), rx: b.rx, ry: b.ry };
    }

    /** the camera pose at t (the stage's x, y, z, rotationX, rotationY) plus the intent it came from */
    function at(t) {
      const it = intentAt(t);
      return Object.assign(ptr.pose(it.P, it.zoom, it.rx, it.ry), { intent: it, zoom: it.zoom });
    }

    return { at, intentAt, baseIntentAt, indexAt, shots, shotAt: (t) => shots[indexAt(t)] };
  }

  return { build, smoother, H };
}

/** Every move's `pose`, as source: { follow: { pose: (...) => ... }, ... }. */
const movesJS = () => "{" + Object.values(MOVES).map((m) => `${JSON.stringify(m.id)}: { pose: ${m.pose.toString()} }`).join(", ") + "}";

/** The page runtime: requires `__ptr` (pointerRuntimeJS) and `__spr` (springRuntimeJS) to be defined first. */
export const cameraRuntimeJS = `const __camMoves = ${movesJS()};
const __cam = (${cameraModule.toString()})(__ptr, __spr, __camMoves);`;
