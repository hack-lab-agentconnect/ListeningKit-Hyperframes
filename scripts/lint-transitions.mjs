#!/usr/bin/env node
// lint-transitions - the gate for transitions and for the sample compositions that prove them.
//
//   node scripts/lint-transitions.mjs
//
// For EVERY transition registered in src/transitions/index.mjs this regenerates its sample (two
// compositions joined by it: compositions/transition-demo*.html + the a.html / b.html beside it) and
// checks the generated files against the rules below. So a transition is only "done" when the sample
// that demonstrates it obeys the method in docs/TRANSITION_FX.md. Runs in `npm run lint`, on
// pre-commit (after regenerating) and on pre-push. Exit 1 on any violation.
//
//   T1  contract       the module satisfies validate(): phases in order, semantics, timing, parent()
//   T2  documented     the id appears in docs/TRANSITION_FX.md and src/transitions/README.md
//   T3  mask           a "wipe" reveals THROUGH a mask on the incoming group (clip-path); it paints no
//                      full-frame fill and has no full-frame flash overlay
//   T4  adjustment     ONE adjustment layer wraps both compositions (and the mask) and owns the
//                      scale / rush; the compositions carry no zoom of their own
//   T5  layers         three layers, bottom to top: the composite (the 3D elements), the CLICK RINGS (their own full-screen
//                      layer, outside the adjustment layer so a transition cannot clip them), the POINTER on top
//                      and above every transition layer (cursor > rings > flash > mask edges)
//   T6  no fades       no opacity / autoAlpha / fade tween on scene content (the flash layer, and
//                      sprite swaps marked swap-ok, are the only opacity writes), and no `transition:`
//   T7  extrusion      every 3D item is a slab that OWNS its slices (x3d host, position:relative, slices as
//                      its children, no overflow:hidden, no unresolved --slab marker); sample B is the table
//                      component with its family (satellites + one ear)
//   T11 lip            every slab's lip is derived at render time from the element's own computed colour (OKLCH)
//   T8  rings          3 pixel rings (8-bit, 3-8 px cell): white core, blue pixel stroke, black outline
//   T9  determinism    no Math.random / Date.now / performance.now / fetch in a transition or sample
//   T10 fresh          the committed sample equals what the generator emits now (no stale output)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TRANSITIONS, validate } from "../src/transitions/index.mjs";
import { buildDemo } from "../src/build-demo.mjs";
import { makeDemo } from "../src/lkdemo.mjs";
import { DEPTH } from "../src/lkextrude.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const bad = [];
const fail = (rule, id, msg) => bad.push(`${rule} [${id}] ${msg}`);

const docs = read("docs/TRANSITION_FX.md"), readme = read("src/transitions/README.md");
const BLUE = "#2A8CFF";

for (const id of Object.keys(TRANSITIONS)) {
  const T = TRANSITIONS[id];
  const slug = id === "pixel-wipe" ? "transition-demo" : `transition-demo-${id}`;

  // T10: regenerate, and compare with what is on disk (before it is overwritten)
  const files = [`compositions/${slug}.html`, `compositions/${slug}/a.html`, `compositions/${slug}/b.html`];
  const before = files.map((f) => (fs.existsSync(path.join(ROOT, f)) ? read(f) : null));
  buildDemo(id);
  const [parent, a, b] = files.map(read);
  const after = [parent, a, b];
  before.forEach((old, i) => { if (old !== null && old !== after[i]) fail("T10", id, `${files[i]} was stale (regenerated now; stage it)`); });

  // T1
  for (const m of validate(T)) fail("T1", id, m);

  // T2
  if (!docs.includes(id)) fail("T2", id, "not described in docs/TRANSITION_FX.md");
  if (!readme.includes("`" + id + "`")) fail("T2", id, "not in the src/transitions/README.md table");

  const part = T.parent({ params: T.params, W: 1920, H: 1080 });

  // T3: a wipe is a mask
  if (T.semantics.kind === "wipe") {
    if (!/clip-path:\s*url\(#/.test(part.groupBStyle) || !/<clipPath/.test(part.html)) fail("T3", id, "a wipe must clip the incoming group with a mask (clip-path:url(#..) on B + a <clipPath>)");
    if (/class="flash"/.test(part.html) || /flashEl/.test(part.frameJS)) fail("T3", id, "a wipe must not use a full-frame flash overlay; the flash belongs on the sweep front");
    if (/fillRect\([^)]*(1920|W\b)[^)]*(1080|H\b)/.test(part.frameJS)) fail("T3", id, "paints a full-frame fill over the scenes");
  }

  // T4: one adjustment layer, around both compositions and the mask
  const iAdj = parent.indexOf('id="adj"'), iA = parent.indexOf('id="gA"'), iB = parent.indexOf('id="gB"');
  const iCursor0 = parent.indexOf('class="cursor"'), iRingsEl = parent.indexOf('id="rings"');
  const iAdjEnd = parent.indexOf('<div class="cursor"');
  if (iAdj < 0 || !(iAdj < iA && iA < iB && iB < iCursor0)) fail("T4", id, "one #adj must wrap #gA and #gB (and the mask), with the pointer outside it");
  // the click rings are their OWN LAYER inside each group: above the stage, BELOW the composition's components
  if ((parent.match(/id="adj"/g) || []).length > 1) fail("T4", id, "more than one adjustment layer");
  if (!/gsap\.set\(adj,\s*\{\s*scale:/.test(parent)) fail("T4", id, "the adjustment layer must carry the scale");
  for (const [n, h] of [["a.html", a], ["b.html", b]]) if (/ZOOM_ADD\s*=\s*__fx2|rushAt|kickAt/.test(h.replace(/const __fx2[\s\S]*?\n\s*\n/, "").split("const SPEC")[1] || "")) fail("T4", id, `${n} applies its own rush/recoil; the adjustment layer owns it`);

  // T5: THREE LAYERS, bottom to top: the composite (3D elements) < the click rings < the pointer. The rings are one
  // full-screen canvas OUTSIDE both groups and the adjustment layer, so they persist through a transition.
  if (iRingsEl < 0) fail("T5", id, "the click rings need their own layer (a #rings canvas)");
  else {
    if (!(iRingsEl > parent.indexOf('id="gB"') && iRingsEl < iCursor0)) fail("T5", id, "#rings must come after both groups and before the cursor");
    const adjEnd = (() => { let d = 0, i = parent.indexOf('id="adj"'); i = parent.lastIndexOf("<div", i); for (const m of parent.slice(i).matchAll(/<div\b|<\/div>/g)) { d += m[0] === "</div>" ? -1 : 1; if (d === 0) return i + m.index; } return -1; })();
    if (iRingsEl < adjEnd) fail("T5", id, "#rings is inside the adjustment layer: a transition could clip or cover it");
    const zR = +((parent.match(/\.ringsc\{[^}]*z-index:(\d+)/) || [])[1] ?? NaN), zC = +((parent.match(/\.cursor\{z-index:(\d+)/) || [])[1] ?? NaN), zA = +((parent.match(/\.adj\{[^}]*z-index:(\d+)/) || [])[1] ?? NaN);
    if (!(zC > zR && zR > zA && zA > 0)) fail("T5", id, `layer order must be cursor(${zC}) > rings(${zR}) > composite(${zA})`);
  }
  // T5: z-order and containment
  const z = (re) => { const m = parent.match(re); return m ? +m[1] : null; };
  const zc = z(/\.cursor\{z-index:(\d+)/), zadj = z(/\.adj\{[^}]*z-index:(\d+)/);
  const zf = z(/\.flash\{[^}]*z-index:(\d+)/) ?? 0;
  if (!(zc > zf && zc > zadj && zadj > 0)) fail("T5", id, `the pointer must be above everything: cursor(${zc}) > flash(${zf}) and > adjustment layer(${zadj})`);
  const iCursor = parent.indexOf('class="cursor"');
  if (!(iCursor > iB)) fail("T5", id, "the cursor must come after (above) both groups, outside #adj");
  // a click on a card rings on THAT CARD'S OWN PLANE: a canvas inside the card, above its face and below an activated row
  if (/cursor/.test(part.html + part.frameJS + part.setupJS)) fail("T5", id, "a transition must never touch the cursor; it lives on its own layer");

  // T6: nothing fades
  const sceneJS = [a, b].map((h) => h.split("<script>").slice(1).join("")).join("\n");
  const opacityWrites = (sceneJS + parent).split("\n").filter((l) => /opacity\s*[:=]|autoAlpha/.test(l) && !/swap-ok|flare-ok|fade-ok|flashEl/.test(l) && !/^\s*(\/\/|\*)/.test(l));
  const tweened = opacityWrites.filter((l) => /(from|to|fromTo|set)\(/.test(l) || /autoAlpha/.test(l));
  for (const l of tweened) fail("T6", id, `fades content: ${l.trim().slice(0, 100)}`);
  if (/transition\s*:\s*[^;{]*(opacity|all)/.test(a + b + parent)) fail("T6", id, "a CSS opacity transition");
  if (/transition\s*:/.test(part.css)) fail("T6", id, "a CSS transition in the transition's own CSS");

  // T7: extrusion - and OWNERSHIP: every slab host owns its slices
  const dots = (a.match(/class="dot x3d"/g) || []).length;
  if (/class="dot"/.test(a)) fail("T7", id, "a dot is a flat plane (no x3d slab host)");
  if (dots < 3) fail("T7", id, `expected the lab's dots to be slabs, found ${dots}`);
  const rows = (b.match(/class="trow x3d"/g) || []).length, tbl = (b.match(/class="tbl x3d"/g) || []).length, sats = (b.match(/class="sat x3d"/g) || []).length, cuts = (b.match(/class="sat cut x3d"/g) || []).length;
  if (tbl !== 1 || rows < 3) fail("T7", id, `sample B must be the table component: ${tbl} table slab(s), ${rows} row slab(s)`);
  if (sats < 2 || cuts !== 1) fail("T7", id, `sample B must have its family around the table: ${sats} satellites, ${cuts} ear cutout(s) (one)`);
  const hosts = dots + rows + tbl + sats + cuts;
  if ((a + b).match(/class="(?:[\w-]+ )*xl"/g)?.length < hosts * 3) fail("T7", id, "slab hosts without slices");
  if (/\.(dot|tbl|trow|sat)\{[^}]*overflow\s*:\s*hidden/.test(a + b)) fail("T7", id, "a slab host has overflow:hidden (flattens the sides)");
  if (!/transform-style:preserve-3d/.test(a) || !/transform-style:preserve-3d/.test(b)) fail("T7", id, "preserve-3d missing");
  if (/--slab:/.test(a + b + parent)) fail("T7", id, "an unresolved --slab: marker (a card that was never turned into an owned slab)");
  if (!/\.x3d\{[^}]*position:relative/.test(a + b)) fail("T7", id, "slab hosts must be position:relative so they OWN their slices (otherwise the slices attach to a layer behind them)");

  // T11: the LIP is derived from each element's own colour (OKLCH, at render time), never hard coded
  for (const [n, h] of [["a.html", a], ["b.html", b]]) {
    if (!/__lip\.apply\(root\)/.test(h)) fail("T11", id, `${n} has slabs but never derives their lip (__lip.apply(root))`);
    if (/<i class="xl"[^>]*(background|#[0-9a-fA-F]{3,6}|rgb)/.test(h.replace(/<style[\s\S]*?<\/style>/g, ""))) fail("T11", id, `${n} has a slice with a hard-coded colour`);
  }

  // T8: the click rings: three 8-bit pixel rings, white core / blue stroke / black outline
  const D = makeDemo(id);
  if (D.rings.count !== 3) fail("T8", id, `rings.count must be 3 (is ${D.rings.count})`);
  if (!(D.rings.cell >= 3 && D.rings.cell <= 8)) fail("T8", id, `rings.cell (the pixel size) must be 3..8 px (is ${D.rings.cell}): 8-bit, not a hairline`);
  const spec = (parent.match(/"rings":\{[^}]*\}/g) || []);
  if (!spec.length) fail("T8", id, "no click ring colours found in the pointer spec");
  for (const m of spec) {
    const c = JSON.parse("{" + m + "}").rings;
    if (c.core.toUpperCase() !== "#FFFFFF") fail("T8", id, `the ring's inner colour must be white on every item (is ${c.core})`);
    if (c.stroke.toUpperCase() !== BLUE) fail("T8", id, `the ring's pixel stroke must be the brand blue (is ${c.stroke})`);
    if (c.outline.toUpperCase() !== "#0A0F1A") fail("T8", id, `the ring's outer stroke must be the system's black (is ${c.outline})`);
  }

  // T9: determinism
  const everything = [part.css, part.html, part.setupJS, part.frameJS, a, b, parent].join("\n").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/[^\n]*/g, "$1");
  const nondet = everything.match(/Math\.random|Date\.now|performance\.now|new Date\(|fetch\(|setTimeout|setInterval/g);
  if (nondet) fail("T9", id, `non-deterministic: ${[...new Set(nondet)].join(", ")}`);
}

if (bad.length) {
  console.error(`✗ transition lint: ${bad.length} violation(s)\n`);
  for (const m of bad) console.error("  " + m);
  console.error("\nSee docs/TRANSITION_FX.md (the method) and src/transitions/README.md (the contract).");
  process.exit(1);
}
console.log(`✓ transition lint clean (${Object.keys(TRANSITIONS).length} transitions, 11 rules, samples regenerated)`);
