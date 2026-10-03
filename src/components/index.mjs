/**
 * components/ - the shared UI the films are built from, one directory per component, called by name.
 *
 *   import { COMPONENTS, get, list, validate, componentsCSS } from "./components/index.mjs";
 *   const t = get("table");                 // throws a helpful error for an unknown name
 *   t.html(props)                           // the markup (a slab / extruded when props.extrude)
 *   t.steps(props)                          // the entrance, as ordered data (anatomy.mjs plays it)
 *   t.targets(props)                        // what the pointer may point at / click
 *
 * A scene composes components instead of re-implementing them, so every card, tile, pill and table
 * enters the same way (card, tile, icon, text; scale with overshoot; nothing fades), is extruded the
 * same way, and exposes the same pointer targets. The contract is checked by `npm run lint:components`
 * (scripts/lint-components.mjs). See README.md here and docs/COMPONENTS.md.
 */

import * as card from "./card/index.mjs";
import * as tile from "./tile/index.mjs";
import * as pill from "./pill/index.mjs";
import * as chip from "./chip/index.mjs";
import * as table from "./table/index.mjs";
import * as satellite from "./satellite/index.mjs";
import * as cutout from "./cutout/index.mjs";
import { ORDER } from "./anatomy.mjs";

export const COMPONENTS = { card, tile, pill, chip, table, satellite, cutout };

export function get(id) {
  const c = COMPONENTS[id];
  if (!c) throw new Error(`unknown component "${id}". Available: ${Object.keys(COMPONENTS).join(", ")}`);
  return c;
}

export const list = () => Object.entries(COMPONENTS).map(([id, c]) => ({ id, kind: c.semantics.kind, use: c.semantics.use }));

/** Every component's own CSS, for a page that renders any of them. */
export const componentsCSS = Object.values(COMPONENTS).map((c) => c.css || "").join("\n");

/** Components that render (have html + steps) as opposed to pure style helpers like `card`. */
export const renderable = () => Object.entries(COMPONENTS).filter(([, c]) => typeof c.html === "function" && typeof c.steps === "function");

/**
 * The contract. Returns a list of problems (empty = valid). Used by lint-components.
 *   id, summary                          strings
 *   semantics { kind, use, avoid, tone, needs[] }
 *   css                                  string (may be empty)
 *   sample                               props that render it (a renderable component)
 *   html(props), steps(props), targets(props)    (renderable components)
 * and for every renderable component's steps:
 *   - every `from` scales from 0 and writes no opacity; the parts that exist enter in ORDER
 *   - the pointer's targets resolve in the markup; extruded markup has x3d + slices and no overflow:hidden
 */
export function validate(c, name) {
  const bad = [];
  const need = (cond, msg) => { if (!cond) bad.push(msg); };
  need(c.id === name, `id "${c.id}" must equal its registry name "${name}"`);
  need(typeof c.summary === "string" && c.summary.length > 10, "summary");
  const s = c.semantics || {};
  need(typeof s.kind === "string", "semantics.kind");
  need(typeof s.use === "string" && s.use.length > 20, "semantics.use says when to use it");
  need(typeof s.avoid === "string" && s.avoid.length > 20, "semantics.avoid says when not to");
  need(typeof s.tone === "string", "semantics.tone says how it behaves on each stage");
  need(Array.isArray(s.needs), "semantics.needs is a list");
  need(typeof c.css === "string" || c.css === undefined, "css is a string");
  if (typeof c.html !== "function") return bad; // a style helper: no markup contract
  need(typeof c.steps === "function" && typeof c.targets === "function", "a renderable component has steps() and targets()");
  need(c.sample && typeof c.sample === "object", "sample: props that render it");
  return bad;
}

export { ORDER };
