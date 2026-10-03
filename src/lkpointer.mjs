/**
 * lkpointer.mjs - the pointer and the camera that follows it, as PURE FUNCTIONS OF TIME.
 *
 * docs/POINTER_MOTION.md is the method; this is the implementation of it. Read that first.
 *
 * The shape of it, in one paragraph. The pointer is an ORBIT: a slow loose circle through the
 * middle of the frame that is always moving (P10). Occasionally the narration reaches the point of
 * a beat, and the pointer is smoothly BLENDED toward it and back (an "event": point at it, or click
 * it - P11), never toward background components (P12). The camera has no shots: it is the pointer's
 * guide run through a slow heavy filter, so it drifts loosely after it, and it closes in on an event
 * only while the pointer is holding there (P13). Everything is a function of t, defined for every t,
 * built from smooth pieces, so position and velocity are continuous by construction (P1, P2).
 *
 * The first pointer was a schedule of segments with gaps it fell through (a teleport on 94% of
 * beats) and a click every 2.5 s whatever was being said; the camera was overlapping tweens.
 *
 * NO dependencies, NO DOM: `pointerModule` is one self-contained function. scripts/test-pointer.mjs
 * calls it directly (continuity is proved offline); `pointerRuntimeJS` serialises the same function
 * into the page as `__ptr` (what is proved is what renders).
 *
 * Coordinates: world px RELATIVE TO THE FRAME CENTRE, y down, z TOWARD the camera.
 */

export function pointerModule() {
  const D = 1600; // perspective, px: scale at depth z is D / (D - z)
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /** 6u^5 - 15u^4 + 10u^3: zero first AND second derivative at both ends. */
  const smoother = (u) => {
    u = clamp(u, 0, 1);
    return u * u * u * (u * (6 * u - 15) + 10);
  };
  const TAU = Math.PI * 2;

  /* -------------------------------------------------------------- the filters (feel) */

  const kernels = {};
  /**
   * Impulse response of a 2nd-order system, sampled and renormalised. zeta < 1 is under-damped
   * (overshoots: mass); zeta = 1 is critically damped (lags, never overshoots). Cached.
   */
  function kernel(omega, zeta) {
    const key = omega + "/" + zeta;
    if (kernels[key]) return kernels[key];
    const horizon = 6 / (zeta * omega); // e^-6 of the response left: negligible
    const dt = 1 / 90;
    const n = Math.max(8, Math.ceil(horizon / dt));
    const w = new Array(n);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const s = i * dt;
      let h;
      if (zeta < 1) {
        const wd = omega * Math.sqrt(1 - zeta * zeta);
        h = ((omega * omega) / wd) * Math.exp(-zeta * omega * s) * Math.sin(wd * s);
      } else {
        h = omega * omega * s * Math.exp(-omega * s);
      }
      w[i] = h * dt;
      sum += w[i];
    }
    for (let i = 0; i < n; i++) w[i] /= sum;
    return (kernels[key] = { w, dt, n });
  }

  /** (fn * kernel)(t) over x, y, z and s: fn is evaluated at t - s for each sample s. Stateless. */
  function lag(fn, t, K) {
    let x = 0, y = 0, z = 0, s = 0;
    for (let i = 0; i < K.n; i++) {
      const g = fn(t - i * K.dt);
      x += g.x * K.w[i];
      y += g.y * K.w[i];
      z += g.z * K.w[i];
      s += g.s * K.w[i];
    }
    return { x, y, z, s };
  }

  /**
   * The kernel of  G * (identity - F)  : "how far behind F the signal is, smoothed by G", as ONE
   * kernel, so the camera's tilt costs a single pass. Linear filters commute and compose, which is
   * the whole reason this model can be written statelessly.
   */
  function behind(G, F) {
    const n = G.n + F.n - 1;
    const w = new Array(n).fill(0);
    for (let i = 0; i < G.n; i++) for (let j = 0; j < F.n; j++) w[i + j] += G.w[i] * F.w[j];
    const out = new Array(n);
    for (let k = 0; k < n; k++) out[k] = (k < G.n ? G.w[k] : 0) - w[k];
    return { w: out, dt: G.dt, n };
  }

  /* ------------------------------------------------------------------ the camera pose */

  /**
   * The camera pose that puts world point P at the centre of the frame at zoom `s` with a
   * pitch/yaw tilt. The stage is rotated about the frame centre and THEN translated, so the
   * translation cancels the rotated position of P; zoom is a move along z under perspective D.
   */
  function pose(P, s, rx, ry) {
    const r = Math.PI / 180;
    const cx = Math.cos(rx * r), sx = Math.sin(rx * r), cy = Math.cos(ry * r), sy = Math.sin(ry * r);
    const y1 = P.y * cx - P.z * sx, z1 = P.y * sx + P.z * cx; // rotateX
    const x2 = P.x * cy + z1 * sy, z2 = -P.x * sy + z1 * cy; // then rotateY
    return { x: -x2, y: -y1, z: D - D / s - z2, rotationX: rx, rotationY: ry };
  }

  /**
   * Where a world point lands on the SCREEN (px, frame centre = 960,540) under a camera pose, and
   * the perspective scale k at that depth. Same order as pose(): rotateX, rotateY, translate, then
   * perspective. It exists so a screen-space effect (a pixel blast on a canvas above the 3D world)
   * can be placed exactly where something in the world is.
   */
  function project(P, cam) {
    const r = Math.PI / 180;
    const cx = Math.cos(cam.rotationX * r), sx = Math.sin(cam.rotationX * r), cy = Math.cos(cam.rotationY * r), sy = Math.sin(cam.rotationY * r);
    const y1 = P.y * cx - P.z * sx, z1 = P.y * sx + P.z * cx;
    const x2 = P.x * cy + z1 * sy, z2 = -P.x * sy + z1 * cy;
    const k = D / (D - (z2 + cam.z));
    return { x: 960 + (x2 + cam.x) * k, y: 540 + (y1 + cam.y) * k, k };
  }

  /* ------------------------------------------------------------------------- the model */

  const DEFAULTS = {
    xy: { omega: 18, zeta: 0.65 }, // the pointer: light, a little playful, settles in ~0.25 s
    z: { omega: 7, zeta: 0.4 }, // slower and bouncier: it sways toward and away from the camera
    cam: { omega: 1.4, zeta: 1.0 }, // the camera: heavy, critically damped, ~1.4 s behind
    tilt: { omega: 2.6, zeta: 1.0 }, // yaw/pitch are SMOOTHED too: the tilt leans, it does not twitch
    beta: 0.68, // the camera leans this fraction of the way toward the pointer
    kYaw: 0.026, // deg of yaw per px the pointer is ahead of the camera (x)
    kPitch: 0.026,
    maxYaw: 10,
    maxPitch: 6,
    zoom0: 1.04, // held ~constant between events
    zoomSpring: { f: 0.9, z: 0.72 }, // the camera's zoom has MASS: closes in with a hair of overshoot (= lkspring SPR.cam)
    sway: { x: 10, y: 8, z: 24 },
    hoverLead: 0.1, // open hand this long before the hold starts
    press: 0.22, // pointing hand this long after a click
  };

  /** The step response of a damped spring (the same closed form as lkspring.S; test-pointer asserts they agree). */
  function S(t, f, z) {
    if (t <= 0) return 0;
    const w = TAU * f;
    if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  }

  const DEFAULT_ORBIT = { cx: 0, cy: 0, cz: 100, rx: 380, ry: 150, rz: 120, period: 8, phase: 0, dir: 1 };

  /**
   * spec = {
   *   orbit?: { cx, cy, cz, rx, ry, rz, period, phase, dir },
   *   events: [{ t0, tA, tB, t1, p: {x,y,z}, click?: t, circle?: { r, period }, zoom }],  // disjoint
   *   params?
   * }
   * Returns pure functions of t.
   */
  function build(spec) {
    const P = Object.assign({}, DEFAULTS, spec.params || {});
    const O = Object.assign({}, DEFAULT_ORBIT, spec.orbit || {});
    const events = (spec.events || []).slice().sort((a, b) => a.t0 - b.t0);
    const Kxy = kernel(P.xy.omega, P.xy.zeta);
    const Kz = kernel(P.z.omega, P.z.zeta);
    const Kc = kernel(P.cam.omega, P.cam.zeta);
    const Ktilt = behind(kernel(P.tilt.omega, P.tilt.zeta), Kc);
    const W = TAU / O.period;

    /**
     * The camera's zoom: ONE SPRING PER CHANGE (the ui-morph technique), never a restart. The camera pushes toward
     * an event as the pointer lands on it and releases when the hold ends; each is one more spring added from its
     * own time, so zoom and its velocity stay continuous and zoomAt(t) is exact at any t with no history.
     */
    const zkeys = [];
    events.forEach((e) => { zkeys.push([e.tA - 0.1, e.zoom || P.zoom0]); zkeys.push([e.tB + 0.25, P.zoom0]); });
    const zoomAt = (t) => {
      let v = P.zoom0, prev = P.zoom0;
      for (let i = 0; i < zkeys.length; i++) { v += (zkeys[i][1] - prev) * S(t - zkeys[i][0], P.zoomSpring.f, P.zoomSpring.z); prev = zkeys[i][1]; }
      return v;
    };

    /** The default: a slow loose circle through the middle of the frame. x cos, y slower sin, z swaying. */
    const orbitAt = (t) => ({
      x: O.cx + O.rx * Math.cos(O.dir * W * t + O.phase),
      y: O.cy + O.ry * Math.sin(0.8 * O.dir * W * t + O.phase),
      z: O.cz + O.rz * Math.sin(0.6 * W * t + O.phase),
    });

    /** 0 on the orbit, 1 while holding on the event; smooth (zero 1st and 2nd derivative) at both ends. */
    const weightOf = (e, t) => {
      if (t <= e.t0 || t >= e.t1) return 0;
      if (t < e.tA) return smoother((t - e.t0) / (e.tA - e.t0));
      if (t <= e.tB) return 1;
      return smoother((e.t1 - t) / (e.t1 - e.tB));
    };

    /** Where the event is, at time t: a fixed point, or (circle) a point the pointer circles. */
    const targetOf = (e, t) => {
      if (!e.circle) return e.p;
      const a = (TAU * (t - e.t0)) / e.circle.period;
      return { x: e.p.x + e.circle.r * Math.cos(a), y: e.p.y + e.circle.r * Math.sin(a), z: e.p.z };
    };

    /** Intent: the orbit, blended toward whichever event is active. */
    function guide(t) {
      const o = orbitAt(t);
      let wsum = 0, gx = 0, gy = 0, gz = 0;
      for (let i = 0; i < events.length; i++) {
        const w = weightOf(events[i], t);
        if (w <= 0) continue;
        const tg = targetOf(events[i], t);
        gx += w * (tg.x - o.x);
        gy += w * (tg.y - o.y);
        gz += w * (tg.z - o.z);
        wsum += w;
      }
      if (wsum > 1) { gx /= wsum; gy /= wsum; gz /= wsum; } // overlapping events share the blend
      return { x: o.x + gx, y: o.y + gy, z: o.z + gz };
    }

    /** 0 on the orbit .. 1 holding on an event. */
    function holdAt(t) {
      let m = 0;
      for (let i = 0; i < events.length; i++) m = Math.max(m, weightOf(events[i], t));
      return m;
    }

    const sway = (t) => ({
      x: P.sway.x * Math.sin((TAU * t) / 3.1 + 0.4),
      y: P.sway.y * Math.cos((TAU * t) / 2.4),
      z: P.sway.z * Math.sin((TAU * t) / 2.7 + 1.1),
    });

    /** Feel: the guide through a light under-damped filter (x, y) and a bouncier one (z), plus sway. */
    function pointerAt(t) {
      const n = Math.max(Kxy.n, Kz.n);
      let x = 0, y = 0, z = 0;
      for (let i = 0; i < n; i++) {
        const g = guide(t - i * Kxy.dt);
        if (i < Kxy.n) { x += g.x * Kxy.w[i]; y += g.y * Kxy.w[i]; }
        if (i < Kz.n) z += g.z * Kz.w[i];
      }
      const s = sway(t);
      return { x: x + s.x, y: y + s.y, z: z + s.z };
    }

    /** What the camera is steered by: where to lean, and how close to be. */
    const steer = (t) => {
      const g = guide(t);
      let zoom = P.zoom0;
      for (let i = 0; i < events.length; i++) zoom += weightOf(events[i], t) * ((events[i].zoom || P.zoom0) - P.zoom0);
      return { x: g.x * P.beta, y: g.y * P.beta, z: g.z * P.beta, s: zoom };
    };

    /**
     * The camera: no shots. The steering signal through a slow, heavy filter, so it drifts loosely
     * after the pointer and closes in only while the pointer holds (the zoom is lagged too, so it
     * arrives after the pointer does and eases out after it has left). Yaw and pitch come from how
     * far behind it is.
     */
    function cameraAt(t, zoomAdd) {
      const c = lag(steer, t, Kc);
      // how far behind the pointer the camera is, smoothed (one pass, composed kernel)
      const e = lag(steer, t, Ktilt);
      const ex = e.x, ey = e.y;
      const ry = clamp(-P.kYaw * ex, -P.maxYaw, P.maxYaw);
      const rx = clamp(P.kPitch * ey, -P.maxPitch, P.maxPitch);
      const zoom = zoomAt(t) + (zoomAdd || 0); // zoomAdd: a transition's recoil, added on top
      return Object.assign(pose(c, zoom, rx, ry), { aim: c, err: { x: ex, y: ey }, zoom });
    }

    /** "n" arrow, "h" open hand, "c" pointing hand. From the schedule, never the geometry (P8). */
    function stateAt(t) {
      for (let i = 0; i < events.length; i++) {
        const e = events[i];
        if (e.click != null && t >= e.click && t < e.click + P.press) return "c";
      }
      for (let i = 0; i < events.length; i++) {
        const e = events[i];
        if (t >= e.tA - P.hoverLead && t < e.tB) return "h";
      }
      return "n";
    }

    return { pointerAt, cameraAt, stateAt, guideAt: guide, holdAt, orbitAt, zoomAt, params: P, events };
  }

  return { build, pose, project, kernel, smoother, DEFAULTS, DEFAULT_ORBIT };
}

/** The same function, serialised for the page as `__ptr`. */
export const pointerRuntimeJS = "const __ptr = (" + pointerModule.toString() + ")();";

/* ------------------------------------------------------------------------ the lab spec */

/**
 * The 5-second lab (docs/POINTER_MOTION.md section 4): five red dots at five depths. The pointer
 * carries through the volume on its orbit; dots 1, 3, 5 are POINTED at (the open hand circles them),
 * dots 2 and 4 are CLICKED. Shared by the builder and the test so they cannot drift.
 */
export const LAB = {
  duration: 5,
  dots: [
    { x: -600, y: -170, z: -400 },
    { x: 380, y: -260, z: 60 },
    { x: -260, y: 190, z: 330 },
    { x: 640, y: 110, z: -220 },
    { x: -40, y: -40, z: -620 },
  ],
  /** which dots are clicked (the others are only pointed at) */
  clicked: [false, true, false, true, false],
  /** the pointer presses/points a little IN FRONT of each dot, so it is never behind it */
  front: 70,
  orbit: { cx: 0, cy: 0, cz: 80, rx: 420, ry: 170, rz: 140, period: 6.5, phase: 0.6, dir: 1 },
  events() {
    return this.dots.map((d, i) => {
      const clicked = this.clicked[i];
      const A = 0.75 + 0.9 * i; // the pointer has ARRIVED by here
      const rise = 0.55, hold = clicked ? 0.4 : 0.3, fall = 0.55;
      // Rise and fall overlap the neighbours: travel between two dots is a direct blend from one
      // to the next over ~0.5 s (peak ~3,700 px/s for 1,000 px), not a leave-and-return.
      const e = {
        t0: A - rise, tA: A, tB: A + hold, t1: A + hold + fall,
        p: { x: d.x, y: d.y, z: d.z + this.front },
        zoom: clicked ? 2.0 : 1.7,
        dot: i,
      };
      if (clicked) e.click = A + 0.2;
      else e.circle = { r: 70, period: 1.0 };
      return e;
    });
  },
  spec() {
    return { orbit: this.orbit, events: this.events() };
  },
};
