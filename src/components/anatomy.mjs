/**
 * anatomy.mjs - how every component enters, as DATA, and the one runtime that plays it.
 *
 * The anatomy (the same for every component; the user's rule, DESIGN_SYSTEM 4):
 *
 *   1. the CARD (or the row, or the pill) overshoots out from its own centre
 *   2. then the blue TILE
 *   3. then the HEROICON, last of the three
 *   4. then the TEXT rises, with overshoot
 *
 * Nothing fades: every entrance is scale 0 -> 1 on a back ease (plus a rise in y where the thing is
 * "coming out of the screen"), and every exit is scale 1 -> 0. A component never writes opacity.
 *
 * A component describes its entrance as `steps(props)`: a list of
 *   { sel, one?, from, to, at, dur, ease, stagger? }
 * where `at` is seconds after the component starts. Data, not code, because a scene's animation is
 * serialised into a sub-composition page with Function.prototype.toString(), which drops closure
 * scope: a component function could not be called from there, but `__cmp.play(tl, qq, steps)` can,
 * and the steps travel as JSON. The director (lkdirector.mjs) then retimes `.trow` etc. exactly as
 * it did when the tweens were written by hand, because the tweens are the same tweens.
 */

import { springRuntimeJS } from "../lkspring.mjs";

/** The ease and the order. One place, so every component feels like the same product. */
export const EASE = {
  card: "spr:pop",
  row: "spr:row",
  tile: "spr:snap",
  icon: "spr:snap",
  text: "spr:pop",
  note: "spr:soft",
};

/** The spring preset behind each role (lkspring.mjs): what the peak rule measures when it waits for the overshoot. */
export const ROLE_SPRING = { card: "pop", row: "row", tile: "snap", icon: "snap", text: "pop", note: "soft" };

/** Offsets (s) between the parts of one component: the order is the rule, these are its pace. */
export const GAP = { tile: 0.12, icon: 0.14, text: 0.2 };

/** The order a component's parts must enter in. lint-components checks every component against it. */
export const ORDER = ["card", "tile", "icon", "text"];

/**
 * The runtime. ONE self-contained function (no module scope), serialised into every page that plays
 * components as `__cmp`. `play(tl, qq, steps, t0)` adds each step as a fromTo on the timeline.
 */
export function componentRuntime() {
  function play(tl, qq, steps, t0) {
    steps.forEach((s) => {
      const els = qq(s.sel);
      if (!els.length) return;
      const target = s.one ? els[0] : els;
      // "spr:pop" -> the closed-form spring ease (lkspring.mjs): entrances have MASS, never a fixed curve
      const ease = typeof s.ease === "string" && s.ease.indexOf("spr:") === 0 ? __spr[s.ease.slice(4)] : s.ease;
      const vars = Object.assign({}, s.to, { duration: s.dur, ease: ease });
      if (s.stagger) vars.stagger = s.stagger;
      // kind "to": a follow-on move from wherever the target is now (a row settling back flat after it has risen)
      if (s.kind === "to") tl.to(target, vars, t0 + s.at);
      else tl.fromTo(target, s.from, vars, t0 + s.at);
    });
  }
  /**
   * ACTIVATION: an element in a component is FLAT in its card's plane at rest. It lifts toward the camera (z = its
   * slab's depth, so the slab shows under it) only when activated: the focus row, a hovered or pressed cell. The
   * scale grows a hair with an overshoot; never opacity. `z` is the lift in px (0 = scale only).
   */
  function lift(tl, qq, sel, at, amount, z) {
    qq(sel).forEach((el) => tl.to(el, { scale: amount, z: z || 0, duration: 0.4, ease: __spr.snap }, at));
  }
  /**
   * ACTIVATION as a PURE FUNCTION OF TIME (the one-spring-per-change technique), not as overlapping tweens.
   *
   * Hovering one row after another used to be a lift tween and a release tween per row, on the SAME `z` and `scale`.
   * GSAP captures a tween's start value lazily, the first time it renders, so where an overlapping tween started from
   * depended on which tweens had already rendered: the render's parallel workers each seek independently, so frames
   * could disagree. And a release on an overshooting spring dipped BELOW the card plane (z < 0), behind the card's
   * opaque face, so the row vanished.
   *
   * Here each row owns ONE value a(t) = track(t, keys): +1 spring (snap) when the hand arrives, a settle spring (never
   * overshoots) back to 0 when it leaves. Overlap is just a sum, any seek order gives the same frame, and a(t) is clamped
   * at 0 so the element can never go behind its card. z = lift * a, scale = 1 + grow * a.
   *
   * spec: { rows: [{ sel, keys: [[time, 1 | 0], ...] }], lift: px, grow: 0.02, tail: s }  (time in the timeline's own clock)
   * The window must start after the rows' entrance has finished (they write the same properties before it).
   */
  function activate(tl, qq, spec) {
    const rows = spec.rows.map((r) => ({
      els: qq(r.sel),
      keys: [[-1e6, 0]].concat(r.keys.map((k) => [k[0], k[1], k[1] ? "snap" : "settle"])),
    }));
    let t0 = Infinity, t1 = -Infinity;
    spec.rows.forEach((r) => r.keys.forEach((k) => { t0 = Math.min(t0, k[0]); t1 = Math.max(t1, k[0]); }));
    const dur = t1 - t0 + (spec.tail || 1.6), proxy = { p: 0 };
    tl.to(proxy, {
      p: 1, duration: dur, ease: "none",
      onUpdate: () => {
        const t = t0 + proxy.p * dur;
        rows.forEach((r) => {
          const a = Math.max(0, __spr.track(t, r.keys, "settle")); // never below the plane
          r.els.forEach((el) => gsap.set(el, { z: spec.lift * a, scale: 1 + (spec.grow || 0) * a }));
        });
      },
    }, t0);
  }
  return { play, lift, activate };
}

export const componentRuntimeJS = `${springRuntimeJS}
const __cmp = (${componentRuntime.toString()})();`;

/** Convenience for component modules: a step with the defaults of its role. */
export const step = (role, sel, at, extra = {}) => ({
  sel,
  at: +at.toFixed(3),
  dur: role === "tile" ? 0.4 : role === "icon" ? 0.42 : role === "text" ? 0.42 : role === "card" ? 0.75 : 0.5,
  from: { scale: 0 },
  to: { scale: 1 },
  ease: EASE[role] || EASE.text,
  role,
  ...extra,
});
