/**
 * Scene library for the ListeningKit object explainers.
 *
 * Rules this file exists to enforce:
 *   - Every beat declares a `tone`. The frame is flat #2A8CFF or flat #FFFFFF,
 *     never a gradient, and tones alternate so the edit keeps cutting between
 *     white-on-blue and blue-on-white.
 *   - Nothing lives permanently in a corner. Type is centre-stage; the only
 *     persistent element is the chapter rail at the bottom, and it wipes.
 *   - Every scene animates continuously (float, draw, fill, sweep), so there is
 *     no 30-second still frame.
 *   - Diagrams carry the meaning. If a beat has a field, a link, a count or a
 *     sequence, it is drawn, not described in a paragraph.
 *
 * Colour, radius, shadow and dither values come from lkdesign.mjs. Icons are
 * Heroicons 24 outline, read out of the app's own package by lkicons.mjs.
 */

import { C, R, SHADOW, hardDrop } from "./lkdesign.mjs";
import { icon, iconRow, fieldIcon } from "./lkicons.mjs";

/* ------------------------------------------------------------------ helpers */

/**
 * A FIXED-SIZE box. Plain border-radius now - no clip-path.
 *
 * The squircle version applied an SVG clip-path, which carries the shape but
 * does not size the box, so these had to be hard-coded and any mismatch between
 * the path geometry and the real box cropped the fill. Plain radius has no such
 * failure mode.
 */
function sq(w, h, r, fill, stroke, strokeW = 1.5, extra = "", ownShadow = false) {
  // ownShadow: the caller passes its own box-shadow in `extra`, so emit none
  // here. Two declarations meant the later one silently won.
  return `width:${w}px;height:${h}px;background:${fill};border-radius:${r}px;` +
    (ownShadow ? "" : `box-shadow:0 ${SHADOW.y}px 0 0 ${SHADOW.grey}`) +
    `${strokeW ? `,inset 0 0 0 ${strokeW}px ${stroke}` : ""};${extra}`;
}

/**
 * A CONTENT-SIZED card. rounded-md / rounded-lg + a hard, zero-blur grey
 * shadow straight down, so the card sits on the stage.
 */
function card(maxW, r, fill, stroke, extra = "") {
  return `max-width:${maxW}px;background:${fill};border-radius:${r}px;` +
    `box-shadow:${hardDrop(SHADOW.y, SHADOW.grey)}` +
    (stroke ? `,inset 0 0 0 1.5px ${stroke}` : "") +
    (extra ? `;${extra}` : "");
}

/** The onboarding glass card: border-white/30 bg-white/10 + a grey hard drop. */
export function glass(maxW, r = R.card, extra = "") {
  return card(maxW, r, "rgba(255,255,255,0.10)", "rgba(255,255,255,0.30)", extra).replace(
    hardDrop(SHADOW.y, SHADOW.grey),
    `0 ${SHADOW.y}px 0 0 ${SHADOW.greyGlass}`,
  );
}

/**
 * A translucent card for the WHITE stage — the counterpart to glass().
 *
 * Every decorative card on a white beat was an opaque near-white fill (#FFFFFF,
 * #EFF6FF, #F8FAFC). On a white stage an opaque white card has no edge, so the
 * frame read as a flat wash with floating grey text, and the stacked cards in
 * the journey beat disappeared into it entirely. Translucent fills plus the
 * hairline stroke keep every layer legible against the stage behind it.
 *
 * The reconstructed record panel stays opaque: that one is standing in for a real
 * product surface, and a see-through CRM panel would misrepresent the product.
 */
export function frost(maxW, r = R.card, extra = "") {
  return card(
    maxW,
    r,
    "rgba(255,255,255,0.72)",
    "rgba(42,140,255,0.18)",
    `backdrop-filter:blur(6px);${extra}`,
  );
}

/** White surface on blue - rounded-2xl bg-white text-slate-900. */
export function surface(maxW, r = R.panel, extra = "") {
  return card(maxW, r, C.white, null, `color:${C.slate900};${extra}`);
}

/**
 * THE CARD INVERSION RULE. A card is WHITE on the blue stage and BRAND BLUE on
 * the white stage. Never white-on-white, never white-on-white-with-a-hairline.
 *
 * Both earlier attempts at the white stage were the same mistake wearing
 * different clothes: an opaque near-white fill, and then an opaque white fill
 * with a 1.5px blue hairline pretending to be an edge. Neither is a card - they
 * are the stage, redrawn. The stage already alternates, so the card has to
 * alternate against it or it has no job.
 *
 * The drop is the brand's own darker blue (button.tsx:22 #1f6fe6), not grey:
 * a grey shadow under a blue card reads as dirt, a blue one reads as depth.
 */
export function blueCard(maxW, r = R.card, extra = "") {
  return card(maxW, r, C.blue, null, `color:${C.white};${extra}`).replace(
    hardDrop(SHADOW.y, SHADOW.grey),
    hardDrop(SHADOW.y, C.blueHover),
  );
}

/**
 * Pick the card for the stage it will actually sit on.
 *
 * This is the only place the inversion is decided. A scene that hand-picks
 * `surface()` vs `frost()` per tone is how the record panel ended up with
 * literally identical branches on both tones (`onBlue ? surface(...) :
 * surface(...)`) and shipped white-on-white.
 */
export function cardFor(tone, maxW, r = R.card, extra = "") {
  return tone === "blue" ? surface(maxW, r, extra) : blueCard(maxW, r, extra);
}

/**
 * A white card that has to be visible ON A WHITE STAGE.
 *
 * Solid white on solid white has no edge — the hard drop alone was not enough to
 * separate three cards from each other. The fix is a hairline, not an alpha:
 * the fill stays fully solid (DESIGN_SYSTEM 1.1) and the stroke does the work the
 * translucency was faking.
 */
export function surfaceOnWhite(maxW, r = R.panel, extra = "") {
  return card(maxW, r, C.white, C.hairline, `color:${C.slate900};${extra}`);
}

/** White pill on blue - the h-14 rounded-xl font-bold CTA (OnboardingSteps:340). */
export function pill(w, h, extra = "") {
  return sq(
    w,
    h,
    R.md,
    C.white,
    null,
    0,
    `color:${C.slate900};box-shadow:inset 0 -2px 0 0 #117eff, inset 0 1px 0 0 #ffffff, 0 ${SHADOW.y}px 0 0 ${SHADOW.greyGlass};${extra}`,
    true,
  );
}

/** Numbered chip - rounded-full size-5/6 font-bold (OnboardingSteps:421). */
export function numChip(n, onBlue) {
  return sq(
    44,
    44,
    22,
    onBlue ? C.white : C.chip,
    null,
    0,
    `display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:${
      onBlue ? C.blue : C.slate900
    }`,
  );
}

/**
 * How a Twenty object is named on screen.
 *
 * `agencyProspects` was being set in `.kv` — same size class as the human title
 * beside it, different case pattern, at 0.55 opacity — so a record header carried
 * three competing shapes of type for one idea and read as an accident. The API
 * name is still shown, because a worker opening Twenty has to recognise it, but
 * it is now a small translucent chip that is visibly subordinate to the title.
 */
export function apiChip(api, onBlue = false) {
  return `<span class="apichip${onBlue ? " on-blue" : ""}">${api}</span>`;
}

/**
 * A record's field rows. A row is [key, value] or [iconName, key, value] - the
 * heroicon sits at the LEFT of the row, in the key's own column, so the icon
 * column aligns down the panel.
 */
function rowsHTML(rows) {
  return `<div class="rows">${rows
    .map((row) => {
      const [ic, k, v] = row.length === 3 ? row : [null, row[0], row[1]];
      const icn = ic || fieldIcon(k);
      return (
        `<div class="row irow" data-row="${k}">` +
        `<span class="ico plain">${icon(icn, 34)}</span>` +
        `<span class="rk">${k}</span><span class="rv">${v}</span><span class="rdot"></span></div>`
      );
    })
    .join("")}</div>`;
}

/** Waveform bars from a deterministic pseudo-random height list. */
/** Waveform bars. `ink` is the colour that reads against the CARD they sit on:
 *  brand blue on a white card, solid white on the blue card - a blue waveform on
 *  a blue card is an invisible waveform. */
function waveHTML(n = 84, ink = C.blue) {
  let s = 7;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  return `<div class="wave">${Array.from(
    { length: n },
    (_, i) => `<i style="--h:${(18 + rnd() * 62).toFixed(0)}%;background:${ink}"></i>`,
  ).join("")}</div>`;
}

/** A curved connector path between two points. */
function curve(x1, y1, x2, y2, bend = 0.5) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + (y2 - y1) * bend;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

const ell = (cx, cy, rx, ry, stroke, sw = 3, extra = "") =>
  `<ellipse class="ring" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;

/* ------------------------------------------------------------------- scenes */

/** Twenty object -> heroicon, used on every record panel header. */
export const OBJECT_ICON = {
  agencyProspects: "building-storefront",
  agencyCalls: "phone",
  agencyLeads: "users",
  agencyPhones: "phone",
  agencyMessages: "chat-bubble-left-right",
  agencyConversations: "chat-bubble-left-ellipsis",
  agencyCampaigns: "megaphone",
  agencyOffers: "tag",
  agencyListings: "building-office",
  agencyCompetitors: "trophy",
  agencyContents: "document-text",
  agencyScripts: "document",
  agencyTasks: "check-circle",
  agencyCareerApplications: "briefcase",
  agencyCareers: "briefcase",
  agencyOpportunities: "chart-bar",
  agencyServiceVerticals: "squares-plus",
  agencyModels: "cpu-chip",
};

/** Journey step badge -> heroicon. */
const STEP_ICON = {
  niche: "tag",
  in: "arrow-down-tray",
  queued: "bars-3",
  out: "phone",
};

export const beats = {
  /* --- 0. HOOK â€” white stage, the number itself is the motion --------------- */
  countup({ label, count, sub }) {
    return {
      name: "countup",
      tone: "white",
      blueprint: "dataviz-countup",
      type: "hook",
      html: `<div class="stagec">
        <div class="eyebrow blue" data-a="label" style="opacity:0">${label}</div>
        <div class="count" data-a="count"><span class="n blue" style="opacity:0">0</span></div>
        <div class="body blue dim" data-a="sub" style="opacity:0">${sub}</div>
      </div>`,
      anim(tl, t0, { q, qq }) {
        const n = q('[data-a="count"] .n');
        tl.fromTo(q('[data-a="label"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
        tl.fromTo(n, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, t0 + 0.15);
        const c = { v: 0 };
        tl.to(c, { v: count, duration: 2.1, ease: "power2.out", onUpdate() { if (n) n.textContent = String(Math.round(c.v)); } }, t0 + 0.3);
        tl.fromTo(q('[data-a="sub"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0 + 2.1);
        // constant motion: the number keeps a slow breathe so the frame never dies
        tl.to(n, { scale: 1.015, duration: 1.1, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 3);
      },
    };
  },

  /* --- 1. PAIN â€” blue stage, the black box gets buried ---------------------- */
  overwhelm({ blockers, label = "COLD CALLING" }) {
    return {
      name: "overwhelm",
      tone: "blue",
      blueprint: "overwhelm-surround",
      type: "pain_point",
      html: `<div class="stagec">
        <div class="ovwrap"><div class="ovbox" data-a="box" style="opacity:0;${pill(560, 120, "display:flex;align-items:center;justify-content:center;")}"><span class="h3" style="color:${C.slate900}">${label}</span></div></div>
        ${blockers
          .map(
            (b, i) =>
              `<div class="ovcard" data-i="${i}" style="${cardFor(
          "blue",
          520,
          R.card,
        )};display:flex;align-items:center;justify-content:center"><span class="body" style="color:${C.slate900}">${b}</span></div>`,
          )
          .join("")}
      </div>`,
      anim(tl, t0, { q, qq }) {
        const box = q('[data-a="box"]');
        tl.fromTo(box, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }, t0);
        const els = qq(".ovcard");
        els.forEach((el, i) => {
          const a = (i / els.length) * Math.PI * 2 - Math.PI / 2;
          // land on a ring AROUND the pill â€” never on top of its label
          const rx = Math.cos(a) * 660, ry = Math.sin(a) * 300;
          tl.fromTo(el, { opacity: 0, x: rx * 1.8, y: ry * 1.8, scale: 0.72 }, { opacity: 1, x: rx, y: ry, scale: 1, duration: 0.55, ease: "power3.out" }, t0 + 0.6 + i * 0.4);
          // constant motion: each card keeps drifting
          tl.to(el, { y: ry + (i % 2 ? 9 : -9), duration: 1.6 + i * 0.13, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 1.4 + i * 0.4);
        });
        const end = t0 + 0.6 + els.length * 0.4;
        tl.to(box, { scale: 1.1, duration: 0.5, yoyo: true, repeat: 3, ease: "power2.inOut" }, end);
      },
    };
  },

  /* --- 2. REVEAL â€” one record becomes the whole fleet ----------------------- */
  zoomOut({ mystery, big, sub }) {
    return {
      name: "zoom-out",
      tone: "blue",
      blueprint: "zoom-out-workspace-reveal",
      type: "benefit_highlight",
      html: `<div class="stagec">
        <div class="zw" data-a="zw">
          <div class="myst" data-a="m" style="${pill(
            300,
            300,
            "border-radius:64px",
          )};display:flex;align-items:center;justify-content:center"><span class="count" style="color:${C.slate900}"><span class="n" style="font-size:170px">${mystery}</span></span></div>
          <div class="rvf" data-a="r" style="opacity:0;text-align:center">
            <div class="hero white">${big}</div>
            <div class="body white dim" style="margin-top:22px;max-width:940px">${sub}</div>
          </div>
        </div>
      </div>`,
      anim(tl, t0, { q }) {
        tl.fromTo(q('[data-a="m"]'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, t0);
        tl.to(q('[data-a="zw"]'), { scale: 0.34, duration: 1.5, ease: "power3.inOut" }, t0 + 2.2);
        tl.fromTo(q('[data-a="r"]'), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" }, t0 + 2.9);
        // constant motion without touching letterSpacing: text reflow snaps to
        // integer pixels under the frame-by-frame capture engine (lint:
        // gsap_non_transform_motion), so the hero breathes on a transform.
        tl.to(q('[data-a="r"] .hero'), { scale: 1.018, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 3.6);
      },
    };
  },

  /* --- 3/4. THE RECORD â€” a real surface, one field lit at a time ------------ */
  record({ kicker, title, api, r, focus, note, cursor = false, tone = "white" }) {
    const onBlue = tone === "blue";
    // The card inverts against the stage, so everything INSIDE it has to invert
    // with it. `cardIsBlue` is the single flag both the surface and the inner
    // ink are derived from - deriving them from `onBlue` independently is what
    // produced a white card full of slate text on a white stage.
    const cardIsBlue = !onBlue;
    const ink = cardIsBlue ? C.white : C.slate900;
    const head = `<div class="phead" style="display:flex;align-items:center;gap:16px;padding:22px 30px;border-bottom:1.5px solid ${
      cardIsBlue ? "rgba(255,255,255,0.22)" : C.slate200
    }">
        <span class="ico ${cardIsBlue ? "on-bluecard" : "on-white"}" style="width:56px;height:56px;border-radius:${R.md}px">${icon(
          OBJECT_ICON[api] || "square-3-stack-3d",
          32,
        )}</span>
        <span class="h3" style="font-weight:900;color:${ink}">${title}</span>
        ${apiChip(api, cardIsBlue)}</div>`;
    const rowFill = cardIsBlue ? "rgba(255,255,255,0.10)" : "rgba(42,140,255,0.06)";
    const focusFill = cardIsBlue ? "rgba(255,255,255,0.26)" : C.selected;
    const body = `<div style="padding:26px 30px 30px;color:${ink}">${rowsHTML(r)}</div>`;
    return {
      name: "record",
      tone,
      blueprint: "asr-keyword-glow",
      type: "feature_showcase",
      html: `<div class="stagec">
        ${kicker ? `<div class="eyebrow ${onBlue ? "white" : "blue"}" data-a="k" style="opacity:0">${kicker}</div>` : ""}
        <div class="pan" data-a="p" style="${cardFor(tone, 1180, R.panel)};overflow:hidden">${head}${body}</div>
        <div class="note" data-a="n" style="${cardFor(tone, 560, R.card)};padding:26px 28px;opacity:0;color:${
          cardIsBlue ? C.white : C.slate900
        }">
          <div class="label" style="color:${cardIsBlue ? C.white : C.blue}">${focus}</div>
          <div class="body" style="font-weight:500;margin-top:10px">${note}</div>
        </div>
        ${
          cursor
            ? `<div class="cursor" data-a="cur"></div>`
            : ""
        }
      </div>`,
      anim(tl, t0, { q, qq }) {
        if (kicker) tl.fromTo(q('[data-a="k"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
        tl.fromTo(q('[data-a="p"]'), { opacity: 0, y: 70, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, t0 + 0.1);
        const all = qq(".pan .row");
        const target = q(`.pan [data-row="${focus}"]`);
        all.forEach((el, i) => {
          const isT = el === target;
          const at = t0 + 0.4 + i * (isT ? 0.85 : 0.26);
          el.style.background = rowFill;
          tl.to(el, { opacity: 1, duration: 0.3, ease: "power2.out" }, at);
          if (isT) {
            // the named field lifts and stays lit â€” this is the "motion carries
            // the explanation" beat: the row the narration is saying lights up.
            tl.to(el, { background: focusFill, scale: 1.02, duration: 0.4, ease: "power2.out" }, at + 0.3);
            tl.to(el, { scale: 1.0, duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut" }, at + 0.9);
            tl.fromTo(q('[data-a="n"]'), { opacity: 0, x: 70 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, at + 0.45);
            if (cursor) {
              tl.fromTo(q('[data-a="cur"]'), { x: 250, y: 380, opacity: 0 }, { x: 700, y: 470, opacity: 1, duration: 0.7, ease: "power2.inOut" }, at);
              tl.to(q('[data-a="cur"]'), { x: 712, y: 456, duration: 0.6, yoyo: true, repeat: -1, ease: "sine.inOut" }, at + 0.8);
            }
          }
        });
      },
    };
  },

  /* --- 5. RELATIONS â€” connectors draw out of the record --------------------- */
  relations({ r, links, title = "Call", api = "agencyCalls" }) {
    const panelH = 120 + r.length * 74;
    const nodes = links
      .map(
        (l, i) =>
          `<div class="node relnode" data-node="${i}" style="${surface(
            430,
            R.card,
          )};position:absolute;left:1330px;top:${400 + i * 240}px;opacity:0"><span class="nk" style="color:${C.slate900}">${l[0]}</span><span class="nv" style="color:${C.slate600}">${l[1]}</span></div>`,
      )
      .join("");
    const paths = links
      .map((_, i) => `<path class="connector" data-p="${i}" d="${curve(1000, 620 + i * 40, 1330, 464 + i * 240, 0.12)}"/>`)
      .join("");
    return {
      name: "relations",
      tone: "blue",
      blueprint: "constellation-hub",
      type: "feature_showcase",
      html: `<div class="stagec">
        <div class="pan" style="${surface(1180, R.panel,
        )};position:absolute;left:300px;top:${720 - panelH / 2}px;overflow:hidden">
          <div class="phead" style="display:flex;align-items:center;gap:16px;padding:22px 30px;border-bottom:1.5px solid ${C.slate200}"><span class="h3" style="font-weight:900">${title}</span>${apiChip(api)}</div>
          <div style="padding:26px 30px 30px">${rowsHTML(r)}</div>
        </div>
        <svg class="relsvg" viewBox="0 0 1920 1080" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">${paths}</svg>
        ${nodes}
      </div>`,
      anim(tl, t0, { q, qq }) {
        tl.fromTo(q(".pan"), { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, t0);
        qq(".relsvg path").forEach((p, i) => {
          const len = p.getTotalLength();
          tl.set(p, { strokeDasharray: len, strokeDashoffset: len }, t0);
          tl.to(p, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, t0 + 0.9 + i * 0.6);
          const node = qq(".relnode")[i];
          if (node) {
            tl.fromTo(node, { opacity: 0, x: 60, scale: 0.8 }, { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, t0 + 1.5 + i * 0.6);
            tl.to(node, { y: i ? 12 : -12, duration: 1.7 + i * 0.2, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 2.2 + i * 0.6);
          }
          if (node) tl.to(p, { strokeOpacity: 0.45, duration: 1.3, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 2.6 + i * 0.6);
        });
      },
    };
  },

  /* --- 6. TRANSCRIPT â€” scroll against a waveform, timecode running --------- */
  transcript({ kicker, lines, marker, dur = 6.0 }) {
    return {
      name: "transcript",
      tone: "white",
      blueprint: "transcript-scroll-artifact-reveal",
      type: "feature_showcase",
      html: `<div class="stagec">
        <div class="eyebrow blue" data-a="k" style="opacity:0">${kicker}</div>
        <div class="tw" style="${cardFor("white", 1300, R.panel)}">
          <div class="thead"><span class="kv" style="color:${C.white}">transcript</span><span class="kv" data-a="len" style="color:${C.white};opacity:.62">0:00</span></div>
          <div class="tscroll"><div class="tinner" data-a="inner">${lines
            .map(
              (l, i) =>
                `<p class="tline ${i === marker ? "hit" : ""}" style="color:${
                  i === marker ? C.white : "rgba(255,255,255,0.74)"
                }${i === marker ? ";font-weight:900" : ""}">${l}</p>`,
            )
            .join("")}</div></div>
          ${waveHTML(84, C.white)}
        </div>
      </div>`,
      anim(tl, t0, { q, qq }) {
        tl.fromTo(q('[data-a="k"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
        tl.fromTo(q(".tw"), { opacity: 0, y: 70, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, t0 + 0.1);
        const inner = q('[data-a="inner"]');
        if (inner) {
          const travel = Math.max(0, inner.scrollHeight - 340);
          tl.fromTo(inner, { y: 0 }, { y: -travel, duration: dur, ease: "none" }, t0 + 0.9);
        }
        // waveform sweeps left continuously â€” the playhead is always moving
        tl.fromTo(qq(".wave i"), { scaleY: 0.25, opacity: 0.4 }, { scaleY: 1, opacity: 1, duration: 0.22, stagger: { each: 0.03 }, ease: "power2.out" }, t0 + 0.9);
        tl.to(q(".wave"), { backgroundPositionX: "-120px", duration: 3, repeat: -1, ease: "none" }, t0);
        const secs = { v: 0 };
        const len = q('[data-a="len"]');
        if (len) tl.to(secs, { v: 41, duration: dur, ease: "none", onUpdate() { len.textContent = `0:${String(Math.round(secs.v)).padStart(2, "0")}`; } }, t0 + 0.9);
      },
    };
  },

  /* --- 7. AGENT WORK â€” the machine visibly works --------------------------- */
  agentWork({ head, steps, foot }) {
    return {
      name: "agent-work",
      tone: "blue",
      blueprint: "agent-progress-theater",
      type: "key_feature",
      html: `<div class="stagec">
        <div class="wk" style="${cardFor("blue", 1120, R.panel)};padding:0;overflow:hidden;color:${C.slate900}">
          <div class="thead" style="border-bottom:1.5px solid ${C.slate200}"><span class="kv" style="opacity:.8">${head}</span></div>
          <div style="padding:24px 30px;display:flex;flex-direction:column;gap:16px">
            ${steps
              .map(
                (s) => `<div class="wrow" data-state="pending" style="background:rgba(42,140,255,0.06)"><span class="spin" style="border-color:${C.blue};border-top-color:transparent"></span><span class="body">${s}</span><span class="chk"><svg width="30" height="30" viewBox="0 0 24 24"><path d="M20 6L9 17L4 12" stroke="#12A150"/></svg></span></div>`,
              )
              .join("")}
          </div>
          <div style="padding:22px 30px 26px;border-top:1.5px solid ${C.slate200}" class="body dim">${foot}</div>
        </div>
      </div>`,
      anim(tl, t0, { qq }) {
        tl.fromTo(qq(".wk")[0], { opacity: 0, scale: 0.93 }, { opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" }, t0);
        qq(".wrow").forEach((r, i) => {
          const at = t0 + 0.8 + i * 1.1;
          tl.set(r, { attr: { "data-state": "active" } }, at);
          tl.fromTo(r.querySelector(".spin"), { rotation: 0 }, { rotation: 360, duration: 1.1, ease: "none", repeat: -1 }, at);
          tl.set(r, { attr: { "data-state": "done" } }, at + 1.1);
          tl.fromTo(r.querySelector(".chk"), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, at + 1.1);
        });
      },
    };
  },

  /* --- 8. COST â€” the number falls to zero ---------------------------------- */
  costCount({ label, from, to, unit, sub }) {
    return {
      name: "cost-countup",
      tone: "white",
      blueprint: "dataviz-countup",
      type: "benefit_highlight",
      html: `<div class="stagec">
        <div class="eyebrow blue" data-a="l" style="opacity:0">${label}</div>
        <div class="count" data-a="c"><span class="n blue" style="opacity:0">${from}</span><span class="u blue" data-a="u" style="opacity:0">${unit}</span></div>
        <div class="body blue dim" data-a="s" style="opacity:0">${sub}</div>
      </div>`,
      anim(tl, t0, { q }) {
        const n = q('[data-a="c"] .n');
        tl.fromTo(n, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.4)" }, t0);
        tl.fromTo(q('[data-a="l"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
        tl.fromTo(q('[data-a="u"]'), { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.4 }, t0 + 1.6);
        const c = { v: from };
        tl.to(c, { v: to, duration: 2.3, ease: "power2.inOut", onUpdate() { if (n) n.textContent = String(Math.round(c.v)); } }, t0 + 1.7);
        tl.fromTo(q('[data-a="s"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0 + 2.2);
        tl.to(q('[data-a="c"]'), { scale: 1.02, duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 4.2);
      },
    };
  },

  /* --- 9. SENTIMENT â€” bars fill while the narration reads them ------------- */
  sentiment({ kicker, bars, note }) {
    return {
      name: "sentiment",
      tone: "blue",
      blueprint: "stat-bars-and-fills",
      type: "benefit_highlight",
      html: `<div class="stagec">
        <div class="eyebrow white" data-a="k" style="opacity:0">${kicker}</div>
        <div class="sb" style="${cardFor("blue", 1120, R.panel)};padding:24px 30px;color:${C.slate900}">
          ${bars
            .map(
              (b) => `<div class="bar"><span class="bl">${b[0]}</span><span class="bt" style="background:rgba(42,140,255,0.10)"><i class="bf" data-w="${b[1]}" style="background:linear-gradient(90deg,${C.blueGradTop},${C.blueGradBot})"></i></span><span class="bv">${b[2]}</span></div>`,
            )
            .join("")}
        </div>
        <div class="note" data-a="n" style="${cardFor("blue", 700, R.card)};padding:24px 28px;opacity:0;color:${C.slate900}"><div class="label" style="color:${C.blue}">aiSentiment</div><div class="body" style="font-weight:500;margin-top:8px">${note}</div></div>
      </div>`,
      anim(tl, t0, { q, qq }) {
        tl.fromTo(q('[data-a="k"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
        tl.fromTo(q(".sb"), { opacity: 0, y: 60, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, t0 + 0.1);
        qq(".bf").forEach((f, i) => {
          tl.fromTo(f, { width: "0%" }, { width: f.dataset.w, duration: 0.85, ease: "power3.out" }, t0 + 0.7 + i * 0.42);
          tl.to(f.parentElement, { opacity: 0.82, duration: 1.1, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 2 + i * 0.42);
        });
        tl.fromTo(q('[data-a="n"]'), { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.45 }, t0 + 3);
      },
    };
  },

  /* --- 10. CONVERGE â€” many mentions, one signal ---------------------------- */
  converge({ kicker, n, label, labels, verdict, tone = "blue" }) {
    const R0 = 520;
    const onBlue = tone === "blue";
    // `labels` gives each chip its own text. Repeating one string across all
    // nine chips was technically a diagram and practically a printing error -
    // nine identical cards scattered around a core says nothing about what
    // actually hangs off a prospect.
    const texts = Array.isArray(labels) && labels.length ? labels : new Array(n).fill(label);
    // Chips are CARDS, so they follow the same inversion as every other card:
    // solid white on the blue stage, solid brand blue on the white stage. The
    // translucent fills that were here were unreadable on one stage or the
    // other, and R.pill turned a card carrying an object name into a lozenge.
    const chipFill = onBlue ? C.white : C.blue;
    const chipInk = onBlue ? C.slate900 : C.white;
    const chips = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const cx = Math.cos(a) * R0;
      const cy = Math.sin(a) * R0 * 0.56;
      const text = texts[i % texts.length];
      // Heroicon to the LEFT of each object name. Nine chips reading
      // "agencyLeads / agencyCalls / ..." told you what hung off the prospect
      // but not what each one IS; the tile carries that. The tile follows the
      // same colour rule as every other icon tile - solid brand blue with a
      // white glyph on a white card, inverted to solid white with a blue glyph
      // on a blue card, because a blue tile on a blue card is the icon gone.
      const icn = OBJECT_ICON[text] || fieldIcon(text);
      const tileCls = onBlue ? "ico xs" : "ico xs on-bluecard";
      // Auto width, not a fixed 300px box. A fixed box clipped the longer
      // labels mid-word ("cancel the contract" lost its tail) because the text
      // simply overflowed a box that could not grow.
      return `<div class="chip cvchip" style="position:absolute;display:flex;align-items:center;gap:14px;
 padding:11px 20px;border-radius:${R.lg}px;
 background:${chipFill};border:1.5px solid ${chipFill};
 color:${chipInk};white-space:nowrap;box-shadow:0 ${SHADOW.y}px 0 0 ${onBlue ? SHADOW.grey : C.blueHover}"
 data-cx="${cx.toFixed(0)}" data-cy="${cy.toFixed(0)}"><span class="${tileCls}">${icon(icn, 26)}</span><span>${text}</span></div>`;
    }).join("");
    return {
      name: "converge",
      tone,
      blueprint: "center-outward-expansion",
      type: "social_proof",
      html: `<div class="stagec">
        <div class="eyebrow ${onBlue ? "white" : "blue"}" data-a="k" style="opacity:0">${kicker}</div>
        <div class="cvf" style="position:relative;width:1300px;height:560px">${chips}
          <div class="cvcore" data-a="core" style="position:absolute;left:330px;top:185px;
 max-width:640px;padding:40px 44px;border-radius:${R.panel}px;
 background:${C.blue};border:1.5px solid ${C.blue};
 box-shadow:0 ${SHADOW.yLg}px 0 0 ${SHADOW.grey};text-align:center;opacity:0">
            <div class="label" style="color:${C.white};opacity:.78">one signal</div>
            <div class="h2" style="color:${C.white};margin-top:10px">${verdict}</div>
          </div>
        </div>
      </div>`,
      anim(tl, t0, { q, qq }) {
        tl.fromTo(q('[data-a="k"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
        qq(".cvchip").forEach((el, i) => {
          // numeric offsets only: GSAP cannot resolve calc() in a transform,
          // which silently collapses every chip back to dead centre.
          const cx = parseFloat(el.dataset.cx), cy = parseFloat(el.dataset.cy);
          tl.fromTo(el, { opacity: 0, x: cx * 1.6, y: cy * 1.6, scale: 0.7 }, { opacity: 1, x: cx * 0.95, y: cy * 0.95, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, t0 + 0.5 + i * 0.18);
          tl.to(el, { scale: 1.06, duration: 1.4 + i * 0.07, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 3 + i * 0.18);
        });
        tl.fromTo(q('[data-a="core"]'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.7)" }, t0 + 0.5 + n * 0.18 + 0.4);
        tl.to(q('[data-a="core"]'), { y: -8, duration: 1.5, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + n * 0.18 + 1.6);
      },
    };
  },

  /* --- 11-13. JOURNEY - numbered step cards ------------------------------
   *
   * These are CARDS, so they are solid white on BOTH stages. A translucent
   * white fill over the blue stage produced a card the same value as its own
   * background, separated only by a hairline - a faint smudge rather than an
   * object. That is the opaque-opacity failure: an alpha that costs contrast
   * without buying depth. Solid white plus the brand's hard grey drop is the
   * app's own card treatment (OnboardingSteps.tsx:319-322).
   *
   * Icon tile is brand blue with a WHITE glyph (`.ico.on-blue`): on a white
   * card the app's light-blue tile left the icon nearly the same value as the
   * card. A bare icon outside a tile is fine; an icon inside a tile is not.
   */
  journey({ kicker, steps, note, tone = "blue" }) {
    const onBlue = tone === "blue";
    const cardIsBlue = !onBlue;
    const ink = cardIsBlue ? C.white : C.slate900;
    return {
      name: "journey",
      tone,
      blueprint: "grid-card-assemble",
      type: "key_feature",
      html: `<div class="stagec">
        <div class="eyebrow ${onBlue ? "white" : "blue"}" data-a="k" style="opacity:0">${kicker}</div>
        <div class="jr" style="display:flex;gap:22px">
          ${steps
            .map(
              (s, i) => `<div class="jcard" data-i="${i}" style="${cardFor(
                tone,
                400,
                R.card,
              )};padding:30px 28px;opacity:0;color:${ink}">
              <div class="irow" style="gap:18px"><span class="ico ${
                cardIsBlue ? "on-bluecard" : "on-blue"
              }">${icon(STEP_ICON[s[2]] || "arrow-right-circle", 40)}</span><span class="cm" style="margin-top:0;color:${
                cardIsBlue ? "rgba(255,255,255,0.72)" : C.blue
              }">${i + 1}</span></div>
              <div class="ch">${s[0]}</div>
              <div class="cs">${s[1]}</div>
              <div class="cm" style="color:${cardIsBlue ? "rgba(255,255,255,0.78)" : C.blueText}">${s[2]}</div>
            </div>`,
            )
            .join("")}
        </div>
        <div class="body ${onBlue ? "white dim" : "blue dim"}" data-a="n" style="opacity:0;margin-top:34px;text-align:center;max-width:1200px">${note}</div>
      </div>`,
      anim(tl, t0, { q, qq }) {
        tl.fromTo(q('[data-a="k"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
        qq(".jcard").forEach((el, i) => {
          tl.fromTo(el, { opacity: 0, y: 90, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, t0 + 0.4 + i * 0.42);
          tl.to(el, { y: i % 2 ? -12 : 12, duration: 1.8 + i * 0.15, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 1.6 + i * 0.42);
        });
        tl.fromTo(q('[data-a="n"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5 }, t0 + 0.4 + qq(".jcard").length * 0.42 + 0.4);
      },
    };
  },

  /* --- 14/17. TYPEWRITER - someone is typing this -------------------------- */
  typewriter({ kicker, lines, hold, tone = "white" }) {
    const onBlue = tone === "blue";
    return {
      name: "typewriter",
      tone,
      blueprint: "typewriter-reveal",
      type: "feature_showcase",
      html: `<div class="stagec">
        <div class="eyebrow ${onBlue ? "white" : "blue"}" data-a="k" style="opacity:0">${kicker}</div>
        <div class="twl" style="display:flex;flex-direction:column;gap:20px;align-items:center">
          ${lines
            .map(
              (text) =>
                `<p class="twl-line h2 ${onBlue ? "white" : ""}" data-text="${text.replace(/"/g, "&quot;")}"><span class="t"></span><span class="caret" style="width:4px;height:52px;background:${onBlue ? C.white : C.blue};display:inline-block"></span></p>`,
            )
            .join("")}
        </div>
        <div class="body ${onBlue ? "white dim" : "blue dim"}" data-a="h" style="opacity:0;margin-top:36px;text-align:center;max-width:1180px">${hold}</div>
      </div>`,
      anim(tl, t0, { q, qq }) {
        tl.fromTo(q('[data-a="k"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
        const lines = qq(".twl-line");
        lines.forEach((el, li) => {
          const target = el.querySelector(".t");
          const text = lines[li].dataset.text || "";
          const o = { n: 0 };
          tl.to(o, { n: text.length, duration: Math.max(0.5, text.length * 0.035), ease: "none", onUpdate() { target.textContent = text.slice(0, Math.round(o.n)); } }, t0 + 0.5 + li * 1.5);
          tl.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35 }, t0 + 0.5 + li * 1.5);
        });
        qq(".caret").forEach((c, i) => tl.to(c, { opacity: 0, duration: 0.42, yoyo: true, repeat: -1, ease: "steps(1)" }, t0 + 1 + i));
        tl.fromTo(q('[data-a="h"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5 }, t0 + 0.5 + lines.length * 1.5 + 0.5);
      },
    };
  },

  /* --- 15. SPLIT â€” what was agreed vs what was avoided -------------------- */
  split({ kicker, left, right, foot, tone = "blue" }) {
    const onBlue = tone === "blue";
    const side = (k, v, n) => {
      const cardIsBlue = !onBlue;
      const ink = cardIsBlue ? C.white : C.slate900;
      return `<div class="sp" style="${cardFor(tone, 700, R.card)};padding:34px 36px;color:${ink}">
        <div class="label" style="color:${cardIsBlue ? C.white : C.blue}">${k}</div>
        <div class="h3" style="margin-top:16px">${v}</div>
        <div class="body" style="margin-top:22px;font-weight:400;opacity:.72">${n}</div>
      </div>`;
    };
    return {
      name: "split",
      tone,
      blueprint: "comparison-split",
      type: "benefit_highlight",
      html: `<div class="stagec">
        <div class="eyebrow ${onBlue ? "white" : "blue"}" data-a="k" style="opacity:0">${kicker}</div>
        <div style="display:flex;gap:28px;align-items:stretch">${side(left[0], left[1], left[2])}<div class="spdiv" data-a="d" style="width:2px;background:rgba(127,127,127,.2);opacity:0"></div>${side(right[0], right[1], right[2])}</div>
        <div class="body ${onBlue ? "white dim" : "blue dim"}" data-a="f" style="opacity:0;margin-top:36px;text-align:center;max-width:1200px">${foot}</div>
      </div>`,
      anim(tl, t0, { q, qq }) {
        tl.fromTo(q('[data-a="k"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
        const s = qq(".sp");
        tl.fromTo(s[0], { opacity: 0, x: -90, scale: 0.95 }, { opacity: 1, x: 0, scale: 1, duration: 0.55, ease: "power3.out" }, t0 + 0.3);
        tl.fromTo(q('[data-a="d"]'), { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.5, ease: "power2.out" }, t0 + 0.9);
        tl.fromTo(s[1], { opacity: 0, x: 90, scale: 0.95 }, { opacity: 1, x: 0, scale: 1, duration: 0.55, ease: "power3.out" }, t0 + 0.6);
        s.forEach((el, i) => tl.to(el, { y: i ? 10 : -10, duration: 1.9 + i * 0.2, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 1.6));
        tl.fromTo(q('[data-a="f"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5 }, t0 + 2.2);
      },
    };
  },

  /* --- 18. END CARD â€” the onboarding hero, held --------------------------- */
  endcard({ word, cta, url }) {
    return {
      name: "endcard",
      tone: "blue",
      blueprint: "logo-assemble-lockup",
      type: "cta",
      html: `<div class="stagec">
        <div class="ecmark" data-a="m" style="opacity:0"><img src="assets/logo.svg" alt="ListeningKit"/></div>
        <div class="wordmark" data-a="w" style="opacity:0">${word}</div>
        <div class="body white" data-a="c" style="opacity:0;margin-top:26px">${cta}</div>
        <div class="kv white" data-a="u" style="opacity:0;margin-top:26px;padding:14px 26px;border-radius:${R.lg}px;background:rgba(255,255,255,.14)">${url}</div>
      </div>`,
      anim(tl, t0, { q }) {
        tl.fromTo(q('[data-a="m"]'), { opacity: 0, scale: 0.5, rotate: -12 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.6, ease: "back.out(1.8)" }, t0);
        // Tracking is held static AND zero: letterSpacing reflows text and snaps
        // glyph positions under frame-by-frame capture, and a tracked-out
        // wordmark is not the wordmark. See `.wordmark` in lkchrome.mjs.
        tl.fromTo(q('[data-a="w"]'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, t0 + 0.35);
        tl.fromTo(q('[data-a="c"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5 }, t0 + 0.9);
        tl.fromTo(q('[data-a="u"]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5 }, t0 + 1.3);
        tl.to(q('[data-a="m"]'), { y: -10, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 1.6);
        tl.to(q('[data-a="w"]'), { opacity: 0.88, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut" }, t0 + 1.6);
      },
    };
  },
};
