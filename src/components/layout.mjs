/**
 * components/layout.mjs - where components stand around the main component, and why.
 *
 * ONE placement system for the films and for every lab, so "the elements around the component" are
 * always arranged the same way and never invented per scene. A main component sits on the content
 * plane; its FAMILY (related objects or the object's other fields, from lksatellites FAMILY, never
 * decoration, never numbers, never subtitle text) stands around it at different depths so the camera has
 * parallax to pull apart and the active component has a background and a foreground to rise out of.
 *
 * Separation between layers comes from perspective scale, the black outer stroke, and EXTRUSION (every
 * placed component is a slab with real sides); never from blur or dimming.
 *
 *   SLOTS[pattern][k]      { x, y, z } in px from the stage centre, z toward the camera
 *   slotsFor(index)        the pattern for beat/scene `index` (patterns alternate and mirror)
 *   isForeground(slot)     z > 0: drawn larger, sweeps past the camera at the frame edge
 */

/**
 * Two foreground slots sit near the frame edges (large, partly cropped); the rest sit behind the content
 * (smaller). Patterns alternate and mirror so no two neighbouring scenes share an arrangement.
 */
export const SLOTS = [
  [
    { x: -840, y: -140, z: 240 }, { x: 870, y: 200, z: 190 },
    { x: -600, y: -390, z: -300 }, { x: 640, y: -360, z: -340 },
    { x: -680, y: 300, z: -280 }, { x: 740, y: 330, z: -320 },
  ],
  [
    { x: 860, y: -170, z: 230 }, { x: -880, y: 220, z: 200 },
    { x: 560, y: -400, z: -310 }, { x: -620, y: -350, z: -330 },
    { x: 700, y: 310, z: -290 }, { x: -720, y: 340, z: -330 },
  ],
];

export const slotsFor = (index) => SLOTS[((index % SLOTS.length) + SLOTS.length) % SLOTS.length];
export const isForeground = (slot) => slot.z > 0;
