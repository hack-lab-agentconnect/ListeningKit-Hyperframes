#!/usr/bin/env node
// lint-components - the gate for src/components/ (docs/COMPONENTS.md).
//
//   node scripts/lint-components.mjs
//
// For EVERY component registered in src/components/index.mjs it renders the component with its own
// `sample` props, on both stages where it has a tone, and checks the markup and the entrance it
// declares. A component is only "done" when it obeys the anatomy.
//
//   C1  contract       validate(): id, summary, semantics (use / avoid / tone / needs), sample, html/steps/targets
//   C2  documented     the id is in docs/COMPONENTS.md and in src/components/README.md
//   C3  anatomy order  the parts that exist enter in the order card -> tile -> icon -> text
//   C4  scale only     every step starts from scale 0 (or a rise in y with scale 0), writes no opacity,
//                      uses a spring preset (lkspring.mjs: pop | snap | soft), and nothing in the markup is opacity:0 / blur
//   C5  targets        every selector the pointer may target resolves in the markup; a focus exists
//   C6  extrusion      an extruded component has x3d hosts with >= 4 slices each, and no overflow:hidden
//                      on a host (it would flatten the sides); faces under slices are SOLID (no rgba fill)
//   C7  solid          nothing hollow: no transparent / none background on a pill or chip face
//   C8  determinism    no Math.random / Date.now / timers / fetch in a component
//   C9  one source     scenes build these through the component (no second copy of the markup in scenes.mjs)
//   C10 restrained depth an extruded role is between MIN_DEPTH and its DEPTH (lkextrude): a few px of side, never a
//                      block; no lean / prism look unless a component opts in
//   C11 generated      in the BUILT films and the lab, every .sat / .tbl / .trow is an x3d slab with slices
//   C12 no decoration  satellites are family members (a tile, a heroicon, a real name), never numerals or
//                      stray chips; the components lab carries no numbered chips
//   C13 one layout     satellites and every lab take their positions from components/layout.mjs
//   C15 owned slabs    every slab host is position:relative (the containing block of its own slices), no unresolved
//                      --slab marker, no static host: the extrusion belongs to the element, never to a layer behind it
//   C16 flat at rest   an inner element that lifts while rising settles back to z = 0: no hard shadow at rest, only on
//                      activation (hover / press / focus) and during a transition
//   C17 derived lip    the lip (a slab's side) has NO colour of its own: every page with slabs runs the OKLCH runtime
//                      (lkcolor.mjs), which derives it from the host's computed background; no slice carries a colour
//   C14 real cutouts   an ear cutout points at a real file in assets/ears (and its mirror); at most one per beat

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMPONENTS, validate, renderable } from "../src/components/index.mjs";
import { ORDER } from "../src/components/anatomy.mjs";
import { DEPTH, MIN_DEPTH } from "../src/lkextrude.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const bad = [];
const fail = (rule, id, msg) => bad.push(`${rule} [${id}] ${msg}`);

const docs = read("docs/COMPONENTS.md"), readme = read("src/components/README.md");
const scenes = read("src/scenes.mjs");

/** Does `sel` (the simple selectors we use: .cls, [attr="v"], tag, `> *`, a descendant chain) match an element in `html`? */
function resolves(html, sel) {
  const last = sel.split(/[ >]+/).filter(Boolean).pop();
  if (last === "*") return /<[a-z]/i.test(html);
  const cls = [...last.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
  const attrs = [...last.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)].map((m) => [m[1], m[2]]);
  const tag = (last.match(/^[a-z][\w-]*/i) || [null])[0];
  return [...html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)].some(([, t, a]) => {
    if (tag && t.toLowerCase() !== tag.toLowerCase()) return false;
    const c = (a.match(/class="([^"]*)"/) || [, ""])[1].split(/\s+/);
    if (!cls.every((k) => c.includes(k))) return false;
    return attrs.every(([k, v]) => new RegExp(`\\b${k}="${v === undefined ? "[^\"]*" : v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(a));
  });
}

for (const [id, c] of Object.entries(COMPONENTS)) {
  for (const m of validate(c, id)) fail("C1", id, m);
  if (!docs.includes("`" + id + "`")) fail("C2", id, "not described in docs/COMPONENTS.md (as `" + id + "`)");
  if (!readme.includes("`" + id + "`")) fail("C2", id, "not in the src/components/README.md table");

  const src = read(`src/components/${id}/index.mjs`);
  const nondet = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/[^\n]*/g, "$1").match(/Math\.random|Date\.now|performance\.now|new Date\(|fetch\(|setTimeout|setInterval/g);
  if (nondet) fail("C8", id, `non-deterministic: ${[...new Set(nondet)].join(", ")}`);
}

for (const [id, c] of renderable()) {
  const tones = c.sample.tone ? ["white", "blue"] : [undefined];
  for (const tone of tones) {
    const props = { ...c.sample, ...(tone ? { tone } : {}) };
    const label = tone ? `${id}/${tone}` : id;
    let html = "", steps = [], targets = {};
    try { html = c.html(props); steps = c.steps(props); targets = c.targets(props); } catch (e) { fail("C1", label, "throws: " + e.message); continue; }

    // C3: the order of the parts that exist (a part's FIRST step defines when it enters)
    const first = {};
    for (const s of steps) if (s.role && !(s.role in first)) first[s.role] = s.at;
    const present = ORDER.filter((r) => r in first);
    // rows are the `card` role repeating after the tile (a table's columns): compare only the first of each role
    for (let i = 1; i < present.length; i++) {
      const a = present[i - 1], b = present[i];
      if (id === "table" && (b === "card" || a === "card")) continue; // rows rise after the heads by design; tile/icon/text vs rows is checked below
      if (first[b] < first[a]) fail("C3", label, `${b} enters (${first[b]}s) before ${a} (${first[a]}s); the order is ${ORDER.join(" > ")}`);
    }
    if (c.id === "table") {
      const rowAt = steps.filter((s) => s.kind !== "to" && /^\.trow\[data-i="\d+"\]$/.test(s.sel)).map((s) => s.at);
      const cellAt = steps.filter((s) => /^\.trow\[data-i="\d+"\] > \*$/.test(s.sel)).map((s) => s.at);
      if (!rowAt.length) fail("C3", label, "no rows rise");
      if (!rowAt.every((a, i) => i === 0 || a > rowAt[i - 1])) fail("C3", label, "rows must rise one at a time, in order");
      if (!rowAt.every((a, i) => cellAt[i] > a)) fail("C3", label, "a row's cells must resolve AFTER the row has risen");
    }

    // C4
    if (!steps.length) fail("C4", label, "no steps");
    for (const s of steps) {
      const f = JSON.stringify(s.from || {}), t = JSON.stringify(s.to || {});
      // a follow-on move (kind "to": a row settling back flat after it has risen) has no `from`; every ENTRANCE does
      if (s.kind !== "to" && !/"scale":0\b/.test(f)) fail("C4", label, `${s.sel}: must start from scale 0 (got ${f})`);
      if (/opacity|autoAlpha|blur/i.test(f + t + (s.ease || ""))) fail("C4", label, `${s.sel}: fades or blurs (${f} -> ${t})`);
      if (!(s.kind === "to" ? /^spr:settle$/ : /^spr:(pop|snap|soft|row)$/).test(s.ease || "")) fail("C4", label, `${s.sel}: entrances have MASS: use a spring preset (spr:pop | spr:snap | spr:soft | spr:row), got "${s.ease}"`);
      if (s.at < 0) fail("C4", label, `${s.sel}: negative start`);
    }
    if (/opacity\s*:\s*0(?![.\d])|filter\s*:\s*blur|backdrop-filter/.test(html)) fail("C4", label, "markup hides or blurs (opacity:0 / blur)");

    // C16: FLAT AT REST. An inner element carries no hard shadow at rest: it may lift to its slab's depth while it
    // rises (a transition), but it must SETTLE BACK to z = 0 (its slab is then behind the card face, hidden). Depth
    // shows only while rising or when activated (hover / press / focus: __cmp.lift), never as a resting state.
    const lifted = new Set(steps.filter((s) => s.kind !== "to" && s.to && s.to.z > 0).map((s) => s.sel));
    for (const sel of lifted) {
      const settle = steps.filter((s) => s.sel === sel && s.kind === "to" && s.to && s.to.z === 0);
      for (const st of settle) if (st.ease !== "spr:settle") fail("C16", label, `${sel} returns to the card plane on ${st.ease}: an overshooting spring dips below z = 0, BEHIND the card's opaque face, and the element vanishes. Use spr:settle (critically damped)`);
      if (!settle.length) fail("C16", label, `${sel} lifts to depth on entrance but never settles back flat: its hard shadow would show at rest (only activation may show it)`);
    }
    for (const s of steps) if (s.kind !== "to" && s.to && s.to.z > 0 && s.to.z > DEPTH.panel) fail("C16", label, `${s.sel} lifts to z ${s.to.z}px, deeper than any role`);

    // C5
    if (!targets.focus) fail("C5", label, "targets() must name a focus (the thing the pointer clicks)");
    for (const sel of [...(targets.items || []), targets.focus, ...(targets.focusCell ? [targets.focusCell] : [])].filter(Boolean)) if (!resolves(html, sel)) fail("C5", label, `pointer target "${sel}" does not resolve in the markup`);
    if (!(targets.items || []).length) fail("C5", label, "targets() lists no items");
    for (const s of steps) if (!resolves(html, s.sel)) fail("C5", label, `step target "${s.sel}" does not resolve in the markup`);

    // C6: extrusion
    if (props.extrude !== false) {
      const hosts = [...html.matchAll(/<(div|span)\b[^>]*class="[^"]*\bx3d\b[^"]*"[^>]*>/g)];
      if (!hosts.length) fail("C6", label, "an extruded component needs at least one x3d host");
      if ((html.match(/class="(?:[\w-]+ )*xl"/g) || []).length < 4) fail("C6", label, "needs at least 4 slab slices");
      for (const [tag] of hosts) if (/overflow\s*:\s*hidden/.test(tag)) fail("C6", label, "an x3d host has overflow:hidden (flattens the sides)");
      for (const [tag] of hosts) if (/background\s*:\s*rgba\(/.test(tag)) fail("C6", label, "an extruded face has a translucent fill: its slices would show through (use a solid blend)");
      // C10: visible depth
      const slices = [...html.matchAll(/<(?:i|img)\b[^>]*class="(?:[\w-]+ )*xl"[^>]*style="([^"]*)"/g)].map((m) => m[1]);
      const zs = slices.map((t) => +(t.match(/translateZ\(-([\d.]+)px\)/) || [, 0])[1]);
      const roles = c.roles ? Object.values(c.roles) : [];
      if (!roles.length) fail("C10", label, "an extruded component must declare its depth roles (export const roles = { ... })");
      for (const r of roles) if (!(r in DEPTH)) fail("C10", label, `unknown depth role "${r}"`); else if (DEPTH[r] < MIN_DEPTH[r]) fail("C10", label, `role "${r}" is ${DEPTH[r]}px, below the minimum ${MIN_DEPTH[r]}px`);
      const minNeeded = Math.min(...roles.filter((r) => r in MIN_DEPTH).map((r) => MIN_DEPTH[r]));
      if (zs.length && Math.max(...zs) < minNeeded) fail("C10", label, `deepest slice is ${Math.max(...zs)}px; the role needs at least ${minNeeded}px`);
      // slabs stay RESTRAINED: not deeper than MAX_DEPTH of the role (an over-extruded component reads as a block)
      const maxNeeded = Math.max(...roles.filter((r) => r in DEPTH).map((r) => DEPTH[r]));
      if (zs.length && Math.max(...zs) > maxNeeded * 1.01) fail("C10", label, `deepest slice is ${Math.max(...zs)}px, deeper than its role's depth (${maxNeeded}px)`);
      if (slices.some((t) => /scale\(1\./.test(t))) fail("C10", label, "prism/lean slabs are off by default: they made every component read as a block");
      if (/<i class="xl"[^>]*(background|#[0-9a-fA-F]{3,6}|rgb)/.test(html)) fail("C17", label, "a slice has a hard-coded colour; the lip is derived from the element");
      // every .trow-style face carries its fill in its own tag
    } else if (/class="(?:[\w-]+ )*xl"/.test(html)) fail("C6", label, "extrude is off but slices were emitted");

    // C7: nothing hollow
    if (/background\s*:\s*(transparent|none)/.test(html) && /pill|chip/.test(id)) fail("C7", label, "a hollow background on a pill/chip");
  }
}

// C11 / C12: the BUILT films and the lab
const gen = [];
for (const slug of fs.readdirSync(path.join(ROOT, "compositions"))) {
  const d = path.join(ROOT, "compositions", slug);
  if (fs.statSync(d).isDirectory() && /^agency-/.test(slug)) for (const f of fs.readdirSync(d)) if (/^b\d+\.html$/.test(f)) gen.push(`compositions/${slug}/${f}`);
}
if (fs.existsSync(path.join(ROOT, "compositions/components-lab.html"))) gen.push("compositions/components-lab.html");
for (const f of gen) {
  const h = read(f);
  const hosts = (h.match(/class="(?:sat|tbl|trow)\b[^"]*\bx3d\b/g) || []).length;
  const faces = (h.match(/class="(?:sat|tbl|trow)\b/g) || []).length;
  if (faces !== hosts) fail("C11", f, `${faces - hosts} sat/tbl/trow face(s) are flat (no x3d slab)`);
  if ((h.match(/class="(?:[\w-]+ )*xl"/g) || []).length < hosts * 4) fail("C11", f, "slab hosts without slices");
  if (/\.(sat|tbl|trow)\{[^}]*overflow\s*:\s*hidden/.test(h)) fail("C11", f, "a slab host has overflow:hidden");
  // C15: OWNERSHIP. A slab host is the containing block of its own slices (position:relative); otherwise the absolutely
  // positioned slices attach to whatever ancestor is positioned (a different layer) when the host's own transform clears.
  if (hosts > 0 && !/\.x3d\{[^}]*position:relative/.test(h)) fail("C15", f, "slab hosts are not position:relative: the extrusion would attach to a layer behind the element");
  // C17: THE LIP IS DERIVED, never a colour somebody picked: every page with slabs runs the OKLCH runtime, and no slice
  // carries a colour of its own (lkcolor.mjs derives it at render time from the host's computed background).
  if (hosts > 0 && !/__lip\.apply\(root\)/.test(h)) fail("C17", f, "slabs without the lip runtime: __lip.apply(root) derives their colour from the element's own colour");
  if (/<i class="xl"[^>]*(background|#[0-9a-fA-F]{3,6}|rgb)/.test(h.replace(/<style[\s\S]*?<\/style>/g, ""))) fail("C17", f, "a slice has a hard-coded colour; the lip is derived from the element");
  if (/--slab:/.test(h)) fail("C15", f, "an unresolved --slab marker: a card that was never turned into an owned slab");
  for (const [tag] of h.matchAll(/<(?:div|span)\b[^>]*class="[^"]*\bx3d\b[^"]*"[^>]*>/g)) if (/position\s*:\s*static/.test(tag)) fail("C15", f, "a slab host is position:static: " + tag.slice(0, 80));
  for (const m of h.matchAll(/<div class="sat(?! cut)\b[^>]*>([\s\S]*?)<\/div>/g)) {
    const inner = m[1];
    const label = (inner.match(/class="satl"[^>]*>([^<]*)</) || [, ""])[1];
    if (!/<svg/.test(inner) || !/class="ico/.test(inner)) fail("C12", f, `satellite "${label}" has no tile + heroicon`);
    if (!/[A-Za-z]{3,}/.test(label)) fail("C12", f, `satellite label "${label}" is not a real name`);
  }
}
if (fs.existsSync(path.join(ROOT, "compositions/components-lab.html")) && /class="numchip/.test(read("compositions/components-lab.html"))) fail("C12", "components-lab", "numbered chips are decoration here; the lab shows the table and its family only");

// C14: cutouts are the brand's real ears: every one in a built film points at a file that exists in both asset dirs
for (const f of gen) {
  for (const m of read(f).matchAll(/src="assets\/ears\/(ear\d+\.webp)"/g)) {
    for (const dir of ["assets/ears", "compositions/assets/ears"]) if (!fs.existsSync(path.join(ROOT, dir, m[1]))) fail("C14", f, `${m[1]} is missing from ${dir}/`);
  }
}
const per = {};
for (const f of gen.filter((x) => /agency-/.test(x))) {
  const n = (read(f).match(/class="sat cut/g) || []).length;
  if (n > 1) fail("C14", f, `${n} ear cutouts in one beat (one per beat: it is a brand note, not a pattern)`);
}

// C13: one layout
const sats = read("src/lksatellites.mjs"), lab = read("src/build-components-lab.mjs");
if (/const SLOTS\b/.test(sats) || !/components\/layout\.mjs/.test(sats)) fail("C13", "lksatellites", "satellite positions must come from components/layout.mjs");
if (!/components\/layout\.mjs/.test(lab)) fail("C13", "components-lab", "the lab must place the family with components/layout.mjs");

// C9: scenes build tables through the component, not a second copy
if (/class="trow"|data-hit="row"|"tcols"/.test(scenes)) fail("C9", "table", "scenes.mjs still carries its own table markup; build it through components/table");
if (!/components\/table/.test(scenes)) fail("C9", "table", "scenes.mjs does not import components/table");

if (bad.length) {
  console.error(`✗ component lint: ${bad.length} violation(s)\n`);
  for (const m of bad) console.error("  " + m);
  console.error("\nSee docs/COMPONENTS.md (the anatomy) and src/components/README.md (the contract).");
  process.exit(1);
}
console.log(`✓ component lint clean (${Object.keys(COMPONENTS).length} components, 17 rules, ${renderable().length} rendered)`);
