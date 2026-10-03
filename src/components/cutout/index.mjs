/**
 * components/cutout - a die-cut sticker standing in the depth set: the brand's ear cutouts.
 *
 * The ears (assets/ears, from the hackathon app's landing page) are ListeningKit's own cutout mascots, each tied
 * to a topic there (SECTION_EAR_MAP). Here one stands in each beat's depth set, chosen by what the beat is
 * about, so the space around the main component is brand and meaning, not generic cards.
 *
 *   - die-cut: the cutout keeps its own white edge and gets the system's black OUTER stroke, built from four
 *     hard (zero-blur) drop-shadows, the same stroke every component carries (DESIGN_SYSTEM 1.8);
 *   - extruded, lightly: a few black silhouette copies of the same image stand behind it (role `sticker`);
 *   - it enters by a spring (scale 0 -> 1 with a hair of overshoot) while settling a few degrees of rotation;
 *   - like every satellite it is background / foreground for the main component and is never pressed.
 *
 *   html({ ear, i, size, rot, fg, extrude })      ear = "ear1" .. "ear8"
 *   earFor(kind, index)                           which ear a scene of this kind gets
 */

import { DEPTH } from "../../lkextrude.mjs";
import { EASE, step } from "../anatomy.mjs";

export const id = "cutout";
export const summary = "A die-cut ear sticker in the depth set: black outer stroke, light extrusion, spring entrance.";
export const semantics = {
  kind: "family",
  use: "In a beat's depth set, one per beat, standing at a layout slot; chosen by what the beat is about (earFor).",
  avoid: "Text, numerals or captions on it; clicking it (satellites are passive); more than one per beat (it is a brand note, not a pattern).",
  tone: "the same blue cutouts on both stages: they carry their own white die-cut edge and the black outer stroke",
  needs: ["ear"],
};

/** The eight ears and what each is for (after the landing page's SECTION_EAR_MAP). */
export const EARS = {
  ear1: "pixelated ear: the data, the raw rows",
  ear2: "soft ear: how it works",
  ear3: "elf ear: odd cases, edge cases",
  ear4: "halftone ear: records, the object",
  ear5: "fur ear: the other cases, the long tail",
  ear6: "listening man: a person on the line",
  ear7: "cartoon bird listening: the funny bit, the cost",
  ear8: "listening, surprised: the hook, the pain",
};

/** Which ear a scene of this kind gets; falls back through the set by index so neighbours differ. */
const BY_KIND = {
  overwhelm: "ear8", hook: "ear8", split: "ear3", relations: "ear2", converge: "ear2", journey: "ear6", agentWork: "ear1",
  table: "ear4", record: "ear4", transcript: "ear6", sentiment: "ear5", typewriter: "ear2", countup: "ear7", costCount: "ear7", zoomOut: "ear2",
};
export const earFor = (kind, index = 0) => BY_KIND[kind] || `ear${(index % 8) + 1}`;

export const sample = { ear: "ear4", i: 0, size: 170, rot: -8, fg: false, extrude: true };
export const roles = { cutout: "sticker" };

export const css = `
/* ---- the cutout satellite: a die-cut sticker. The black outer stroke is four hard drop-shadows (zero blur). */
.sat.cut{display:block;padding:0;gap:0;font-size:0;transform-style:preserve-3d}
.cut img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;display:block}
.cut .cutf{filter:drop-shadow(3px 0 0 #0A0F1A) drop-shadow(-3px 0 0 #0A0F1A) drop-shadow(0 3px 0 #0A0F1A) drop-shadow(0 -3px 0 #0A0F1A)}
.cut .cutsl{filter:brightness(0.45);background:none} /* an image has no background to derive from: its own pixels, darker */
`;

export function html(p) {
  const size = p.size || (p.fg ? 280 : 220);
  const src = `assets/ears/${p.ear}.webp`;
  const depth = DEPTH.sticker || 8;
  const layers = 4;
  let slices = "";
  if (p.extrude !== false) {
    for (let k = layers; k >= 1; k--) {
      const z = +((depth * k) / layers).toFixed(2);
      slices += `<img class="cutsl xl" src="${src}" alt="" style="transform:translateZ(-${z}px)"/>`;
    }
  }
  const x = p.extrude === false ? "" : " x3d";
  // it is ALSO a `.sat`: the director animates the whole depth set through that class (entrance, exit, camera visits)
  return `<div class="sat cut${x}" data-layout-allow-overlap data-hit="cutout" data-i="${p.i ?? 0}" data-rot="${p.rot ?? 0}" style="width:${size}px;height:${size}px;transform:rotate(${p.rot ?? 0}deg)">${slices}<img class="cutf" src="${src}" alt=""/></div>`;
}

/** A spring entrance that settles its rotation: it arrives tilted and rights itself with the same mass. */
export function steps(p) {
  const at = p.at || 0;
  const sel = `.sat.cut[data-i="${p.i ?? 0}"]`;
  return [step("card", sel, at, { one: true, dur: 0.6, ease: EASE.card, from: { scale: 0, rotation: (p.rot ?? 0) - 18 }, to: { scale: 1, rotation: p.rot ?? 0 } })];
}

export function targets(p) {
  const sel = `.sat.cut[data-i="${p.i ?? 0}"]`;
  return { items: [sel], focus: sel, press: null, passive: true };
}
