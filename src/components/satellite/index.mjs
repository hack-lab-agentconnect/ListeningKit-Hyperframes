/**
 * components/satellite - a member of the main component's FAMILY, standing around it in 3D.
 *
 * It is the same component the rest of the series uses (a card with a tile, a heroicon and a label,
 * DESIGN_SYSTEM 1.5), so it is recognisably the family of the thing it surrounds. It is EXTRUDED: a flat
 * satellite orbited by the camera is a 2D sticker in a 3D scene. Where it stands comes from
 * components/layout.mjs, never from the scene.
 *
 *   html({ name, icon, tone, fg, i, extrude })   name is a real field / object name, never a number
 *   steps({ i, at })                              card, then tile, then icon, then label (the anatomy)
 */

import { C, R } from "../../lkdesign.mjs";
import { icon as heroicon } from "../../lkicons.mjs";
import { slabFor, applySlabs } from "../../lkextrude.mjs";
import { cardFor } from "../card/index.mjs";
import { EASE, GAP, step } from "../anatomy.mjs";

export const id = "satellite";
export const summary = "A family member around the main component: card + tile + icon + label, extruded.";
export const semantics = {
  kind: "family",
  use: "Around a main component, at the depths layout.mjs gives it: related objects or the object's other fields.",
  avoid: "Decoration, numerals, subtitle text, or anything not in the beat's own family; clicking it (the pointer clicks only the focus).",
  tone: "inverts: white on the blue stage, brand blue on the white stage",
  needs: ["name", "icon"],
};

export const sample = { name: "agencyLeads", icon: "users", tone: "blue", fg: false, i: 0, extrude: true };

export const css = `
/* ---- the depth set. .stagec is a 3D rendering context: satellites sit at their own
   depth, the director's camera moves through them. Components, not text blocks. */
.stagec{transform-style:preserve-3d}
.satset{position:absolute;inset:0;pointer-events:none;transform-style:preserve-3d;z-index:1}
.sat{position:absolute;left:50%;top:50%;display:flex;align-items:center;gap:16px;
 padding:14px 32px 14px 14px;white-space:nowrap;font-weight:700;line-height:1.1}
.satl{font-weight:700}
.sat .ico.sat-fg{width:68px;height:68px}
.sat .ico.sat-bg{width:54px;height:54px}
`;

function htmlRaw(p) {
  const onBlue = p.tone === "blue";
  const tile = (onBlue ? "ico" : "ico on-bluecard") + (p.fg ? " sat-fg" : " sat-bg");
  const size = p.fg ? 46 : 36;
  const x = p.extrude === false ? "" : " x3d";
  return `<div class="sat${x}" data-layout-allow-overlap data-hit="satellite" data-i="${p.i ?? 0}" style="${cardFor(p.tone, 560, R.lg)};color:${onBlue ? C.slate900 : C.white};font-size:${size}px">${p.extrude === false ? "" : slabFor("card")}<span class="${tile}">${heroicon(p.icon, p.fg ? 38 : 30)}</span><span class="satl" data-layout-allow-overlap>${p.name}</span></div>`;
}

/** The component's markup. Passed through applySlabs so the card marker is resolved (this component renders its own slab). */
export const html = (p) => applySlabs(htmlRaw(p));

/** The depth the slab is built to (lint checks it against MIN_DEPTH). */
export const roles = { satellite: "card" };

export function steps(p) {
  const at = p.at || 0;
  const sel = `.sat[data-i="${p.i ?? 0}"]`;
  return [
    step("card", sel, at, { one: true, dur: 0.55, ease: EASE.card }),
    step("tile", `${sel} .ico`, at + GAP.tile, { one: true }),
    step("icon", `${sel} .ico svg`, at + GAP.tile + GAP.icon, { one: true, from: { scale: 0, rotation: -24 }, to: { scale: 1, rotation: 0 } }),
    step("text", `${sel} .satl`, at + GAP.text + 0.1, { one: true, from: { scale: 0, y: 12 }, to: { scale: 1, y: 0 } }),
  ];
}

/** Satellites are background and foreground, not targets: the pointer never presses one. */
export function targets(p) {
  const sel = `.sat[data-i="${p.i ?? 0}"]`;
  return { items: [sel], focus: sel, press: null, passive: true };
}
