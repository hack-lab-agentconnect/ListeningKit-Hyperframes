/**
 * lkspring.mjs - motion with MASS: closed-form springs, as pure functions of time.
 *
 * Adapted from the "ui-morph-colorful" technique (remorses, gist 3d467b50...): cheap motion eases from A to
 * B on a fixed curve; expensive motion has mass: it accelerates, overshoots a hair, settles. Because the
 * response is a CLOSED FORM (not a simulation), every value is a pure function of t, so seek(t) is exact
 * and frame 812 renders without simulating frames 0 to 811.
 *
 * THE TRICK: when a value changes target several times (a camera zoom, a pointer, a container's width) you
 * do NOT restart the spring. You add ONE spring per change, each starting at its own time, and sum them.
 * The motion stays continuous (position and velocity) at every change. `track` does that.
 *
 * WHAT WE TOOK, AND WHAT WE DID NOT
 *   took:  S (step response), pulse, track (sum of springs), indicator (leading edge stiffer than the
 *          trailing one), loopT, the preset table, "press starts before the click".
 *   left:  the gist fades layers with opacity + blur (visStyle / swapAlpha). Our rules forbid both (nothing
 *          fades, no blur): every entrance and exit here is a SCALE, driven by a spring.
 *
 * PRESETS (f = frequency Hz, z = damping ratio; z < 1 overshoots, z = 1 is critical):
 *   pop   f 3.0  z 0.62  ~9 % overshoot   the default entrance of a card / row / pill
 *   snap  f 3.6  z 0.50  ~16 % overshoot  a tile / heroicon: small and quick, so it can be livelier
 *   soft  f 2.6  z 0.72  ~3 % overshoot   a note / a large panel: heavier, a hair of overshoot
 *   row   f 2.8  z 0.78  ~2 % overshoot   a table row: it must never poke past the card it rises from
 *   settle f 3.2 z 1.00  0 % overshoot   a RETURN TO A SURFACE: an element coming back down onto its card's plane. It must
 *                              never undershoot: below the plane it is BEHIND the card's opaque face and vanishes
 *   cam   f 0.9  z 0.72  the camera's zoom: closes in with a hair of overshoot, settles (= lkpointer zoomSpring)
 *
 * THE PEAK RULE (docs/ANIMATION.md): the pointer is on screen all the time, the elements are not. The
 * pointer and the camera wait until an element's entrance mass is at the PEAK OF ITS OVERSHOOT, then tween
 * in close. `peakDelay(preset, dur)` is how long after an entrance starts that peak lands.
 *
 * `springModule` is one self-contained function: tests call it directly and `springRuntimeJS` serialises
 * the same function into a page as `__spr`, so what is tested is what renders.
 */

export function springModule() {
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  /** The step response of a damped spring: 0 at t <= 0, settles on 1. f in Hz, z the damping ratio. */
  function S(t, f, z) {
    if (t <= 0) return 0;
    const w = TAU * f;
    if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  }

  /** A pulse: 0, rises to exactly 1 at t = 1 / (2 pi f), then decays to 0. A hit that does not stay. */
  function pulse(t, f) {
    if (t <= 0) return 0;
    const x = TAU * f * t;
    return x * Math.exp(1 - x);
  }

  const SPR = {
    // ---- ours (entrances and the camera)
    pop: { f: 3.0, z: 0.62 },
    snap: { f: 3.6, z: 0.5 },
    soft: { f: 2.6, z: 0.72 },
    row: { f: 2.8, z: 0.78 },
    settle: { f: 3.2, z: 1 },
    cam: { f: 0.9, z: 0.72 },
    // ---- the gist's presets, for anything that needs them
    shape: { f: 1.9, z: 0.82 },
    enter: { f: 3.6, z: 1 },
    exit: { f: 8, z: 1 },
    cursor: { f: 2.3, z: 1 },
    glide: { f: 0.95, z: 1 },
    press: { f: 10, z: 1 },
    lead: { f: 3.4, z: 0.78 },
    trail: { f: 1.7, z: 0.92 },
  };

  const spec = (s) => (typeof s === "string" ? SPR[s] : s) || SPR.pop;

  /**
   * One value that changes target several times: keys = [[time, value, spring?], ...] sorted by time. Each key
   * ADDS one spring (the change from the previous value) starting at its own time, so the motion is continuous
   * at every change and a seek anywhere is exact. `def` is the spring a key uses when it names none.
   */
  function track(t, keys, def) {
    const d = spec(def || "cam");
    let v = keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const s = spec(keys[i][2] || d);
      v += (keys[i][1] - keys[i - 1][1]) * S(t - keys[i][0], s.f, s.z);
    }
    return v;
  }

  /** A stretching indicator: the leading edge is stiffer than the trailing edge. stops = [[time, x], ...]. */
  function indicator(t, stops, width = 0) {
    const lead = track(t, stops, SPR.lead), trail = track(t, stops, SPR.trail);
    return { left: Math.min(lead, trail), right: Math.max(lead, trail) + width };
  }

  /** A seamless loop: pin the last frame to the first. */
  const loopT = (t, dur) => ((t % dur) + dur) % dur;

  /** Time (s) at which the response first reaches its overshoot peak, or null if it does not overshoot. */
  function peakTime(f, z) {
    if (z >= 1) return null;
    return Math.PI / (TAU * f * Math.sqrt(1 - z * z));
  }
  /** The overshoot as a fraction of the move (0.09 = 9 %), 0 for a critically damped spring. */
  function overshoot(f, z) {
    if (z >= 1) return 0;
    return Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z));
  }
  /** Time (s) until the response stays within `eps` of its target. */
  function settleTime(f, z, eps = 0.005) {
    let last = 0;
    for (let t = 0; t < 6; t += 1 / 480) if (Math.abs(S(t, f, z) - 1) > eps) last = t;
    return last + 1 / 480;
  }

  /**
   * A GSAP ease: progress 0..1 -> the spring's response over its own settle time, so a tween of ANY duration
   * plays the whole spring (accelerate, overshoot, settle) across that duration.
   */
  function ease(name) {
    const s = spec(name), Ts = settleTime(s.f, s.z);
    return (p) => (p <= 0 ? 0 : p >= 1 ? 1 : S(p * Ts, s.f, s.z));
  }

  /**
   * The EXIT ease: a spring played in reverse. It dips first (a hair of anticipation, the mass gathering) and
   * then accelerates into the end, so a scale 1 -> 0 leaves with the same mass an entrance arrives with.
   */
  function easeIn(name) {
    const s = spec(name), Ts = settleTime(s.f, s.z);
    return (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - S((1 - p) * Ts, s.f, s.z));
  }

  /** Fraction (0..1) of an entrance tween at which its mass is at the peak of the overshoot. */
  const peakFrac = (name) => {
    const s = spec(name), pk = peakTime(s.f, s.z);
    return pk === null ? 1 : pk / settleTime(s.f, s.z);
  };
  /** Seconds after an entrance of duration `dur` starts that its mass is at the peak of its overshoot. */
  const peakDelay = (name, dur) => +(peakFrac(name) * dur).toFixed(3);

  const out = { S, pulse, SPR, track, indicator, loopT, peakTime, overshoot, settleTime, ease, peakFrac, peakDelay, clamp };
  // ready-made GSAP eases by name: `__spr.pop` is a function, usable as `ease: __spr.pop`
  for (const k of ["pop", "snap", "soft", "row", "settle", "cam"]) { out[k] = ease(k); out[k + "In"] = easeIn(k); }
  out.easeIn = easeIn;
  return out;
}

export const springRuntimeJS = `const __spr = (${springModule.toString()})();`;

/** Entrance duration the films use for an item: the one number the peak rule is computed from. */
export const ENTRY_DUR = 0.5;
