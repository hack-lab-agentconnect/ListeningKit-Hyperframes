/**
 * lkfx.mjs - the transition and click effects, as PURE FUNCTIONS OF TIME: the gunshot flash, the
 * speed ramp and camera rush, the pixel WIPE (a mask) and the click RINGS. docs/TRANSITION_FX.md is
 * the method; src/transitions/ is where whole transitions are assembled from these.
 *
 * Same contract as lkpointer.mjs: no DOM, no state, no Math.random. `fxModule` is one
 * self-contained function; tests call it directly and `fxRuntimeJS` serialises the same function
 * into a page as `__fx2`, so what is tested is what renders.
 *
 *   FLASH   a gunshot: a hard 3-frame attack, a fast tail, gone by 0.5 s, peaking at 0.5.
 *   WARP    the speed ramp's CLOCK: a time remap tau(t). Everything on tau accelerates into a cut.
 *   RUSH    the speed ramp's CAMERA: the world accelerates AT the camera into the cut (extra zoom,
 *           ease-in) and settles out of it (ease-out). This is what makes the transition itself
 *           read as a speed ramp, because slow motion at 3x is still slow.
 *   WIPE    a pixel wipe as a MASK. A grid of cells sweeps across the frame, each cell scaling 0 -> 1.
 *           The cells are WINDOWS: the incoming composition shows through them while the outgoing one
 *           stays everywhere else. It is not an overlay; nothing is painted over the scene except a
 *           2 px outline on the cells that are still growing.
 *   RINGS   a click: three concentric 2 px rings radiating outward from the pressed point.
 */

export function fxModule() {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const smoother = (u) => { u = clamp(u, 0, 1); return u * u * u * (u * (6 * u - 15) + 10); };
  const easeOut = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);

  /** Deterministic PRNG (LCG). A render must be identical every run, so no Math.random, ever. */
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  }

  /* ----------------------------------------------------------------------- the gunshot flash */

  const FLASH = { attack: 0.05, decay: 0.13, duration: 0.5, peak: 0.5 };

  /**
   * Flash intensity 0..1 `age` seconds after it fires. A hard attack to full inside 0.05 s (3
   * frames at 30 fps), then an exponential tail forced to exactly 0 by `duration`. Cut at the
   * PEAK (age = attack): the swap is hidden by the brightest frame.
   */
  function flashAt(age, p) {
    p = p || FLASH;
    if (age <= 0 || age >= p.duration) return 0;
    if (age < p.attack) return p.peak * smooth(age / p.attack);
    const tail = Math.exp(-(age - p.attack) / p.decay);
    return p.peak * tail * (1 - smooth((age - (p.duration - 0.12)) / 0.12));
  }

  /** A short recoil: extra zoom that jumps at the peak and settles. Added to the camera. */
  function kickAt(age, amount) {
    if (age < 0.02) return 0;
    return (amount === undefined ? 0.07 : amount) * Math.exp(-(age - 0.02) / 0.09);
  }

  /**
   * The camera rush: extra zoom that builds on an ease-in over the `rampOut` seconds before the seam
   * (the world accelerating at the camera), peaks AT the seam, and settles on an ease-out over the
   * `rampIn` seconds after it (decelerating). spec: { seam, rampOut, rampIn, amount }.
   */
  function rushAt(t, spec) {
    if (t <= spec.seam - spec.rampOut || t >= spec.seam + spec.rampIn) return 0;
    if (t < spec.seam) return spec.amount * Math.pow((t - (spec.seam - spec.rampOut)) / spec.rampOut, 3);
    return spec.amount * Math.pow(1 - (t - spec.seam) / spec.rampIn, 3);
  }

  /* ------------------------------------------------------------------------ the speed ramp */

  /**
   * spec: { seam, rampOut, rampIn, peak }. Speed is 1, climbs to `peak` over the `rampOut` seconds
   * before the seam, and falls back to 1 over the `rampIn` seconds after it. tau(t) is the integral
   * of speed: monotonic, continuous, with continuous speed.
   */
  function makeWarp(spec) {
    const HZ = 480, dt = 1 / HZ;
    const speedAt = (t) => {
      if (t <= spec.seam - spec.rampOut || t >= spec.seam + spec.rampIn) return 1;
      if (t < spec.seam) return 1 + (spec.peak - 1) * smoother((t - (spec.seam - spec.rampOut)) / spec.rampOut);
      return 1 + (spec.peak - 1) * (1 - smoother((t - spec.seam) / spec.rampIn));
    };
    const table = [0];
    const end = spec.seam + spec.rampIn + 30;
    for (let t = 0, i = 0; t < end; i++, t = i * dt) table.push(table[i] + 0.5 * (speedAt(t) + speedAt(t + dt)) * dt);
    const tau = (t) => {
      if (t <= 0) return t;
      const f = t * HZ, i = Math.floor(f);
      if (i >= table.length - 1) return table[table.length - 1] + (t - (table.length - 1) * dt);
      return table[i] + (table[i + 1] - table[i]) * (f - i);
    };
    return { tau, speedAt };
  }

  /* ------------------------------------------------------------------------- the pixel wipe */

  /**
   * The wipe's cells, `age` seconds after it starts: [{ cx, cy, s, u }]. `s` is the cell's current
   * size in px (0 -> `cell` with a little overshoot), `u` its 0..1 progress. A cell is a WINDOW: the
   * incoming composition is visible inside it. The sweep runs across the frame (`dir`) and
   * ACCELERATES (`accel` < 1 bunches the late cells in, so the edge speeds up like a speed ramp);
   * each cell has seeded jitter so the edge is ragged. spec: { W, H, cell, seed, dir, sweep, pop,
   * jitter, accel }. Cells that have not started are omitted; finished cells are full size.
   */
  function wipeCells(age, spec) {
    const r = rng(spec.seed);
    const cols = Math.ceil(spec.W / spec.cell), rows = Math.ceil(spec.H / spec.cell);
    const horizontal = spec.dir === "right" || spec.dir === "left";
    const accel = spec.accel === undefined ? 0.6 : spec.accel;
    const out = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const jit = r() * spec.jitter;
        let pos = horizontal ? i / Math.max(1, cols - 1) : j / Math.max(1, rows - 1);
        if (spec.dir === "left" || spec.dir === "up") pos = 1 - pos;
        const delay = Math.pow(pos, accel) * spec.sweep + jit;
        const u = clamp((age - delay) / spec.pop, 0, 1);
        if (u <= 0) continue;
        const back = 1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2); // ease-out with a little overshoot
        out.push({ i, j, cx: (i + 0.5) * spec.cell, cy: (j + 0.5) * spec.cell, s: spec.cell * back + (u >= 1 ? 1.5 : 0), u });
      }
    }
    return out;
  }

  /** The time at which the wipe is complete (every cell full size). */
  const wipeDuration = (spec) => spec.sweep + spec.jitter + spec.pop;

  /** Fraction of the frame the cells cover (0..1): the incoming composition's visible share. */
  function wipeCoverage(cells, spec) {
    const frame = Math.ceil(spec.W / spec.cell) * Math.ceil(spec.H / spec.cell) * spec.cell * spec.cell;
    return Math.min(1, cells.reduce((sum, c) => sum + Math.min(c.s, spec.cell + 2) * Math.min(c.s, spec.cell + 2), 0) / frame);
  }

  /**
   * The only thing painted over the scene: a `width` px outline on each cell that is still growing, so
   * the pixels read as pixels. Finished cells carry nothing. Scale only (outline size = cell size).
   */
  function drawWipeEdges(ctx, cells, spec) {
    ctx.lineWidth = spec.edgeWidth === undefined ? 2 : spec.edgeWidth;
    ctx.strokeStyle = spec.edgeColor || "#FFFFFF";
    const flashU = spec.flashU || 0;
    ctx.fillStyle = "#FFFFFF";
    for (const c of cells) {
      if (c.u >= 1) continue;
      const h = c.s / 2;
      // the gunshot lives on the wipe FRONT: a cell is solid white while it is young, then settles to its outline
      if (c.u < flashU) ctx.fillRect(Math.round(c.cx - h), Math.round(c.cy - h), Math.round(c.s), Math.round(c.s));
      ctx.strokeRect(Math.round(c.cx - h), Math.round(c.cy - h), Math.round(c.s), Math.round(c.s));
    }
  }

  /* --------------------------------------------------------------------------- the click rings */

  /**
   * A click: `count` concentric rings radiating outward from (x, y), `age` seconds after the press, as 8-BIT PIXEL
   * ART. Ring j starts `stagger` seconds after ring j-1, grows from 0 to `radius` (x the perspective scale k) on an
   * ease-out and UNWINDS as it goes: its arc shortens from a full circle to nothing, so a ring leaves by scale,
   * never by alpha.
   *
   * Each ring is THREE concentric pixel bands on ONE global grid of `cell` px (so every ring, and every click, sits
   * on the same pixel lattice):
   *     core     1 cell, the INNER COLOUR (white): the same on every ring, whatever it hit
   *     stroke   1 cell each side, a slightly pixelated stroke (brand blue)
   *     outline  1 cell each side, the outer stroke (the system's black)
   * so it never fades into the background: whatever the stage, one of the bands contrasts with it.
   * Layers are drawn across ALL rings (every outline, then every stroke, then every core), so a ring crossing
   * another never cuts into its core.
   *
   * spec: { x, y, k, count, radius, life, stagger, cell, colors: { core, stroke, outline } }
   */
  function ringState(age, spec, j) {
    const a = age - j * spec.stagger;
    if (a < 0 || a >= spec.life) return null;
    const u = a / spec.life;
    const radius = spec.radius * (spec.k || 1) * easeOut(u);
    const sweep = Math.PI * 2 * (1 - smooth((u - 0.45) / 0.55));
    if (radius < 1 || sweep < 0.02) return null;
    return { radius, sweep, start: -Math.PI / 2 + u * Math.PI * 1.2 + j * 0.9 };
  }

  /** The pixel cells ("i,j" on the global grid) of one band: the arc at `rad`, sampled finer than the cell. */
  function bandCells(spec, st, rad, cell) {
    const out = new Set();
    if (rad < cell * 0.5) return out;
    const n = Math.max(8, Math.ceil((st.sweep * rad) / (cell * 0.45)));
    for (let i = 0; i <= n; i++) {
      const th = st.start + (st.sweep * i) / n;
      out.add(Math.floor((spec.x + rad * Math.cos(th)) / cell) + "," + Math.floor((spec.y + rad * Math.sin(th)) / cell));
    }
    return out;
  }

  /** The three layers of one ring as sets of cells: { core, stroke, outline } (disjoint). */
  function ringCells(spec, st) {
    const c = spec.cell || 4, r = st.radius;
    const core = bandCells(spec, st, r, c);
    const stroke = new Set([...bandCells(spec, st, r - c, c), ...bandCells(spec, st, r + c, c)].filter((k) => !core.has(k)));
    const outline = new Set([...bandCells(spec, st, r - 2 * c, c), ...bandCells(spec, st, r + 2 * c, c)].filter((k) => !core.has(k) && !stroke.has(k)));
    return { core, stroke, outline };
  }

  function drawRings(ctx, age, spec) {
    const count = spec.count || 3, c = spec.cell || 4;
    const rings = [];
    for (let j = 0; j < count; j++) {
      const st = ringState(age, spec, j);
      if (st) rings.push(ringCells(spec, st));
    }
    const cols = spec.colors;
    for (const layer of ["outline", "stroke", "core"]) {
      ctx.fillStyle = cols[layer];
      for (const ring of rings) {
        for (const key of ring[layer]) {
          const m = key.indexOf(",");
          ctx.fillRect(+key.slice(0, m) * c, +key.slice(m + 1) * c, c, c);
        }
      }
    }
  }

  /**
   * The ring's colours: the INNER COLOUR IS THE SAME EVERY TIME (white), with the brand blue as the pixel stroke and
   * the system's black as the outer stroke. They do not adapt to the item any more: an adaptive ring was a ring that
   * vanished on the one item it was not adapted for. (item and stage are kept for the call sites.)
   */
  function ringColors(item, stage, blue) {
    return { core: "#FFFFFF", stroke: blue, outline: "#0A0F1A" };
  }

  return { flashAt, kickAt, rushAt, makeWarp, wipeCells, wipeDuration, wipeCoverage, drawWipeEdges, drawRings, ringCells, ringState, ringColors, rng, FLASH, smooth, smoother };
}

/** The same function, serialised for a page as `__fx2`. */
export const fxRuntimeJS = "const __fx2 = (" + fxModule.toString() + ")();";
