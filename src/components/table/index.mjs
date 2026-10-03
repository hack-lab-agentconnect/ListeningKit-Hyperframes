/**
 * components/table - a REAL table: a header band, column heads, and rows that rise out of the screen
 * one at a time. This is the pattern every component here follows; the others are smaller.
 *
 *   html(props)     the markup (props: tone, title, api, cols, rows, focus, focusCol, count, extrude)
 *   css             the component's own rules (moved here from lkchrome.mjs, so they live with it)
 *   steps(props)    the entrance, as ordered DATA (anatomy.mjs plays it)
 *   targets(props)  what the POINTER may point at / click, so the director needs no table-specific code
 *   slab            thickness: rows (and the card) are extruded when `extrude` is on
 *
 * The anatomy for a row: the ROW rises (y 44 -> 0) and scales 0 -> 1 with an overshoot, then its
 * cells resolve after it. The focus row lifts toward the camera afterwards. Nothing fades.
 */

import { C, R, TYPE } from "../../lkdesign.mjs";
import { icon, fieldIcon, OBJECT_ICON } from "../../lkicons.mjs";
import { cardFor, apiChip } from "../card/index.mjs";
import { slabFor, applySlabs, DEPTH } from "../../lkextrude.mjs";
import { EASE, GAP, step } from "../anatomy.mjs";

export const id = "table";
export const summary = "A header band, column heads and rows that rise one at a time; the focus row lifts.";

export const semantics = {
  kind: "collection",
  use: "When the narration walks down a list of records (prospects, calls, leads): each row rises as it is named.",
  avoid: "A single record (use a record panel) or fewer than three rows (use cards).",
  tone: "either: the card inverts (white card on the blue stage, blue card on the white stage)",
  needs: ["title", "api", "cols", "rows"],
};

/** Depth roles (lkextrude DEPTH): the table card is a panel, each row a row. lint-components enforces the minimum. */
export const roles = { table: "panel", row: "row" };

export const sample = {
  tone: "white",
  title: "Prospects",
  api: "agencyProspects",
  cols: ["Name", "Company", "Stage"],
  rows: [
    ["Dana Reyes", "Northwind", "Replied"],
    ["Marcus Lee", "Contoso", "Booked"],
    ["Priya Nair", "Fabrikam", "New"],
  ],
  focus: 1,
  focusCol: "Stage",
  count: "3 of 128",
  extrude: true,
};

export const css = `
/* ---- components/table: header band, column heads, rows that each rise on their own.
   Plain grid, no <table>: every cell animates. */
.tcols,.trow{display:grid;align-items:center;gap:18px;padding:14px 30px}
.tcols{padding-top:18px;padding-bottom:6px}
.tch{display:flex;align-items:center;gap:12px;font:${TYPE.label};letter-spacing:.14em;text-transform:uppercase;opacity:.82}
.tbody{display:flex;flex-direction:column;gap:10px;padding:6px 18px 26px}
.trow{border-radius:${R.lg}px;font:${TYPE.body};font-weight:500;text-align:left}
.trow .tc:first-child{font-weight:900}
.tc{white-space:nowrap;overflow:hidden;text-overflow:clip}
`;

/** Opaque blend of `tint` (hex) at `a` over `base` (hex). Row faces are SOLID: a translucent face would let
 *  its extrusion slices show through as a dark bar. */
const blend = (base, tint, a) => {
  const h = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const [b, t] = [h(base), h(tint)];
  return "#" + b.map((v, k) => Math.round(v + (t[k] - v) * a).toString(16).padStart(2, "0")).join("");
};

const palette = (tone) => {
  const cardIsBlue = tone !== "blue";
  return {
    cardIsBlue,
    ink: cardIsBlue ? C.white : C.slate900,
    // solid: white tint over the blue card, or blue tint over the white card
    rowFill: cardIsBlue ? blend(C.blue, "#FFFFFF", 0.1) : blend("#FFFFFF", C.blue, 0.06),
    focusFill: cardIsBlue ? blend(C.blue, "#FFFFFF", 0.26) : C.selected,
    rule: cardIsBlue ? "rgba(255,255,255,0.22)" : C.slate200,
  };
};

function htmlRaw(p) {
  const { tone = "white", title, api, cols, rows, focus = 0, focusCol, count, extrude = true } = p;
  const k = palette(tone);
  const grid = `grid-template-columns:${cols.map((_, i) => (i === 0 ? "1.5fr" : "1fr")).join(" ")}`;
  const x = extrude ? " x3d" : "";
  const head = `<div class="phead" style="display:flex;align-items:center;gap:16px;padding:22px 30px;border-bottom:1.5px solid ${k.rule}"><span class="ico ${k.cardIsBlue ? "on-bluecard" : "on-white"}" style="width:56px;height:56px;border-radius:${R.md}px">${icon(OBJECT_ICON[api] || "table-cells", 32)}</span><span class="h3" style="font-weight:900;color:${k.ink}">${title}</span>${apiChip(api, k.cardIsBlue)}${count ? `<span class="tcount kv" style="margin-left:auto;color:${k.ink};opacity:.8">${count}</span>` : ""}</div>`;
  const colHead = `<div class="tcols" style="${grid};color:${k.ink}">${cols.map((c) => `<span class="tch${c === focusCol ? " on" : ""}" data-col="${c}"><span class="ico plain">${icon(fieldIcon(c), 26)}</span>${c}</span>`).join("")}</div>`;
  const body = rows
    .map((r, i) => `<div class="trow${x}" data-i="${i}" data-hit="row" data-fill="${i === focus ? k.focusFill : k.rowFill}" style="${grid};background:${k.rowFill};color:${k.ink}">${extrude ? slabFor("row", { grow: { top: 0, right: 0, bottom: 4, left: 0 } }) : ""}${r.map((c, j) => `<span class="tc${cols[j] === focusCol ? " on" : ""}" data-col="${cols[j]}">${c}</span>`).join("")}</div>`)
    .join("");
  // NOT overflow:hidden when extruded: it would flatten the rows' sides to the plane
  return `<div class="tbl${x}" data-a="t" data-hit="table" style="${cardFor(tone, 1560, R.panel)}${extrude ? "" : ";overflow:hidden"};width:1560px">${extrude ? slabFor("panel") : ""}${head}${colHead}<div class="tbody${x}">${body}</div></div>`;
}

/** The component's markup. Passed through applySlabs so the card marker is resolved (this component renders its own slab). */
export const html = (p) => applySlabs(htmlRaw(p));

/** The entrance. Row i rises at `rowAt(i)`; the director may retime the rows to the narration. */
export const rowAt = (i) => 0.8 + i * 0.16;

export function steps(p) {
  const out = [];
  // a 1,500 px panel must not overshoot like a tile: the heavy `soft` spring (4 %), not `pop` (8 %)
  out.push({ ...step("card", '[data-a="t"]', 0.1, { one: true, from: { y: 130, scale: 0 }, to: { y: 0, scale: 1 }, dur: 0.75, ease: EASE.note }) });
  out.push({ ...step("tile", ".tch", 0.55, { from: { scale: 0, y: 16 }, to: { scale: 1, y: 0 }, dur: 0.35, stagger: 0.05, ease: EASE.icon }) });
  p.rows.forEach((_, i) => {
    const at = rowAt(i);
    const row = `.trow[data-i="${i}"]`;
    // the row RISES OUT of the card: it lifts to its own depth (z = the row slab's depth, so its own slab shows under it
    // as it comes up), scaling in. That is a TRANSITION. Then it SETTLES BACK FLAT into the card's plane: at rest an
    // inner element carries no hard shadow (its slab is behind the card face, hidden); the depth shows only while it
    // rises or when it is activated (the focus lift, a hover, a press: __cmp.lift).
    out.push({ ...step("card", row, at, { one: true, from: { y: 44, scale: 0, z: 0 }, to: { y: 0, scale: 1, z: DEPTH.row }, dur: 0.5, ease: EASE.row }) });
    // back onto the card plane with a spring that CANNOT undershoot: below z = 0 the row is behind the card face and vanishes
    out.push({ ...step("card", row, at + 0.55, { one: true, kind: "to", from: {}, to: { z: 0 }, dur: 0.45, ease: "spr:settle" }) });
    // the cells resolve AFTER their row has risen
    out.push({ ...step("text", `${row} > *`, at + GAP.text, { from: { scale: 0, y: 12 }, to: { scale: 1, y: 0 }, dur: 0.3, stagger: 0.045 }) });
  });
  return out;
}

/** When the last row has landed: the focus lift and the note follow it. */
export const lastAt = (p) => rowAt(0) + p.rows.length * 0.16 - 0.8 + 0.8 + 0.55; // after the last row has settled flat

/** How far the activated (focus / hovered) row lifts: its slab's depth. */
export const LIFT_Z = DEPTH.row;

/** What the pointer may do here. `items` are retimed to the narration; `focus` is the one that is clicked. */
export function targets(p) {
  return {
    items: p.rows.map((_, i) => `.trow[data-i="${i}"]`),
    focus: `.trow[data-i="${p.focus ?? 0}"]`,
    focusCell: p.focusCol ? `.tc.on` : null,
    tail: ['[data-a="n"]'],
    press: { item: "row", stage: p.tone === "blue" ? "blue" : "white" },
  };
}

/**
 * GEOMETRY: where things are in the laid-out table, in px from the CARD'S CENTRE, so a build can aim the pointer
 * at a row without a browser. MEASURED from the real layout (a 3-row, 3-column table, 2026-10-03): the card is
 * 1560 x 418, the rows are 72 high at a 81.5 px pitch starting 157 px from the top, the column centres are
 * -426 / +102 / +528. `geometry(props)` extends that to any row count; the lab re-measures it at runtime.
 */
export const GEOM = { cardW: 1560, rowTop: 157, rowH: 72, gap: 9.5, bottom: 26, cols3: [-426, 102, 528] };
export function geometry(p) {
  const n = p.rows.length, h = GEOM.rowTop + n * GEOM.rowH + (n - 1) * GEOM.gap + GEOM.bottom;
  const cols = p.cols.length === 3 ? GEOM.cols3 : p.cols.map((_, j) => GEOM.cols3[Math.min(j, 2)]);
  const rowCentre = (i, col = 1) => ({ x: cols[col], y: +(GEOM.rowTop + i * (GEOM.rowH + GEOM.gap) + GEOM.rowH / 2 - h / 2).toFixed(1) });
  return { w: GEOM.cardW, h, rowCentre };
}
