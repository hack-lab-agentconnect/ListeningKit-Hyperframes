/**
 * lkmotion.mjs â€” the reusable component library for the ListeningKit explainers.
 *
 * WHY THIS FILE EXISTS
 * The HyperFrames component catalog (docs/catalog/components, 223 entries) is a
 * reference library of motion *techniques*, not a set of video templates. Copying
 * a catalog component wholesale would give us a second, parallel system with its
 * own timing and its own stage logic â€” which is exactly what the storyboards
 * already are not. So nothing here is a template. Every export is a TREATMENT:
 * a way to animate the markup a beat ALREADY produced, using the beat's own
 * audio-relative `t` as its clock.
 *
 * THE CONTRACT
 *   A treatment never invents content. It reads what the storyboard already put
 *   in `beat.a` (and optionally extra config in `beat.a.fx`) and animates the
 *   elements that beat already renders. Adding a treatment can change how a
 *   moment is animated. It can never change what is said or shown.
 *
 *   A treatment never introduces its own timing system. It receives `t0`, which
 *   is the beat's audio-relative start (already J-cut-shifted by build-beats),
 *   and every offset it uses is relative to that.
 *
 *   A treatment never bypasses stage logic. Inks come from `tone`, which the
 *   storyboard owns, exactly as in scenes.mjs.
 *
 * HOW A BEAT OPTS IN
 *   { t: 41.2, kind: "record", tone: "white", fx: "field-resolve", a: {...} }
 *
 * See docs/COMPONENT_LIBRARY.md for the full mapping table (catalog component ->
 * treatment -> beat types -> required beat data -> timing/stage/transition
 * behaviour -> intended result) and for what in the catalog was rejected.
 */

import { C } from "./lkdesign.mjs";

/* ------------------------------------------------------------------ helpers */

/**
 * THE RUNTIME RULE FOR EVERY anim() IN THIS FILE.
 *
 * build-beats.mjs serialises a beat's animation with Function.prototype.toString()
 * and re-creates it inside the sub-composition page, where this module's imports
 * do not exist. So an anim body may not reference anything from this module —
 * not `C`, not `icon()`, not even the three helpers below. Everything it needs
 * hangs off ONE global, `__fx`, which is emitted into the page by
 * `motionRuntimeJS` and defined once.
 *
 * That is why the helpers are called as `__fx.sel(...)` rather than `sel(...)`:
 * a bare `sel(` in an anim body is a ReferenceError at render time, thousands
 * of frames into a 150-second file, which is the worst place to find one.
 *
 * Constants inside `__fx` are literals, each commented with its provenance:
 * a treatment may not read the design tokens at runtime, only restate them.
 */

/**
 * Guarded query. A treatment must never throw because a beat that a treatment
 * supports happened not to render a given element (a `note` is optional, a
 * `focus` may match no row). Returns an array either way so `.forEach` is safe.
 */
const sel = (h, s) => {
  const el = h.q(s);
  return el ? (Array.isArray(el) ? el : [el]) : [];
};

/** Deterministically split an element's text into per-word spans. */
const words = (el) => {
  if (!el || el.dataset.fxSplit === "1") return [];
  const text = (el.textContent || "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  el.dataset.fxSplit = "1";
  el.innerHTML = text
    .split(" ")
    .map((w) => `<span class="w">${w}</span>`)
    .join(" ");
  return Array.from(el.querySelectorAll(".w"));
};

/** Deterministically split an element's text into per-character spans. */
const chars = (el) => {
  if (!el || el.dataset.fxChars === "1") return [];
  const text = (el.textContent || "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  el.dataset.fxChars = "1";
  el.innerHTML = text
    .split("")
    .map((c) => `<span class="c">${c === " " ? "&nbsp;" : c}</span>`)
    .join("");
  return Array.from(el.querySelectorAll(".c"));
};

/* ------------------------------------------------------------ the treatments */

/**
 * TREATMENTS
 *
 * Each entry:
 *   from    catalog components whose motion language this borrows
 *   beats   which of our beat kinds it is designed for
 *   needs   extra beat data it consumes (all optional; it degrades to the beat's
 *           own animation when absent)
 *   mode    "after" â€” runs on top of the beat's own animation (default)
 *           "only"  â€” replaces it, because the treatment IS the treatment
 *   anim(tl, t0, h)  h = { q, qq, A } â€” h.A is the literal beat args object
 */
export const TREATMENTS = {
  /* ---------------------------------------------------------------- typography */

  /**
   * per-word-rise â€” the headline arrives word by word instead of all at once.
   *
   * from: per-word-rise, text-stagger, per-word-crossfade.
   * beats: any beat with a kicker or headline (countup, journey, split,
   *        record, converge, typewriter, â€¦).
   * needs: { target?: css selector, stagger?, rise?, start? } in `a.fx`.
   * stage: ink is whatever the beat already rendered â€” this only moves boxes.
   */
  "per-word-rise": {
    from: ["per-word-rise", "text-stagger"],
    beats: "*",
    needs: "fx.target (selector, default [data-a=\"k\"]), fx.stagger (s), fx.rise (px), fx.start (s)",
    mode: "after",
    anim(tl, t0, h) {
      const fx = (h.A && h.A.fx) || {};
      const target = fx.target || '[data-a="k"]';
      const stagger = fx.stagger ?? 0.06;
      const rise = fx.rise ?? 34;
      const start = fx.start ?? 0.5;
      __fx.sel(h, target).forEach((el, ei) => {
        __fx.words(el).forEach((w, i) => {
          tl.fromTo(
            w,
            { scale: 0, y: rise },
            { scale: 1, y: 0, duration: 0.42, ease: __spr.pop },
            t0 + start + ei * 0.1 + i * stagger,
          );
        });
      });
    },
  },

  /**
   * char-drop â€” a short, hard phrase drops in letter by letter.
   *
   * from: char-slam-explode, bottom-up-letters, top-down-letters.
   * beats: endcard, countup, costCount â€” the moments where ONE word is the point.
   * needs: { target?, stagger?, drop?, start? }. Intentionally used sparingly:
   *      it is loud, and a loud treatment on every beat is noise.
   */
  "char-drop": {
    from: ["char-slam-explode", "bottom-up-letters"],
    beats: ["endcard", "countup", "costCount"],
    needs: "fx.target (default [data-a=\"w\"]), fx.stagger (s), fx.drop (px), fx.start (s)",
    mode: "after",
    anim(tl, t0, h) {
      const fx = (h.A && h.A.fx) || {};
      const target = fx.target || '[data-a="w"]';
      const stagger = fx.stagger ?? 0.035;
      const drop = fx.drop ?? 26;
      const start = fx.start ?? 0.35;
      __fx.sel(h, target).forEach((el, ei) => {
        __fx.chars(el).forEach((c, i) => {
          tl.fromTo(
            c,
            { y: drop, scaleY: 0.86 },
            { y: 0, scaleY: 1, duration: 0.3, ease: __spr.snap },
            t0 + start + ei * 0.1 + i * stagger,
          );
        });
      });
    },
  },

  /**
   * typewriter-run â€” the existing typed line gets a caret that tracks the last
   * glyph and a per-character settle, instead of a bare text swap.
   *
   * from: typewriter, typed-prompt, notes-typing.
   * beats: typewriter.
   * needs: { cps? (chars per second), caret?: "line"|"block"|"none" }
   * result: the reveal follows the narration, because `t0` is the beat's own
   *         audio-relative start and every line's offset is derived from the
   *         length of the text the storyboard already wrote.
   */
  "typewriter-run": {
    from: ["typewriter", "typed-prompt", "notes-typing"],
    beats: ["typewriter"],
    needs: "fx.cps (chars/sec, default 28), fx.lineGap (s), fx.caret",
    mode: "only",
    anim(tl, t0, h) {
      const fx = (h.A && h.A.fx) || {};
      const cps = fx.cps ?? 28;
      const lineGap = fx.lineGap ?? 1.5;
      const caret = fx.caret || "line";
      const lines = h.qq(".twl-line");
      tl.fromTo(
        __fx.sel(h, '[data-a="k"]'),
        { scale: 0, y: 26 },
        { scale: 1, y: 0, duration: 0.5, ease: __spr.pop },
        t0,
      );
      let cursor = 0.5;
      lines.forEach((el, li) => {
        const target = el.querySelector(".t");
        const text = el.dataset.text || "";
        if (!target) return;
        const dur = Math.max(0.45, text.length / cps);
        const state = { n: 0 };
        tl.fromTo(el, { scale: 0, y: 30 }, { scale: 1, y: 0, duration: 0.35, ease: __spr.pop }, t0 + cursor);
        tl.to(
          state,
          {
            n: text.length,
            duration: dur,
            ease: "none",
            onUpdate() {
              target.textContent = text.slice(0, Math.round(state.n));
            },
          },
          t0 + cursor,
        );
        cursor += dur + lineGap;
      });
      if (caret !== "none") {
        h.qq(".caret").forEach((c, i) => {
          if (caret === "block") {
            c.style.width = "18px";
            c.style.borderRadius = "3px";
          }
          tl.to(c, { opacity: 0, duration: 0.42, yoyo: true, repeat: -1, ease: "steps(1)" }, t0 + 1 + i * 0.2); // blink-ok: an instant on/off, not a fade
        });
      } else {
        h.qq(".caret").forEach((c) => c.remove());
      }
      tl.fromTo(
        __fx.sel(h, '[data-a="h"]'),
        { scale: 0, y: 26 },
        { scale: 1, y: 0, duration: 0.5, ease: __spr.pop },
        t0 + cursor + 0.3,
      );
    },
  },

  /* ------------------------------------------------------------------- records */

  /**
   * field-resolve â€” one field at a time: the KEY lands, the VALUE resolves into
   * it, then an optional annotation follows underneath.
   *
   * from: panel-reveal, focus-swap, input-feedback, skeleton-reveal.
   * beats: record, relations.
   * needs: the beat's own `r` rows, plus `focus` (which key to treat as the
   *      subject). Nothing extra is invented.
   * timing: one row per `step` seconds from `start`, so the row count â€” which
   *      comes from the object's real field list â€” sets the pacing.
   */
  "field-resolve": {
    from: ["panel-reveal", "focus-swap", "input-feedback", "skeleton-reveal"],
    beats: ["record", "relations"],
    needs: "fx.step (s per row, default 0.34), fx.start (s), fx.focus (key, else the beat's `focus`)",
    mode: "only",
    anim(tl, t0, h) {
      const fx = (h.A && h.A.fx) || {};
      const step = fx.step ?? 0.34;
      const start = fx.start ?? 0.35;
      const rows = h.qq(".row");
      tl.fromTo(__fx.sel(h, '[data-a="k"]'), { scale: 0, y: 26 }, { scale: 1, y: 0, duration: 0.5, ease: __spr.pop }, t0);
      rows.forEach((row, i) => {
        const at = t0 + start + i * step;
        tl.fromTo(row, { scale: 0, y: 18 }, { scale: 1, y: 0, duration: 0.4, ease: __spr.pop }, at);
        const k = row.querySelector(".rk");
        const v = row.querySelector(".rv");
        if (k) tl.fromTo(k, { scale: 0, x: -8 }, { scale: 1, x: 0, duration: 0.32, ease: __spr.pop }, at);
        // The value resolves AFTER its label, never with it: the label is the
        // question, the value is the answer, and the beat exists to make that
        // order legible.
        if (v) tl.fromTo(v, { scale: 0, y: 10 }, { scale: 1, y: 0, duration: 0.42, ease: __spr.pop }, at + 0.16);
      });
const edge = rows.length * step;
      // The named field still lights up. `field-resolve` replaces the ORDER the
      // record beat used, not the one thing that beat was for: the row the
      // narration is saying is the row that glows.
      const focusKey = fx.focus || A.focus;
      const lit = focusKey ? rows.find((r) => r.dataset.row === focusKey) : null;
      if (lit) {
        lit.style.background = lit.dataset.focusfill || lit.style.background;
        tl.to(lit, { scale: 1.02, duration: 0.4, ease: "power2.out" }, t0 + start + edge);
        tl.to(lit, { scale: 1, duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + start + edge + 0.5);
      }
      const note = __fx.sel(h, ".note")[0];
      if (note) {
        tl.fromTo(note, { scale: 0, x: 24 }, { scale: 1, x: 0, duration: 0.5, ease: __spr.pop }, t0 + start + (lit ? edge + 0.45 : edge + 0.2));
      }
    },
  },

  /**
   * focus-blur-resolve â€” the panel stays whole, everything except the subject
   * softens, the subject takes the one light edge in the system.
   *
   * from: focus-blur-resolve, focus-rack, spotlight-card, ui-focus-zoom.
   * beats: record, converge, relations.
   * needs: the beat's `focus` key. No new data.
   * result: the eye is told where to look without the panel being torn apart.
   */
  "focus-blur-resolve": {
    from: ["focus-blur-resolve", "focus-rack", "spotlight-card"],
    beats: ["record", "relations", "converge"],
    needs: "fx.focus (key, else the beat's `focus`)",
    mode: "after",
    anim(tl, t0, h) {
      const A = h.A || {};
      const fx = A.fx || {};
      const focus = fx.focus || A.focus;
      if (!focus) return;
      const rows = h.qq(".row");
      const hit = rows.find((r) => r.dataset.row === focus);
      if (!hit) return;
      // The subject LIFTS (scale, and the director raises it toward the camera). The other rows are
      // left alone: dimming them was a second way of faking depth, and the decision is edge + scale.
      tl.to(hit, { scale: 1.02, duration: 0.5, ease: __spr.pop }, t0 + 0.6);
      tl.to(hit, { scale: 1, duration: 1.6, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 1.1);
      const v = hit.querySelector(".rv");
      if (v) tl.fromTo(v, { scale: 0, }, { scale: 1, duration: 0.6, ease: __spr.pop }, t0 + 0.6);
    },
  },

  /**
   * chip-rail-tick â€” status-shaped fields tick to their done state, one after
   * another, in the row order the object actually defines.
   *
   * from: state-chip-rail, marker-checklist-card, success-check.
   * beats: record (any multi-status beat), journey.
   * needs: { keys?: which row keys are statuses, tick?: "check"|"dot" }
   *        Defaults to every row the beat rendered, which is why the storyboard
   *        should hand this beat only status rows when it wants the treatment.
   */
  "chip-rail-tick": {
    from: ["state-chip-rail", "marker-checklist-card", "success-check"],
    beats: ["record", "journey"],
    needs: "fx.keys (row keys, default all rows), fx.tick (\"check\"|\"dot\"), fx.step (s)",
    mode: "after",
    anim(tl, t0, h) {
      const fx = (h.A && h.A.fx) || {};
      const step = fx.step ?? 0.42;
      const rows = fx.keys
        ? h.qq(".row").filter((r) => fx.keys.includes(r.dataset.row))
        : h.qq(".row");
      rows.forEach((row, i) => {
        const at = t0 + 0.6 + i * step;
        const dot = row.querySelector(".rdot");
        if (dot) {
          tl.fromTo(dot, { scale: 0, }, { scale: 1, duration: 0.32, ease: __spr.snap }, at);
        }
        if (fx.tick !== "dot") {
          const mark = document.createElement("span");
          mark.className = "fxtick";
          mark.innerHTML = __fx.tickSvg;
// Brand blue on either stage: the tick sits on the CARD, and the card
          // is what inverts, not the stage.
          mark.style.cssText =
            "position:absolute;right:22px;top:50%;margin-top:-13px;color:" +
            ((h.A && h.A.tone) === "blue" ? __fx.blue : __fx.blueText);
          row.appendChild(mark);
          tl.fromTo(mark, { scale: 0, rotate: -25 }, { scale: 1, rotate: 0, duration: 0.4, ease: __spr.snap }, at + 0.12);
        }
      });
    },
  },

  /* ------------------------------------------------------------------ diagrams */

  /**
   * converge-chain â€” related objects arrive one at a time and the central object
   * resolves only once they have all landed, so the "many become one" reading
   * is a sequence rather than a pose.
   *
   * from: constellation-hub, stagger-cascade, stagger-lattice, radial-surround.
   * beats: converge.
   * needs: `n` / `labels` (already in the beat). fx.chip (s per chip), fx.coreIn (s).
   */
  "converge-chain": {
    from: ["constellation-hub", "stagger-cascade", "radial-surround"],
    beats: ["converge"],
    needs: "fx.chip (s per chip, default 0.18), fx.coreIn (s after last chip), fx.pull (0..1 of the way in)",
    mode: "only",
    anim(tl, t0, h) {
      const A = h.A || {};
      const fx = A.fx || {};
      const chipStep = fx.chip ?? 0.18;
      const pull = fx.pull ?? 0.95;
      const n = h.qq(".cvchip").length || A.n || 0;
      tl.fromTo(__fx.sel(h, '[data-a="k"]'), { scale: 0, y: 26 }, { scale: 1, y: 0, duration: 0.5, ease: __spr.pop }, t0);
      h.qq(".cvchip").forEach((el, i) => {
        const cx = parseFloat(el.dataset.cx) || 0;
        const cy = parseFloat(el.dataset.cy) || 0;
        tl.fromTo(
          el,
          { x: cx * 1.7, y: cy * 1.7, scale: 0, rotate: -4 },
          { x: cx * pull, y: cy * pull, scale: 1, rotate: 0, duration: 0.55, ease: __spr.soft },
          t0 + 0.5 + i * chipStep,
        );
      });
      const coreAt = t0 + 0.5 + n * chipStep + (fx.coreIn ?? 0.4);
      const core = __fx.sel(h, '[data-a="core"]')[0];
      if (core) {
        tl.fromTo(core, { scale: 0 }, { scale: 1, duration: 0.6, ease: __spr.pop }, coreAt);
        // The core lands ON the last chip, not after a beat of silence: the
        // chain has to feel like it resolves, not like it pauses.
        tl.to(core, { scale: 1.04, duration: 0.28, yoyo: true, repeat: 3, ease: "sine.inOut" }, coreAt + 0.6);
        tl.to(core, { y: -8, duration: 1.5, yoyo: true, repeat: -1, ease: "sine.inOut" }, coreAt + 1.6);
      }
    },
  },

  /**
   * stroke-trace â€” connector paths draw themselves instead of appearing.
   *
   * from: svg-stroke-trace, tracing-beam, outline-draw, hw-arrow.
   * beats: relations, record, journey, agentWork.
   * needs: nothing. It traces whatever connectors the beat already drew. Any
   *        element with a zero-length draw gets a ready-made stroke.
   */
  "stroke-trace": {
    from: ["svg-stroke-trace", "tracing-beam", "outline-draw"],
    beats: ["relations", "record", "journey", "agentWork"],
    needs: "fx.start (s), fx.draw (s per path), fx.order (\"in-order\"|\"reverse\")",
    mode: "after",
    anim(tl, t0, h) {
      const fx = (h.A && h.A.fx) || {};
      const start = fx.start ?? 0.5;
      const draw = fx.draw ?? 0.55;
      const paths = h.qq("path.rel, .relsvg path, .rel path").filter(
        (p) => !p.dataset.fxDrawn,
      );
      paths.forEach((p, i) => {
        p.dataset.fxDrawn = "1";
        const len = p.getTotalLength ? p.getTotalLength() : 400;
        const at = t0 + start + i * draw;
        tl.fromTo(
          p,
          { strokeDasharray: len, strokeDashoffset: fx.order === "reverse" ? -len : len },
          { strokeDashoffset: 0, duration: draw, ease: "power2.inOut" },
          at,
        );
      });
    },
  },

  /**
   * card-assemble â€” step cards arrive on a grid cascade, each one settling into
   * its cell rather than flying in from below.
   *
   * from: grid-card-assemble, staggered-fade-up, spring-pop, card-resize.
   * beats: journey, split, agentWork.
   * needs: fx.step (s per card), fx.from ("up"|"left"|"right"|"scale").
   */
  "card-assemble": {
    from: ["grid-card-assemble", "staggered-fade-up", "spring-pop"],
    beats: ["journey", "agentWork"],
    needs: "fx.step (s), fx.from (\"up\"|\"left\"|\"right\"|\"scale\"), fx.start (s)",
    mode: "only",
    anim(tl, t0, h) {
      const fx = (h.A && h.A.fx) || {};
      const step = fx.step ?? 0.34;
      const from = fx.from || "up";
      const start = fx.start ?? 0.4;
      tl.fromTo(__fx.sel(h, '[data-a="k"]'), { scale: 0, y: 26 }, { scale: 1, y: 0, duration: 0.5, ease: __spr.pop }, t0);
      const cards = h.qq(".jcard");
      cards.forEach((el, i) => {
        const at = t0 + start + i * step;
        const entry =
          from === "left"
            ? { x: -70, scale: 0 }
            : from === "right"
              ? { x: 70, scale: 0 }
              : from === "scale"
                ? { scale: 0 }
                : { y: 74, scale: 0 };
        tl.fromTo(el, entry, { x: 0, y: 0, scale: 1, duration: 0.55, ease: __spr.pop }, at);
      });
      const last = cards.length ? start + cards.length * step : start;
      const note = __fx.sel(h, '[data-a="n"]')[0];
      if (note) tl.fromTo(note, { scale: 0, y: 26 }, { scale: 1, y: 0, duration: 0.5, ease: __spr.pop }, t0 + last + 0.35);
    },
  },

  /**
   * comparison-wipe â€” the two sides of a contrast are revealed by a shared edge
   * that travels across the frame, so the comparison is the motion.
   *
   * from: before-after-wipe, comparison-split, directional-wipe, split-tilt-cards.
   * beats: split.
   * needs: nothing. Uses the beat's own `left` / `right` / `foot`.
   */
  "comparison-wipe": {
    from: ["before-after-wipe", "comparison-split", "directional-wipe"],
    beats: ["split"],
    needs: "fx.edge (s), fx.from (\"left\"|\"right\"|\"centre\"), fx.start (s)",
    mode: "only",
    anim(tl, t0, h) {
      const fx = (h.A && h.A.fx) || {};
      const edgeDur = fx.edge ?? 0.7;
      const from = fx.from || "left";
      const start = fx.start ?? 0.3;
      tl.fromTo(__fx.sel(h, '[data-a="k"]'), { scale: 0, y: 26 }, { scale: 1, y: 0, duration: 0.5, ease: __spr.pop }, t0);
      const sides = h.qq(".sp");
      if (!sides.length) return;
      const clip = (v) => ({ clipPath: `inset(0 ${v}% 0 0)` });
      sides.forEach((s, i) => {
        const lead = i === 0 ? 0 : edgeDur;
        const entry =
          from === "right"
            ? { x: 90, scale: 0 }
            : from === "centre"
              ? { scale: 0 }
              : { x: -90, scale: 0 };
        tl.fromTo(s, entry, { x: 0, scale: 1, duration: 0.6, ease: __spr.pop }, t0 + start + lead);
        // The travelling edge: the card's own leading boundary crosses the frame
        // rather than the card sliding. Same destination, different reading.
        tl.fromTo(
          s,
          clip(from === "right" ? 0 : 100),
          { clipPath: "inset(0 0% 0 0)", duration: edgeDur, ease: "power2.inOut" },
          t0 + start + lead,
        );
      });
      const div = __fx.sel(h, '[data-a="d"]')[0];
      if (div) tl.fromTo(div, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: __spr.pop }, t0 + start + edgeDur * 0.5);
      const foot = __fx.sel(h, '[data-a="f"]')[0];
      if (foot) tl.fromTo(foot, { scale: 0, y: 26 }, { scale: 1, y: 0, duration: 0.5, ease: __spr.pop }, t0 + start + edgeDur + 0.7);
      sides.forEach((s, i) => tl.to(s, { y: i ? 10 : -10, duration: 1.9 + i * 0.2, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + start + edgeDur + 0.8));
    },
  },

  /**
   * number-tick â€” the count resolves as a number that lands, not text that
   * appears. Same value the storyboard wrote; the motion is the point.
   *
   * from: count-up, number-pop-in, conic-progress-ring, number-wheel.
   * beats: countup, costCount.
* needs: the beat's `count` / `from` / `to`. fx.dur (s), fx.settle (overshoot).
   *
   * `countup` and `costCount` are the same beat wearing different selectors
   * (label vs l, count vs c, sub vs s). The treatment targets both spellings
   * rather than making the storyboard reshape its content to suit the animation.
   */
  "number-tick": {
    from: ["count-up", "number-pop-in", "number-wheel"],
    beats: ["countup", "costCount"],
    needs: "fx.dur (s, default 1.4), fx.settle (back-out strength), fx.number (selector override)",
    mode: "only",
    anim(tl, t0, h) {
      const A = h.A || {};
      const fx = A.fx || {};
      const dur = fx.dur ?? 1.4;
      const label = __fx.sel(h, '[data-a="label"], [data-a="l"]')[0];
      const num = __fx.sel(h, fx.number || '[data-a="count"] .n, [data-a="c"] .n')[0];
      const unit = __fx.sel(h, '[data-a="u"]')[0];
      const sub = __fx.sel(h, '[data-a="sub"], [data-a="s"]')[0];
      if (label) tl.fromTo(label, { scale: 0, y: 26 }, { scale: 1, y: 0, duration: 0.5, ease: __spr.pop }, t0);
      const from = A.from ?? 0;
      const to = A.count ?? A.to ?? 0;
      if (num) {
        const state = { n: from };
        const decimals = String(to).includes(".") ? String(to).split(".")[1].length : 0;
        // The number ships in the markup hidden (scale 0 from its fromTo), so the treatment has to
        // bring it in itself. Not optional: a treatment that REPLACES the beat's
        // own animation inherits the duty to reveal everything that animation
        // revealed. Missing this produced an empty frame on every counted beat.
        tl.fromTo(num, { scale: 0 }, { scale: 1, duration: 0.5, ease: __spr.soft }, t0 + 0.15);
        tl.to(
          state,
          {
            n: to,
            duration: dur,
            ease: "power2.out",
            onUpdate() {
              num.textContent = decimals
                ? state.n.toFixed(decimals)
                : Math.round(state.n).toLocaleString("en-US");
            },
          },
          t0 + 0.5,
        );
        tl.fromTo(num, { scale: 0.94 }, { scale: 1, duration: 0.45, ease: (fx.settle ?? 1.9) <= 1.5 ? __spr.soft : (fx.settle ?? 1.9) < 1.95 ? __spr.pop : __spr.snap }, t0 + 0.5 + dur);
        // Every beat animates continuously, so the number keeps a slow breathe.
        // A transform only: letterSpacing or y reflow snaps glyphs under
        // frame-by-frame capture.
        tl.to(num, { scale: 1.015, duration: 1.1, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 0.5 + dur + 0.4);
      }
      if (unit) tl.fromTo(unit, { scale: 0, x: -24 }, { scale: 1, x: 0, duration: 0.4, ease: __spr.pop }, t0 + 0.5 + dur * 0.6);
      if (sub) tl.fromTo(sub, { scale: 0, y: 26 }, { scale: 1, y: 0, duration: 0.5, ease: __spr.pop }, t0 + 0.5 + dur + 0.6);
    },
  },

  /**
   * marker-highlight â€” a phrase inside the beat's own note is marked with the
   * brand's underline sweep once it has been said. No text is added: the phrase
   * is already in the storyboard's `note` / `foot` / `verdict`.
   *
   * from: marker-highlight, inline-highlight, hw-underline, strike, stitch.
   * beats: any beat carrying a note (overwhelm, journey, split, converge).
   * needs: { phrase: substring already present in the text, target?, at? (s) }
   */
  "marker-highlight": {
    from: ["marker-highlight", "inline-highlight", "hw-underline"],
    beats: "*",
    needs: "fx.phrase (substring of the existing note), fx.target (default .note / [data-a=\"f\"]), fx.at (s), fx.sweep (s)",
    mode: "after",
    anim(tl, t0, h) {
      const fx = (h.A && h.A.fx) || {};
      if (!fx.phrase) return;
      const targets = fx.target ? __fx.sel(h, fx.target) : [...h.qq(".note"), ...__fx.sel(h, '[data-a="f"]'), ...__fx.sel(h, '[data-a="n"]')];
      targets.forEach((el) => {
        if (!el || el.dataset.fxMarked === "1") return;
        const html = el.innerHTML;
        const i = html.toLowerCase().indexOf(String(fx.phrase).toLowerCase());
        if (i < 0) return;
        el.dataset.fxMarked = "1";
        el.innerHTML =
          html.slice(0, i) +
          `<span class="fxmark">${html.slice(i, i + String(fx.phrase).length)}</span>` +
          html.slice(i + String(fx.phrase).length);
        const mark = el.querySelector(".fxmark");
        tl.fromTo(
          mark,
          { backgroundSize: "0% 100%" },
          { backgroundSize: "100% 100%", duration: fx.sweep ?? 0.55, ease: "power2.inOut" },
          t0 + (fx.at ?? 1.6),
        );
      });
    },
  },

  /**
   * scramble-resolve â€” a short label resolves out of deterministic noise. Used
   * where a value has to feel like it was looked up rather than typed.
   *
   * from: scramble-reveal, matrix-decode, per-word-crossfade.
   * beats: record, converge, countup.
   * needs: { target?, from?: glyph set (default A-Z0-9), steps?: frames of noise, at? }
   *        Deterministic by construction: a fixed-seed LCG, no Math.random,
   *        because a render must be byte-identical on every run.
   */
  "scramble-resolve": {
    from: ["scramble-reveal", "matrix-decode"],
    beats: ["record", "converge", "countup"],
    needs: "fx.target (default .apichip), fx.steps (noise frames, default 8), fx.frame (s), fx.at (s), fx.glyphs",
    mode: "after",
    anim(tl, t0, h) {
      const fx = (h.A && h.A.fx) || {};
      const target = fx.target || ".apichip";
      const steps = fx.steps ?? 8;
      const frame = fx.frame ?? 0.035;
      const at = t0 + (fx.at ?? 0.9);
      const glyphs = fx.glyphs || "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      __fx.sel(h, target).forEach((el) => {
        const final = el.textContent;
        const state = { i: 0 };
        let seed = final.length * 7919 + steps;
        const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
        tl.to(
          state,
          {
            i: steps,
            duration: steps * frame,
            ease: "none",
            onUpdate() {
              const k = state.i / steps;
              el.textContent = final
                .split("")
                .map((c, ci) => {
                  if (c === " ") return " ";
                  // Character-by-character settle, left to right: the name
                  // resolves rather than the whole string flickering.
                  return ci / final.length < k ? c : glyphs[Math.floor(rnd() * glyphs.length)];
                })
                .join("");
            },
          },
          at,
        );
      });
    },
  },

  /**
   * wordmark-lockup â€” the end card, held. The logo is placed, never rebuilt:
   * the supplied brand asset is scaled and faded only, because reconstructing
   * or distorting a wordmark is a brand bug, not a style choice.
   *
   * from: logo-brand-close, titlecard-lockup, logo-sting, store-badge-lockup.
   * beats: endcard.
   * needs: nothing. Uses the beat's `word` / `cta` / `url` and assets/logo.svg.
   */
  "wordmark-lockup": {
    from: ["logo-brand-close", "titlecard-lockup", "logo-sting"],
    beats: ["endcard"],
    needs: "none â€” the beat's own word/cta/url and the brand asset",
    mode: "only",
    anim(tl, t0, h) {
      const mark = __fx.sel(h, ".ecmark")[0];
      const word = __fx.sel(h, '[data-a="w"]')[0];
      const cta = __fx.sel(h, '[data-a="c"]')[0];
      const url = __fx.sel(h, '[data-a="u"]')[0];
      if (mark) {
        // scale + fade only. No rotate, no skew, no drawn-in rebuild: the
        // asset IS the wordmark's lockup.
        tl.fromTo(mark, { scale: 0 }, { scale: 1, duration: 0.9, ease: __spr.pop }, t0);
      }
      if (word) {
        tl.fromTo(word, { scale: 0, y: 26 }, { scale: 1, y: 0, duration: 0.75, ease: __spr.pop }, t0 + 0.45);
        // letterSpacing is never animated. It reflows the glyphs on every frame
        // and a tracked-out wordmark is not the wordmark.
        tl.to(word, { scale: 1.02, duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 1.6);
      }
      if (cta) tl.fromTo(cta, { scale: 0, y: 22 }, { scale: 1, y: 0, duration: 0.6, ease: __spr.pop }, t0 + 1.0);
      if (url) tl.fromTo(url, { scale: 0, y: 22 }, { scale: 1, y: 0, duration: 0.6, ease: __spr.pop }, t0 + 1.35);
    },
  },
};

/* ------------------------------------------------------------------- seams */

/**
 * SEAMS - the cut between two beats (criteria M6).
 *
 * NOTHING FADES. A cut is a scale-out then a scale-in: the outgoing scene removes every element
 * (each scales DOWN to 0, staggered), the stage is empty for a moment (an exposure flare, a light
 * overlay, hides the stage-colour swap), then the incoming scene's elements scale UP from 0 with
 * overshoot. The only thing a seam chooses is the ORDER the outgoing elements leave in:
 *
 *   exit  "start"   first element first      "end"    last element first
 *         "center"  the middle first         "edges"  the outer ones first
 *
 * That is the seam's whole character, so six seams still rotate and no two neighbours repeat.
 * XF, LEAD and ENTER are untouched by the choice: a seam changes how the cut looks, never when it
 * happens relative to the narration.
 */
export const SEAMS = {
  "push-left": { from: ["page-slide", "whip-pan-cut"], exit: "start" },
  "push-right": { from: ["page-slide", "whip-pan-cut"], exit: "end" },
  "push-up": { from: ["shared-axis-y", "push-in"], exit: "center" },
  "push-down": { from: ["shared-axis-y"], exit: "edges" },
  "zoom-in": { from: ["zoom-through-transition"], exit: "center" },
  "zoom-out": { from: ["zoom-through-transition", "iris-reveal"], exit: "edges" },
  /** Was a defocus. Blur is banned and so is a fade; this is a plain centre-out removal. */
  blur: { from: ["fade-through"], exit: "center" },
};

/** The order un-flagged cuts take, so no two neighbouring seams repeat. */
export const SEAM_ROTATION = ["push-left", "zoom-in", "push-up", "push-right", "zoom-out", "push-down"];

/** Storyboard flags (unchanged meaning) -> seam. */
export const FLAG_TO_SEAM = { zx: "zoom-in", blur: "blur", slide: "push-left" };

/** The previous `xf: "<name>"` vocabulary -> seam, so no storyboard breaks. */
export const XF_TO_SEAM = {
  "zoom-through": "zoom-in",
  "blur-crossfade": "blur",
  "push-slide": "push-left",
  wipe: "push-left",
  "shared-axis-y": "push-up",
  iris: "zoom-out",
};

/* ------------------------------------------------------------------- styles */

/**
 * Styles for markup ONLY treatments create: per-word/char spans and the
 * marker underline. Everything else in a treated beat is already styled by
 * lkchrome.mjs.
 *
 * `.w` / `.c` are inline-block because a transform on an inline element does
 * nothing â€” a word reveal that silently does not animate is worse than no
 * treatment at all, and this is exactly how that failure looks.
 */
export const motionCSS = `
.fx .w,.fx .c{display:inline-block;will-change:transform,opacity}
.fxmark{background-image:linear-gradient(${C.blueEdge},${C.blueEdge});background-repeat:no-repeat;
  background-position:0 100%;background-size:0% 7px;padding:0 2px}
.tone-blue .fxmark{background-image:linear-gradient(${C.white},${C.white})}
.fxtick{display:flex;align-items:center}
`;

/**
 * Inject the `fx` marker class onto a treated beat's root so the treatment-only
 * rules above apply, and only there.
 */
export const withMotionClass = (html) => html.replace(/^<div class="([^"]*)"/, '<div class="fx $1"');
/* ------------------------------------------------------------------ runtime */

/**
 * motionRuntimeJS — the `__fx` global, emitted into every sub-composition that
 * carries a treatment.
 *
 * It is generated from the same source strings the anim bodies are serialised
 * from, so there is exactly one copy of each helper and one copy of each
 * literal. If a treatment grows a new dependency it is added HERE, once —
 * never pasted into an anim body.
 */
export const motionRuntimeJS = `
const __fx = {
  // Heroicons 24 outline "check" (heroicons/md/24), inlined: a treatment cannot
  // import lkicons.mjs, and the tick has to match the rest of the icon set.
  tickSvg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg>',
  blue: "${C.blue}",      // button.tsx:22
  blueText: "${C.blueText}", // button.tsx:26
  sel: ${sel.toString()},
  words: ${words.toString()},
  chars: ${chars.toString()},
};
`;
