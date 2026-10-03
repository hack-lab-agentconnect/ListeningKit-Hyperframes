/**
 * components/family.mjs - the main component and the FAMILY standing around it, as one call.
 *
 * Every lab and the transition demo (and, when the films are ported, every beat) needs the same thing: one main
 * component, and around it a few family members at the depths layout.mjs gives them, one of them the brand's ear
 * cutout. This builds that scene's markup, its entrance data and the world position of everything, so the
 * arrangement around a component is always the same and is never invented per scene.
 *
 *   familyScene({ names, ear, tone, at0, gap, back })
 *     -> { html, sats: [{ i, x, y, z, at, cutout }], steps, cutSlot }
 *
 *   - satellites are components/satellite (card + tile + icon + label, each an owned slab);
 *   - one slot (CUT_SLOT) is a components/cutout (an ear), so the space carries the brand;
 *   - `back: true` keeps to the BACK slots (z < 0): in a still composition a half-cropped foreground card reads as
 *     a mistake (in a film the foreground slots sweep past the camera at the frame edge on purpose).
 */

import { OBJECT_ICON } from "../lkicons.mjs";
import * as SAT from "./satellite/index.mjs";
import * as CUT from "./cutout/index.mjs";
import { slotsFor, isForeground } from "./layout.mjs";

export const CUT_SLOT = 3;

export function familyScene({ names, ear = "ear4", tone = "blue", at0 = 0.7, gap = 0.28, back = true, index = 0 }) {
  let slots = slotsFor(index);
  if (back) slots = slots.filter((s) => !isForeground(s));
  const sats = names.slice(0, slots.length).map((name, k) => ({ i: k, name, ...slots[k], at: +(at0 + gap * k).toFixed(3), cutout: k === CUT_SLOT }));
  const html = sats
    .map((s) => (s.cutout
      ? CUT.html({ ear, i: s.i, fg: isForeground(s), rot: index % 2 ? 9 : -9, extrude: true })
      : SAT.html({ name: s.name, icon: OBJECT_ICON[s.name] || "squares-2x2", tone, fg: isForeground(s), i: s.i, extrude: true })))
    .join("");
  const steps = sats.flatMap((s) => (s.cutout ? CUT.steps({ i: s.i, at: s.at, rot: index % 2 ? 9 : -9 }) : SAT.steps({ i: s.i, at: s.at })));
  return { html, sats, steps, cutSlot: CUT_SLOT };
}
