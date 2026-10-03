/**
 * components/pill - a solid, padded pill with a tile: the CTA / chip-row element.
 *
 * Never hollow (a hollow pill has no edge on either stage), always padded, always with a tile at its
 * left. Anatomy: the pill overshoots from its centre, then the tile, then the heroicon last, then the
 * label rises. It is a slab (extruded) so it has sides when the camera orbits it.
 *
 *   html({ label, icon, w?, h?, extrude? })
 */

import { icon as heroicon } from "../../lkicons.mjs";
import { slabFor } from "../../lkextrude.mjs";
import { pill as pillStyle } from "../card/index.mjs";
import { EASE, GAP, step } from "../anatomy.mjs";

export const id = "pill";
export const summary = "A solid padded pill with a tile; extruded; card, tile, icon, then label.";
export const semantics = {
  kind: "control",
  use: "A call to action or a named option the pointer can press (the pointer's hover/press target).",
  avoid: "Hollow outlines; a pill without a tile; pills as status badges (use a chip).",
  tone: "white on the blue stage",
  needs: ["label", "icon"],
};

export const sample = { label: "Book a call", icon: "phone", w: 420, h: 88, extrude: true };
export const roles = { pill: "pill" };
export const css = `.pillc{display:flex;align-items:center;gap:20px;padding:0 28px 0 12px;font:900 34px/1 'Satoshi',sans-serif;white-space:nowrap}
.pillc .ico{width:64px;height:64px}`;

export function html(p) {
  const x = p.extrude === false ? "" : " x3d";
  return `<div class="pillc${x}" data-hit="pill" style="${pillStyle(p.w || 420, p.h || 88)}">${p.extrude === false ? "" : slabFor("pill", { grow: { top: 4, right: 4, bottom: 8, left: 4 } })}<span class="ico" data-hit="tile">${heroicon(p.icon, 34)}</span><span class="pl">${p.label}</span></div>`;
}

export function steps(p) {
  const at = p.at || 0;
  return [
    step("card", ".pillc", at, { one: true, dur: 0.5, ease: EASE.card }),
    step("tile", ".pillc .ico", at + GAP.tile, { one: true }),
    step("icon", ".pillc .ico svg", at + GAP.tile + GAP.icon, { one: true, from: { scale: 0, rotation: -24 }, to: { scale: 1, rotation: 0 } }),
    step("text", ".pillc .pl", at + GAP.text + 0.1, { one: true, from: { scale: 0, y: 14 }, to: { scale: 1, y: 0 } }),
  ];
}

export function targets() {
  return { items: [".pillc"], focus: ".pillc", press: { item: "pill", stage: "blue" } };
}
