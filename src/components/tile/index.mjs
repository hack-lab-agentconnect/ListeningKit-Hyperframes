/**
 * components/tile - the icon tile: a square tile with a heroicon, the second thing to enter.
 *
 * Colour rule (DESIGN_SYSTEM 1.5): solid brand-blue tile with a white glyph on a white card; inverted to a
 * solid white tile with a blue glyph on a blue card. A blue tile on a blue card is the icon vanishing.
 * The CSS (`.ico`, `.ico.xs`, `.on-white`, `.on-bluecard`) is shared chrome and stays in lkchrome.mjs.
 *
 *   html({ icon, size?, on })   on: "white" (default, blue tile) | "bluecard" (white tile) | "plain"
 *   steps({ at })               tile scales in, then its glyph overshoots in LAST (the anatomy)
 */

import { icon as heroicon } from "../../lkicons.mjs";
import { EASE, GAP, step } from "../anatomy.mjs";

export const id = "tile";
export const summary = "An icon tile: tile first, heroicon last, both by scale with overshoot.";
export const semantics = {
  kind: "atom",
  use: "At the left of every card, chip and pill: a card in this series always carries a tile.",
  avoid: "A bare icon floating without a tile; a blue tile on a blue card.",
  tone: "inverts with its card",
  needs: ["icon"],
};

export const sample = { icon: "phone", size: 40, on: "white", extrude: false }; // an atom: its depth comes from the card it sits on
export const css = "";

export function html(p) {
  const on = p.on === "bluecard" ? " on-bluecard" : p.on === "plain" ? " plain" : "";
  const xs = p.xs ? " xs" : "";
  return `<span class="ico${on}${xs}" data-hit="tile">${heroicon(p.icon, p.size || 40)}</span>`;
}

/** `sel` is the tile's selector in the host; the glyph is the svg inside it. */
export function steps(p) {
  const sel = p.sel || ".ico";
  const at = p.at || 0;
  return [
    step("tile", sel, at, { one: false, ease: EASE.tile }),
    step("icon", `${sel} svg`, at + GAP.icon, { from: { scale: 0, rotation: -24 }, to: { scale: 1, rotation: 0 }, ease: EASE.icon }),
  ];
}

export function targets() {
  return { items: [".ico"], focus: ".ico", press: { item: "tile" } };
}
