/**
 * components/chip - the small labelled chip: a numbered chip, or the API-name chip that names a
 * Twenty object. Solid, padded, subordinate to the title beside it.
 *
 *   html({ kind: "num" | "api", n?, api?, onBlue })
 */

import { numChip, apiChip } from "../card/index.mjs";
import { slabFor } from "../../lkextrude.mjs";
import { EASE, step } from "../anatomy.mjs";

export const id = "chip";
export const summary = "A numbered chip or the API-name chip: solid, padded, scale-in.";
export const semantics = {
  kind: "atom",
  use: "Numbering a step, or naming the object a card is about (agencyProspects) next to its human title.",
  avoid: "Using a chip as the main label; fully-rounded lozenges for cards (a chip is R.lg, a pill is the only 999px).",
  tone: "inverts with its card",
  needs: [],
};

export const sample = { kind: "num", n: 3, onBlue: false };
export const roles = { chip: "chip" };
export const css = "";

export function html(p) {
  if (p.kind === "api") return apiChip(p.api || "agencyProspects", !!p.onBlue);
  return `<span class="numchip x3d" data-hit="chip" style="${numChip(p.n, !!p.onBlue)};position:relative">${slabFor("chip", { round: true, grow: { top: 0, right: 0, bottom: 0, left: 0 } })}<span class="nc">${p.n}</span></span>`;
}

export function steps(p) {
  const at = p.at || 0;
  return [step("card", p.kind === "api" ? ".apichip" : ".numchip", at, { one: true, dur: 0.4, ease: EASE.tile })];
}

export function targets(p) {
  return { items: [p && p.kind === "api" ? ".apichip" : ".numchip"], focus: p && p.kind === "api" ? ".apichip" : ".numchip", press: { item: "chip" } };
}
