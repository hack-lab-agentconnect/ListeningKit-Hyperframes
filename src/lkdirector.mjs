/**
 * lkdirector.mjs — the pacing layer. Everything that makes a beat MOVE for as long
 * as it is on screen, instead of for the first three seconds of it.
 *
 * WHY THIS FILE EXISTS
 * A beat in this series carries 2–4 sentences of narration, 8–20 seconds. Every
 * scene factory in scenes.mjs animated its content in over the first ~3 seconds and
 * then idled on a yoyo float until the cut. So a 15-second beat was a 3-second
 * animation and a 12-second photograph. The criteria in docs/MOTION_CRITERIA.md
 * (M1–M7) say what has to be true instead; this file is how they are met without
 * hand-authoring a timeline per beat.
 *
 * THREE JOBS, ALL DRIVEN BY THE DEEPGRAM WORD TIMINGS
 *
 *   1. RETIME  Entrances are re-pinned to the narration. Item i of a beat (pill i,
 *              step card i, chip i, link i …) enters when the narrator reaches the
 *              i-th clause, not 0.4s after the beat starts. The scene factories are
 *              untouched: the director shifts every tween that targets an item, so
 *              the same code serves a 5s beat and a 15s one.
 *   2. CAMERA  A cut every clause (M1): the stage frame punches in on whatever the
 *              narration is on, pulls back, punches in on the next. Pure transform
 *              on the stage wrapper, so it composes with every scene's own motion.
 *   3. CURSOR  On UI beats a real cursor travels to the real element, presses, and
 *              the press is what starts the next camera shot (M4: cursor is causal).
 *
 * THE RUNTIME RULE (same as lkmotion.mjs)
 * The runtime half is serialised into every sub-composition as the `__dir` global
 * and may reference nothing from this module. The plan half runs in Node, at build
 * time, and is handed to the page as one JSON literal.
 */

import * as TABLE from "./components/table/index.mjs";
import { springModule, ENTRY_DUR } from "./lkspring.mjs";

/**
 * THE PEAK RULE. The pointer is on screen all the time; the elements are not. So the pointer and the camera
 * never aim at an element until its entrance MASS is at the peak of the overshoot: only then do they tween in
 * close. `ENTRY_PEAK` is how long after an item's entrance starts that peak lands (lkspring: the `pop` spring
 * over ENTRY_DUR). `HAND` is how long before the press the hand arrives on the item (hover).
 */
const SP = springModule();
export const ENTRY_PEAK = SP.peakDelay("pop", ENTRY_DUR);
export const HAND = 0.26;
/** How close the camera closes in on the element the pointer is about to press (the fit may stop short for a big element). */
export const ZOOM_IN = 2.1;
/** When item `i`'s entrance mass peaks, given the slots the director retimed it to (its first tween starts at slot - lead). */
export const peakOfItem = (slots, i, lead = 0.1) => +(slots[i] - lead + ENTRY_PEAK).toFixed(3);

/* ------------------------------------------------------------------ constants */

/** Shortest gap between two camera shots. Below this a "cut" reads as a twitch. */
export const MIN_SHOT_GAP = 1.5;
/** Closest two cursor clicks may be: the retreat and the next approach need this long. */
export const MIN_STOP_GAP = 1.9;
/** Target spacing between clicks. */
export const STOP_EVERY = 2.5;
/** The camera never starts moving before the entrances have had a moment. */
export const FIRST_SHOT_AT = 1.5;
/** Seconds before the end of a beat that the camera stops starting new shots. */
export const TAIL_GUARD = 0.9;

/**
 * Which kinds get a cursor. These are the beats that depict an interface — fields
 * to click, cards to open, links to follow. A cursor on a count-up or a typewriter
 * would be decoration, and M4 says a cursor must cause something.
 */
export const CURSOR_KINDS = null; // retired: every narrated beat has a cursor (M4)

/**
 * Per-kind item groups. `items` are the things the narration walks through, in
 * order; `tail` is the closing line that should land only after the last of them;
 * `shots` is what the camera may punch in on (defaults to the items).
 *
 * A group is a CSS selector evaluated inside the beat's root. A selector may match
 * several elements (relations: the node AND its connector path) — they move as one.
 */
export function groupsFor(kind, a = {}) {
  const n = (x) => (Array.isArray(x) ? x.length : 0);
  const idx = (count, f) => Array.from({ length: count }, (_, i) => f(i));
  switch (kind) {
    case "overwhelm":
      return { items: idx(n(a.blockers), (i) => `.ovorb[data-i="${i}"]`), tail: [], shots: ['[data-a="box"]'] };
    case "journey":
      return { items: idx(n(a.steps), (i) => `.jcard[data-i="${i}"]`), tail: ['[data-a="n"]'] };
    case "relations":
      return {
        items: idx(n(a.links), (i) => `.relnode[data-node="${i}"], .relsvg path[data-p="${i}"]`),
        tail: [],
        shots: idx(n(a.links), (i) => `.relnode[data-node="${i}"]`),
      };
    case "converge":
      return { items: idx(a.n || n(a.labels), (i) => `.cvchip:nth-of-type(${i + 1})`), tail: ['[data-a="core"]'], shots: ['[data-a="core"]'] };
    case "agentWork":
      return { items: idx(n(a.steps), (i) => `.wrow:nth-of-type(${i + 1})`), tail: [], shots: idx(n(a.steps), (i) => `.wrow:nth-of-type(${i + 1})`) };
    case "sentiment":
      return { items: idx(n(a.bars), (i) => `.bar:nth-of-type(${i + 1})`), tail: ['[data-a="n"]'] };
    case "typewriter":
      return { items: idx(n(a.lines), (i) => `.twl-line:nth-of-type(${i + 1})`), tail: ['[data-a="h"]'] };
    case "split":
      return { items: [".sp:nth-of-type(1)", ".sp:nth-of-type(3)"], tail: ['[data-a="f"]'] };
    case "record":
      // Rows enter fast and together; the narration is about ONE of them. So the
      // camera walks panel -> focus row -> note instead of retiming the rows.
      return {
        items: [],
        tail: [],
        shots: [".pan", a.focus ? `.pan [data-row="${a.focus}"]` : ".pan .row", '[data-a="n"]'],
      };
    case "table": {
      // what the pointer may do on a table is declared BY the component, not by the director
      const t = TABLE.targets({ rows: Array.from({ length: n(a.rows) }), focus: a.focus, focusCol: a.focusCol, tone: a.tone });
      return { items: t.items, tail: t.tail };
    }
    case "transcript":
      return { items: [], tail: [], shots: [".tw", ".tline.hit", ".wave"] };
    case "countup":
    case "costCount":
      return { items: [], tail: [], shots: ['[data-a="count"] .n, [data-a="c"] .n', '[data-a="sub"], [data-a="s"]'] };
    case "zoomOut":
      return { items: [], tail: [], shots: ['[data-a="m"]', '[data-a="r"] .hero', '[data-a="r"] .body'] };
    default:
      return { items: [], tail: [], shots: [] };
  }
}

/* ----------------------------------------------------------------- cue finding */

/**
 * Clause boundaries inside one beat, as seconds RELATIVE TO THE BEAT'S FIRST WORD.
 *
 * A boundary is the start of the word after a sentence end, and the start of the
 * word after a comma once the clause has run long enough (>= minClause seconds)
 * that a second cut inside it is worth having. The first entry is always 0.
 */
export function clausesFor(words, start, end, minClause = 1.8) {
  const w = words.filter((x) => x.start >= start - 0.05 && x.start < end);
  const out = [0];
  let last = w.length ? w[0].start : start;
  for (let i = 0; i < w.length - 1; i++) {
    const text = w[i].punctuated_word || w[i].word || "";
    const hard = /[.!?]["”']?$/.test(text);
    const soft = /[,;:—–]["”']?$/.test(text) && w[i + 1].start - last >= minClause;
    if (hard || soft) {
      const t = w[i + 1].start;
      if (t - last >= 0.9) {
        out.push(+(t - (w[0].start)).toFixed(3));
        last = t;
      }
    }
  }
  return out;
}

/**
 * N entrance times for N items, drawn from the beat's own clause boundaries.
 * More clauses than items: pick evenly. Fewer: spread the remainder across the
 * narration so a long beat is never front-loaded.
 */
export function slotsFor(n, clauses, span, offset = 0) {
  if (!n) return [];
  if (clauses.length >= n) return Array.from({ length: n }, (_, i) => clauses[Math.floor((i * clauses.length) / n)]);
  const usable = Math.max(span * 0.8, 1);
  return Array.from({ length: n }, (_, i) => +(offset + (i / n) * usable).toFixed(3));
}

/** The text each item carries, in order, so an item can be pinned to the word that names it. */
export function labelsFor(kind, a = {}) {
  const first = (x) => (Array.isArray(x) ? x[0] : x);
  switch (kind) {
    case "overwhelm": return (a.blockers || []).map(first);
    case "journey": return (a.steps || []).map(first);
    case "relations": return (a.links || []).map(first);
    case "converge": return a.labels || [];
    case "agentWork": return a.steps || [];
    case "sentiment": return (a.bars || []).map(first);
    default: return [];
  }
}

const STOP = new Set(["not", "with", "that", "what", "this", "from", "they", "them", "have", "none", "kind", "just", "your", "there", "their", "about", "which", "where", "when", "does", "into", "only"]);
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9]/g, "");
/** "agencyLeads" -> ["agency","leads"]; "not a conversation" -> ["conversation"]. */
const tokensOf = (label) =>
  String(label)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .map(norm)
    .filter((t) => t.length >= 4 && !STOP.has(t));

/**
 * Pin each item to the word that names it. Walks the narration once, left to
 * right, so items stay in the order they are spoken; an item whose label never
 * appears gets null and falls back to the clause slot. Returns sub-composition
 * seconds (offset included), already pulled `pre` seconds ahead of the word: the
 * J-cut rule applied per item, not just per beat.
 */
export function wordSlots(labels, words, start, end, offset, pre = 0.4) {
  const w = words.filter((x) => x.start >= start - 0.05 && x.start < end);
  let j = 0;
  return labels.map((label) => {
    const toks = tokensOf(label).reverse(); // the last word of a label is usually the noun
    for (let k = j; k < w.length; k++) {
      const n = norm(w[k].punctuated_word || w[k].word);
      if (toks.some((t) => n === t || (n.length >= 5 && t.startsWith(n.slice(0, Math.max(5, n.length - 2)))) || (t.length >= 5 && n.startsWith(t.slice(0, t.length - 1))))) {
        j = k + 1;
        return +(w[k].start - start + offset - pre).toFixed(3);
      }
    }
    return null;
  });
}

/**
 * Camera shots for a beat: [{ at, kind, ref, scale }]. `at` is relative to the
 * beat's first word. Shot rhythm is close, close, wide — two punch-ins on the
 * narration's subject, then a pull-back that re-establishes the whole board.
 */
export function shotsFor(clauses, span, minGap = MIN_SHOT_GAP) {
  const shots = [];
  let prev = -Infinity;
  clauses.forEach((c, i) => {
    if (i === 0) return; // the first clause is the entrance, not a cut
    if (c < FIRST_SHOT_AT - 0.6 || c > span - TAIL_GUARD) return;
    if (c - prev < minGap) return;
    shots.push(c);
    prev = c;
  });
  // A single long clause still has to move: add evenly spaced cuts inside any
  // gap longer than 2 * minGap + 1s so no stretch of narration holds one framing.
  const edges = [0, ...shots, span - TAIL_GUARD];
  const filled = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const a = edges[i];
    const b = edges[i + 1];
    if (i > 0) filled.push(a);
    const gap = b - a;
    if (gap > 2 * minGap + 1) {
      const k = Math.floor(gap / (minGap + 0.6));
      for (let j = 1; j < k; j++) filled.push(+(a + (gap * j) / k).toFixed(3));
    }
  }
  return filled
    .filter((t) => t >= FIRST_SHOT_AT - 0.2)
    .sort((x, y) => x - y)
    .map((at, i) => ({ at, wide: i % 3 === 2, scale: 1.2 + 0.07 * (i % 3) }));
}

/* ---------------------------------------------------------------- runtime half */

/**
 * `__dir`, emitted into every sub-composition. Deterministic: no Math.random, no
 * Date, no timers. Positions are MEASURED by parking the timeline at the moment a
 * thing is needed and reading the element's box, so a shot lands on where the item
 * really is at that instant — not on a coordinate someone typed (the cursor bug).
 */
export const directorRuntimeJS = `
const __dir = {
  W: 1920, H: 1080,

  /** Centre of el in 1920x1080 stage space, with the timeline parked at \`at\`. */
  centre(tl, root, el, at) {
    if (!el) return null;
    const keep = tl.time();
    tl.seek(at, false);
    const rr = root.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    tl.seek(keep, false);
    if (!rr.width || !r.width) return null;
    const k = rr.width / 1920;
    return { x: (r.left + r.width / 2 - rr.left) / k, y: (r.top + r.height / 2 - rr.top) / k,
             w: r.width / k, h: r.height / k, left: (r.left - rr.left) / k, top: (r.top - rr.top) / k };
  },

  all(root, sel) { try { return Array.from(root.querySelectorAll(sel)); } catch (e) { return []; } },

  /**
   * RETIME. Shift every tween that targets item i (or anything inside it) so the
   * item's first tween starts at slots[i]. Never earlier than it already was: a
   * retime only ever delays, so an entrance cannot jump ahead of the beat's own
   * kicker. The tail group is pinned to land just after the last item.
   */
  retime(tl, root, spec) {
    const items = spec.items.map((sel) => __dir.all(root, sel));
    const tails = (spec.tail || []).map((sel) => __dir.all(root, sel));
    const tweens = tl.getChildren(true, true, false);
    const firstStart = (els) => {
      let min = Infinity;
      tweens.forEach((tw) => {
        const tg = (tw.targets && tw.targets()) || [];
        if (tg.some((t) => t && t.nodeType === 1 && els.some((e) => e === t || e.contains(t)))) min = Math.min(min, tw.startTime());
      });
      return min;
    };
    const shift = (els, delta) => {
      if (!(delta > 0.01)) return;
      tweens.forEach((tw) => {
        const tg = (tw.targets && tw.targets()) || [];
        if (tg.some((t) => t && t.nodeType === 1 && els.some((e) => e === t || e.contains(t)))) tw.startTime(tw.startTime() + delta);
      });
    };
    let lastEnd = 0;
    items.forEach((els, i) => {
      if (!els.length) return;
      const from = firstStart(els);
      if (!isFinite(from)) return;
      const want = Math.max(from, spec.slots[i] - spec.lead);
      shift(els, want - from);
      lastEnd = Math.max(lastEnd, want + 0.9);
    });
    tails.forEach((els) => {
      if (!els.length) return;
      const from = firstStart(els);
      if (isFinite(from)) shift(els, Math.max(0, lastEnd + 0.15 - from));
    });
  },

  /** A cubic bezier as a GSAP ease. y2 > 1 overshoots: the "bezier overshoot zoom". */
  bez(x1, y1, x2, y2) {
    const cv = (t, a, b) => ((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t * t + 3 * a * t;
    const sl = (t, a, b) => 3 * (1 - 3 * b + 3 * a) * t * t + 2 * (3 * b - 6 * a) * t + 3 * a;
    return (p) => {
      if (p <= 0) return 0;
      if (p >= 1) return 1;
      let t = p;
      for (let i = 0; i < 8; i++) {
        const e = cv(t, x1, x2) - p, d = sl(t, x1, x2);
        if (Math.abs(e) < 1e-6) break;
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      return cv(t, y1, y2);
    };
  },

  /**
   * The camera pose that puts world point P at the centre of the frame, at zoom s,
   * with a yaw/pitch tilt. The stage wrapper is rotated about the frame centre and
   * then translated, so the translation has to cancel the ROTATED position of P -
   * otherwise a tilted camera slides off its target. Zoom is a move along z under a
   * fixed perspective (scale at depth = D / (D - z)), so tilt and zoom are one move.
   */
  pose(P, s, rx, ry) {
    const D = 1600, r = Math.PI / 180;
    const cx = Math.cos(rx * r), sx = Math.sin(rx * r), cy = Math.cos(ry * r), sy = Math.sin(ry * r);
    const y1 = P[1] * cx - P[2] * sx, z1 = P[1] * sx + P[2] * cx;     // rotateX
    const x2 = P[0] * cy + z1 * sy, z2 = -P[0] * sy + z1 * cy;         // then rotateY
    return { x: -x2, y: -y1, z: D - D / s - z2, rotationX: rx, rotationY: ry };
  },

  /**
   * CAMERA. One 3D transform on the stage wrapper (perspective, translate, tilt).
   * A shot flies the frame onto a target - a chunk of captions, an item of the
   * scene, or a wide that re-establishes both - on a bezier that overshoots and
   * settles, then keeps creeping for as long as it is held. \`cs\` are the item
   * centres, measured BEFORE any camera tween exists.
   */
  camera(tl, root, spec, cs) {
    const stage = root.querySelector(spec.stage || ".stagec");
    if (!stage) return;
    const D = 1600, EASE = __dir.bez(0.22, 1, 0.36, 1.1), EASE_WIDE = __dir.bez(0.42, 0, 0.14, 1);
    // Aim a little BELOW the target, so what the camera is on rides high in the frame and clears
    // the subtitle pill that sits flat across the bottom (it is in the root, outside this world).
    const LOW = 120;
    tl.set(stage, { transformPerspective: D, transformOrigin: "50% 50%" }, 0);
    // The entrance: the frame starts pushed toward the camera and a few degrees off axis.
    tl.fromTo(stage, { z: 220, rotationY: -spec.dir * 6, rotationX: 2, x: 0, y: 0 },
      { z: 0, rotationY: 0, rotationX: 0, duration: 1.2, ease: EASE }, spec.enter);
    spec.shots.forEach((sh, i) => {
      const at = spec.enter + sh.at;
      let P = [0, 0, 0], s = sh.zoom || 1;
      if (sh.mode === "in") {
        // push IN on the thing the cursor is about to press (a satellite has a known
        // world position; a scene item was measured)
        const st = spec.stops[sh.stop];
        if (st && st.world) {
          // A depth-set component is PERIPHERAL: frame it together with the content it
          // surrounds (aim between the two, zoom less), never centre on it alone - that threw
          // the scene to the bottom edge and under the subtitles.
          P = [st.world.x * 0.42, st.world.y * 0.42 + LOW, st.world.z * 0.4];
          s = Math.min(sh.zoom, 1.25);
        }
        else if (cs[sh.stop]) {
          const c = cs[sh.stop];
          P = [c.x - __dir.W / 2, c.y - __dir.H / 2 + LOW, 0];
          // CLOSE: fill the frame with the element, by whichever of its sides asks for more (a wide thin row fills by
          // its height and is framed on the hand, cropped at the sides, instead of staying wide), never past sh.zoom
          s = Math.max(1.3, Math.min(sh.zoom, Math.max((0.72 * __dir.W) / Math.max(c.w, 1), (0.3 * __dir.H) / Math.max(c.h, 1))));
        }
      } else {
        s = sh.zoom; // OUT: pull back to take in the whole depth set as the cursor leaves
      }
      const to = __dir.pose(P, s, sh.rx, sh.ry);
      const nextAt = i + 1 < spec.shots.length ? spec.enter + spec.shots[i + 1].at : spec.end;
      tl.to(stage, { x: to.x, y: to.y, z: to.z, rotationX: to.rotationX, rotationY: to.rotationY,
        duration: 0.8, ease: sh.mode === "wide" ? EASE_WIDE : EASE }, at);
      // creep: a held shot keeps drifting - closer, and a little further round
      tl.to(stage, { z: to.z + 45, rotationY: to.rotationY * 0.55, duration: Math.max(0.4, nextAt - at - 0.8), ease: "none" }, at + 0.8);
    });
    // Level out before the seam, so the exit animation starts from a flat frame.
    tl.to(stage, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, duration: 0.5, ease: "power2.inOut" }, spec.end);
  },

  /**
   * SATELLITES. The depth set rises into the world: each component starts below and
   * far behind its place and travels up the Y axis and forward along Z toward the
   * camera, overshooting and settling, staggered rather than one after another. Once
   * seated it keeps a slow bob, so the layers never freeze.
   */
  satellites(tl, root, spec) {
    const EASE = __dir.bez(0.2, 1, 0.3, 1.14);
    spec.items.forEach((sp, i) => {
      const el = root.querySelector('.sat[data-i="' + i + '"]');
      if (!el) return;
      const at = spec.enter + 0.12 + i * 0.17;
      tl.set(el, { xPercent: -50, yPercent: -50 }, 0);
      tl.fromTo(el, { x: sp.x, y: sp.y + 340, z: sp.z - 720, rotationX: -32, scale: 0 },
        { x: sp.x, y: sp.y, z: sp.z, rotationX: 0, scale: 1, duration: 0.95, ease: EASE, ease: __spr.pop }, at);
      tl.to(el, { y: sp.y + (i % 2 ? 12 : -12), duration: 2.1 + i * 0.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, at + 1.0);
    });
  },

  /**
   * LIFT. The component the narration is on rises toward the camera, and settles
   * back when the narration moves on - the depth-of-field cue, with no blur.
   * \`list\` is [{ sel, at, back }]: raise at \`at\`, return at \`back\` (or stay up).
   */
  lift(tl, root, list) {
    list.forEach((l) => {
      __dir.all(root, l.sel).forEach((el) => {
        tl.to(el, { z: l.z || 90, duration: 0.5, ease: __spr.snap }, l.at);
        if (l.back) tl.to(el, { z: 0, duration: 0.45, ease: "power2.inOut" }, l.back);
      });
    });
  },

  /**
   * CURSOR - the through-line of the beat (criteria M4). One pointer that lives in the
   * 3D world, is on screen in every scene, and is the thing the viewer follows.
   *
   * Its life is a loop of three moves, repeated for each stop:
   *   APPROACH  leave the resting quadrant on a curved bezier, with mass: it starts
   *             slowly, overshoots its mark and settles. As it nears the target it
   *             also comes TOWARD THE CAMERA along z, so the click is the closest
   *             thing in the frame.
   *   CLICK     the arrow turns to an open hand on arrival (hover), a pointing hand on
   *             the press (click), then back to the arrow. The press ripples.
   *   RETREAT   pull away along z and back out to the opposite quadrant while the
   *             camera pulls out with it, and sway there until the next stop.
   *
   * The whole path is ONE pure function of time, evaluated in a single tween onUpdate,
   * so a seek anywhere lands the cursor exactly where it should be. \`cs\` are the
   * target centres, measured before any camera tween exists.
   */
  cursor(tl, root, spec, cs) {
    const cur = root.querySelector(".cursor");
    if (!cur || !spec.stops.length) return;
    const ripple = root.querySelector(".ripple");
    const nS = cur.querySelector(".cs-n"), hS = cur.querySelector(".cs-h"), cS = cur.querySelector(".cs-c");
    const EASE = __dir.bez(0.5, 0, 0.2, 1.1);          // inertia, then a small overshoot
    const IN = __dir.bez(0.2, 1, 0.3, 1.25);           // the pointer's own entrance: overshoots
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const W = __dir.W, H = __dir.H;

    // ---- the schedule: rest -> target (hover, click) -> rest ...
    const segs = [];
    let from = { x: spec.start.x, y: spec.start.y, z: 260, t: 0 };
    const tgt = (st, c) => (st.world
      ? { x: W / 2 + st.world.x, y: H / 2 + st.world.y, z: st.world.z + 110 }
      : c ? { x: c.left + c.w * (st.fx != null ? st.fx : 0.6), y: c.y, z: 110 } : null);
    spec.stops.forEach((st, i) => {
      const T = tgt(st, cs[i]);
      if (!T) return;
      const dist = Math.hypot(T.x - from.x, T.y - from.y);
      const travel = clamp(dist / 1500, 0.55, 1.05);
      const arrive = st.at - 0.26;                        // the hand appears just before the press
      const depart = Math.max(from.t + 0.05, arrive - travel);
      segs.push({ kind: "go", t0: depart, t1: arrive, a: from, b: { ...T, t: arrive }, side: i % 2 ? -1 : 1, near: true });
      segs.push({ kind: "hold", settle: true, t0: arrive, t1: st.at + 0.18, a: { ...T, t: arrive }, b: { ...T, t: st.at + 0.18 } });
      const rest = st.rest, rt = st.at + 0.95;               // retreat to the resting quadrant
      segs.push({ kind: "go", t0: st.at + 0.18, t1: rt, a: { ...T, t: st.at + 0.18 }, b: { x: rest.x, y: rest.y, z: rest.z, t: rt }, side: i % 2 ? 1 : -1, near: false });
      from = { x: rest.x, y: rest.y, z: rest.z, t: rt };
    });
    segs.push({ kind: "hold", t0: from.t, t1: spec.end + 5, a: from, b: from });

    const bz = (a, b, c, d, u) => {
      const m = 1 - u;
      return m * m * m * a + 3 * m * m * u * b + 3 * m * u * u * c + u * u * u * d;
    };
    const posAt = (t) => {
      const seg = segs.find((g) => t >= g.t0 && t < g.t1) || segs[segs.length - 1];
      if (seg.kind === "hold") {
        // an idle drift with weight: the pointer is never parked
        // right after an approach the pointer is at its closest and starts to ease back
        const close = seg.settle ? 230 * Math.exp(-(t - seg.t0) * 4) : 0;
        return { x: seg.a.x + Math.sin((t * 2 * Math.PI) / 3.1) * 12, y: seg.a.y + Math.cos((t * 2 * Math.PI) / 2.4) * 9, z: seg.a.z + close + Math.sin((t * 2 * Math.PI) / 2.7) * 28 };
      }
      const p = clamp((t - seg.t0) / (seg.t1 - seg.t0), 0, 1);
      const u = EASE((t - seg.t0) / (seg.t1 - seg.t0));
      const dx = seg.b.x - seg.a.x, dy = seg.b.y - seg.a.y, d = Math.hypot(dx, dy) || 1;
      const px = (-dy / d) * d * 0.22 * seg.side, py = (dx / d) * d * 0.22 * seg.side;   // the arc
      const x = bz(seg.a.x, seg.a.x + dx * 0.25 + px, seg.b.x - dx * 0.2 + px * 0.6, seg.b.x, u);
      const y = bz(seg.a.y, seg.a.y + dy * 0.25 + py, seg.b.y - dy * 0.2 + py * 0.6, seg.b.y, u);
      // z: coming in toward the click is a build (ease in); leaving is a release
      const zk = seg.near ? Math.pow(p, 2.2) : 1 - Math.pow(1 - p, 2);
      const z = seg.a.z + (seg.b.z - seg.a.z) * zk + (seg.near ? 230 * Math.sin(Math.PI * 0.5 * zk) : 90 * Math.sin(Math.PI * zk)) + Math.sin((t * 2 * Math.PI) / 2.2) * 26;
      return { x, y, z };
    };
    const stateAt = (t) => {
      for (const st of spec.stops) {
        if (t >= st.at - 0.26 && t < st.at) return "h";
        if (t >= st.at && t < st.at + 0.24) return "c";
      }
      return "n";
    };

    const clock = { t: 0 };
    let last = null;
    tl.to(clock, {
      t: spec.end + 0.5, duration: spec.end + 0.5, ease: "none",
      onUpdate() {
        const t = clock.t, q = posAt(t), q2 = posAt(t + 0.03), q1 = posAt(t - 0.03);
        const vx = (q2.x - q1.x) / 0.06, vy = (q2.y - q1.y) / 0.06;
        const sp = Math.hypot(vx, vy);
        const s = stateAt(t);
        // mass: the pointer leans into its motion and swells with speed; a press squashes it
        // it enters and leaves by SCALE (never a fade): grows in with overshoot, shrinks out before the seam
        const env = IN(clamp((t - spec.appear) / 0.45, 0, 1)) * (1 - Math.pow(clamp((t - spec.end) / 0.3, 0, 1), 3));
        gsap.set(cur, { x: q.x, y: q.y, z: q.z, rotation: clamp(-vx / 70, -18, 18), scale: env * (s === "c" ? 0.84 : 1) * (1 + Math.min(0.1, sp / 16000)) });
        // swap-ok: the three sprites are SWAPPED (arrow / open hand / pointing hand), never faded
        if (s !== last) { nS.style.opacity = s === "n" ? 1 : 0; hS.style.opacity = s === "h" ? 1 : 0; cS.style.opacity = s === "c" ? 1 : 0; last = s; }
      },
    }, 0);
    // the press ripples where the target is
    gsap.set(cur, { scale: 0 }); // hidden until its own entrance (scale), never a fade; immediate, so it cannot flash before the first seek
    if (ripple) gsap.set(ripple, { scale: 0 });
    if (ripple) spec.stops.forEach((st, i) => {
      const T = tgt(st, cs[i]);
      if (!T) return;
      // the press ring grows, then shrinks to nothing: scale only
      tl.set(ripple, { x: T.x - 40, y: T.y - 40, z: T.z, scale: 0.2 }, st.at);
      tl.to(ripple, { scale: 1.6, duration: 0.3, ease: "power2.out" }, st.at);
      tl.to(ripple, { scale: 0, duration: 0.22, ease: "power2.in" }, st.at + 0.3);
    });
  },

  /**
   * ANATOMY. Every element built as "a tile and some text" enters the same way, in
   * order, quickly (criteria M5): the card overshoots in from an anchor at its
   * centre; the blue tile inside it overshoots next; the heroicon inside the tile
   * overshoots LAST; the text beside it rises and overshoots. One sequence, ~0.45s,
   * staggered rather than sequential - each part starts before the last has settled.
   * It runs for any card that contains a tile, so a new scene gets it for free.
   */
  anatomy(tl, root) {
    const tweens = tl.getChildren(true, true, false);
    const OVER = __spr.snap;
    __dir.all(root, ".ico:not(.plain)").forEach((tile) => {
      if (tile.dataset.anat) return;
      tile.dataset.anat = "1";
      // the card that owns this tile: nearest ancestor that has its own entrance tween
      let card = tile.parentElement, at = Infinity;
      while (card && card !== root) {
        tweens.forEach((tw) => {
          const tg = (tw.targets && tw.targets()) || [];
          if (tg.indexOf(card) >= 0) at = Math.min(at, tw.startTime());
        });
        if (isFinite(at)) break;
        card = card.parentElement;
      }
      if (!isFinite(at) || !card) return;
      const svg = tile.querySelector("svg");
      tl.fromTo(tile, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.4, ease: OVER }, at + 0.1);
      if (svg) tl.fromTo(svg, { scale: 0, rotation: -24, transformOrigin: "50% 50%" }, { scale: 1, rotation: 0, duration: 0.42, ease: __spr.snap }, at + 0.24);
      // text beside the tile: a rise with overshoot, starting under the tile's pop
      let sib = tile.nextElementSibling;
      let n = 0;
      while (sib && n < 4) {
        if (!sib.classList.contains("ovhit")) tl.fromTo(sib, { scale: 0, y: 28 }, { scale: 1, y: 0, duration: 0.42, ease: __spr.pop }, at + 0.16 + n * 0.05);
        sib = sib.nextElementSibling; n++;
      }
    });
  },

  /**
   * EXIT. "Remove all elements within a scene": every top-level element of the outgoing scene, every
   * depth-set component and the pointer scale DOWN to 0 (staggered, the reversed spring (__spr.popIn), ~0.3 s each), finishing
   * at the seam. Nothing fades. The incoming scene then scales UP from 0 with overshoot, so the
   * moment between two scenes is an empty stage and the cut is a scale-out then a scale-in.
   * \`from\` is the order they leave in (start | end | center | edges): the seam's character.
   */
  exit(tl, root, spec) {
    const stage = root.querySelector(".stagec");
    if (!stage) return;
    const items = Array.from(stage.children).filter((el) => !el.classList.contains("satset") && !el.classList.contains("cursor") && !el.classList.contains("ripple"));
    __dir.all(root, ".sat").forEach((el) => items.push(el));
    const n = items.length;
    if (!n) return;
    const EACH = 0.04, DUR = 0.3;
    const rank = (i) => {
      const mid = (n - 1) / 2;
      if (spec.from === "end") return n - 1 - i;
      if (spec.from === "center") return Math.abs(i - mid);
      if (spec.from === "edges") return mid - Math.abs(i - mid);
      return i;
    };
    const total = DUR + EACH * (n - 1);
    items.forEach((el, i) => {
      tl.to(el, { scale: 0, duration: DUR, ease: __spr.popIn, transformOrigin: "50% 50%" }, spec.at - total + EACH * rank(i));
    });
  },

  run(tl, root, plan) {
    if (!plan) return;
    try { if (plan.retime) __dir.retime(tl, root, plan.retime); } catch (e) { console.warn("[dir] retime", e); }
    // Measure first, tween second. The cursor and the camera share ONE measurement of
    // each stop target, taken before any camera tween exists.
    let stopC = [];
    try {
      if (plan.stops) stopC = plan.stops.map((st) => {
        const el = st.ref ? __dir.all(root, st.ref)[0] : null;
        return el ? __dir.centre(tl, root, el, st.at) : null;
      });
    } catch (e) { console.warn("[dir] measure", e); }
    try { if (plan.sats) __dir.satellites(tl, root, plan.sats); } catch (e) { console.warn("[dir] satellites", e); }
    try { __dir.anatomy(tl, root); } catch (e) { console.warn("[dir] anatomy", e); }
    try { if (plan.exit) __dir.exit(tl, root, plan.exit); } catch (e) { console.warn("[dir] exit", e); }
    try { if (plan.lift) __dir.lift(tl, root, plan.lift); } catch (e) { console.warn("[dir] lift", e); }
    try { if (plan.camera) __dir.camera(tl, root, plan.camera, stopC); } catch (e) { console.warn("[dir] camera", e); }
    try { if (plan.cursor) __dir.cursor(tl, root, plan.cursor, stopC); } catch (e) { console.warn("[dir] cursor", e); }
  },
};
`;

/* --------------------------------------------------------------- the plan (Node) */


/**
 * Everything the runtime needs for one beat, as plain JSON.
 *
 * @param beat      the storyboard beat
 * @param words     Deepgram words for the whole narration
 * @param nextT     audio-relative start of the NEXT beat (or narration end)
 * @param opts      { lead, enter, index } — LEAD and ENTER from build-beats
 */
export function planFor(beat, words, nextT, { lead, enter, index, sats, prevCursor, exitFrom }) {
  const start = beat.t;
  const span = nextT - start;
  // Sub-composition time of the beat's first word. Beat 0 has no J-cut lead.
  const offset = index === 0 ? 0 : lead;
  const clauses = clausesFor(words, start, nextT).map((c) => +(c + offset).toFixed(3));
  const g = groupsFor(beat.kind, beat.a || {});
  const plan = { clauses, span: +span.toFixed(2) };

  if (g.items.length) {
    const fallback = slotsFor(g.items.length, clauses, span, offset);
    const named = wordSlots(labelsFor(beat.kind, beat.a || {}), words, start, nextT, offset);
    // A named match is only trusted when it lands near where the clause structure
    // says it should (a label word that recurs later in the narration is not the
    // moment it is introduced), and only when most items matched at all - a beat
    // where half the labels are paraphrased in speech is paced by clauses instead.
    const near = (n, f) => n !== null && Math.abs(n - f) <= Math.max(2.5, span * 0.3);
    const trusted = named.filter((n, i) => near(n, fallback[i])).length >= Math.ceil(named.length * 0.6);
    const slots = fallback.map((f, i) => (trusted && near(named[i], f) ? named[i] : f));
    // A scene is never EMPTY: the first item enters right after the beat does, even when the
    // word that names it is seconds away (it then arrives early, as a J-cut should, and the
    // rest follow the narration). Items stay in spoken order and never stack on one frame.
    slots[0] = Math.min(slots[0], +(enter + 0.5).toFixed(3));
    for (let i = 1; i < slots.length; i++) slots[i] = Math.max(slots[i], +(slots[i - 1] + 0.45).toFixed(3));
    plan.retime = { items: g.items, tail: g.tail, slots, lead: 0.1 };
    plan.slots = slots;
  }

  /* ---- the depth set (lksatellites.mjs): positions in world px */
  if (sats && sats.spec.length) plan.sats = { enter, items: sats.spec };

  /* ---- STOPS: the cursor clicks once per clause (>= MIN_STOP_GAP apart). Each stop is
     a thing in the scene - an item, a part of the content, or a component of the depth
     set - and each one drives BOTH the cursor (approach, hover, click, retreat) and the
     camera (push in as the cursor arrives, pull out as it leaves). */
  const targets = g.shots && g.shots.length ? g.shots : g.items;
  const itemAt = (t) => {
    if (!plan.slots) return null;
    let k = 0;
    plan.slots.forEach((sl, i) => { if (sl <= t + 0.3) k = i; });
    return k;
  };
  const seamAt = span - 1.0;                       // no click lands inside the exit
  // One click about every STOP_EVERY seconds, each snapped to the nearest clause boundary
  // (+ the approach) when one is close, so the pointer is always on its way to something
  // and a click usually lands as a new thought begins.
  const FIRST_CLICK = 1.9;
  const n = Math.max(1, Math.round((seamAt - FIRST_CLICK) / STOP_EVERY) + 1);
  let clicks = Array.from({ length: n }, (_, i) => {
    const even = n === 1 ? Math.min(Math.max(span * 0.5, FIRST_CLICK), seamAt) : FIRST_CLICK + ((seamAt - FIRST_CLICK) * i) / (n - 1);
    const near = clauses.map((c) => c + 0.95).filter((c) => c >= FIRST_CLICK && c <= seamAt && Math.abs(c - even) <= 0.6);
    return +(near.length ? near.reduce((a, c) => (Math.abs(c - even) < Math.abs(a - even) ? c : a)) : even).toFixed(3);
  });
  clicks = clicks.filter((t, i) => i === 0 || t - clicks[i - 1] >= MIN_STOP_GAP);
  let turn = 0;
  const stops = clicks.map((at, i) => {
    // the resting quadrant it retreats to: right, then left, alternating (y varies)
    const side = i % 2 === 0 ? 1 : -1;
    const rest = { x: 960 + side * (610 + (i % 3) * 60), y: 540 + [-230, 190, -120, 250][i % 4], z: 260 };
    const wantSat = plan.sats && i % 4 === 2;   // a visit to the depth set, every fourth click
    if (wantSat) {
      const k = (i * 2) % plan.sats.items.length;
      const sp = plan.sats.items[k];
      return { at, world: { x: sp.x, y: sp.y, z: sp.z }, sat: k, rest };
    }
    if (targets.length) {
      const k = itemAt(at);
      const isItem = k !== null && targets.length === g.items.length;
      const ref = isItem ? targets[k] : targets[turn++ % targets.length];
      // the peak rule: the hand lands on this item only once its mass is at the peak of the overshoot
      const peakAt = isItem ? peakOfItem(plan.slots, k) : null;
      return { at: isItem ? Math.max(at, +(peakAt + HAND + 0.04).toFixed(3)) : at, ref, rest, fx: 0.6, item: isItem ? k : null, peakAt };
    }
    return { at, ref: ".stagec > *:not(.satset):not(.cursor):not(.ripple)", rest, fx: 0.55 };
  });
  // the rule can push a press later: keep the stops ordered, spaced, and clear of the exit
  for (let i = stops.length - 1; i >= 0; i--) {
    if (stops[i].at > seamAt + 1e-6 || (i > 0 && stops[i].at - stops[i - 1].at < MIN_STOP_GAP * 0.6)) stops.splice(i, 1);
  }
  if (!stops.length) stops.push({ at: Math.min(seamAt, FIRST_CLICK + 0.6), ref: ".stagec > *:not(.satset):not(.cursor):not(.ripple)", rest: { x: 1570, y: 310, z: 260 }, fx: 0.55, item: null, peakAt: null });
  plan.stops = stops.map((st) => ({ at: st.at, ref: st.ref || null, item: st.item ?? null, peakAt: st.peakAt ?? null }));
  plan.peak = { delay: ENTRY_PEAK, hand: HAND };

  /* ---- CAMERA follows the cursor: in on the target as the hand lands, out as it leaves */
  const shots = [];
  stops.forEach((st, i) => {
    const tilt = { rx: i % 2 ? 3 : -3, ry: i % 2 ? -7 : 7 };
    // the camera tweens in close only after the mass has peaked (never earlier than the entrance's overshoot)
    shots.push({ at: Math.max(0.6, st.at - 0.95, st.peakAt ?? 0), mode: "in", stop: i, zoom: ZOOM_IN, ...tilt });
    shots.push({ at: st.at + 0.45, mode: "out", zoom: 0.94, rx: 0, ry: i % 2 ? 4 : -4 });
  });
  plan.camera = {
    stage: ".stagec",
    enter,
    dir: index % 2 ? 1 : -1,
    sats: plan.sats ? plan.sats.items : [],
    stops: stops.map((st) => ({ world: st.world || null })),
    shots: shots.map((s) => ({ ...s, at: +(s.at - enter).toFixed(3) })),
    end: +(span - 0.5).toFixed(3),
  };

  /* ---- CURSOR: where this beat's pointer starts (where the last one left off) and ends */
  const last = stops[stops.length - 1].rest;
  plan.exit = { at: +(span - 0.04).toFixed(3), from: exitFrom || "start" };
  plan.cursor = {
    appear: +(enter + 0.3).toFixed(3),
    start: prevCursor || { x: 1660, y: 880 },
    stops: stops.map((st) => ({ at: st.at, ref: st.ref || null, world: st.world || null, rest: st.rest, fx: st.fx })),
    end: plan.camera.end,
    endPos: { x: last.x, y: last.y },
  };

  /* ---- lift: the active component rises toward the camera (no blur, no dimming) */
  if (plan.retime) {
    plan.lift = plan.retime.items.map((sel, i) => ({
      sel: sel.split(",")[0],
      at: +(plan.slots[i] + 0.3).toFixed(3),
      back: i + 1 < plan.slots.length ? +(plan.slots[i + 1] + 0.1).toFixed(3) : 0,
      z: 70,
    }));
  } else if (beat.kind === "record") {
    plan.lift = [{ sel: '[data-a="n"]', at: 1.6, z: 110 }, { sel: ".pan", at: 1.2, z: 40 }];
  }
  return plan;
}
