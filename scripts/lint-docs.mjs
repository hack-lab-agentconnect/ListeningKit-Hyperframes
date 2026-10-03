#!/usr/bin/env node
// lint-docs - the documentation tree mirrors the source (docs/naming-conventions.md).
//
//   node scripts/lint-docs.mjs
//
//   D1 domains      every directory in docs/ is a known domain (lowercase), with a README.md
//   D2 file names   every doc file in a domain is lowercase kebab-case
//   D3 registered   every camera move, component and transition has docs/{domain}/{id}.md, and every page in a
//                   registry-backed domain names a primitive that exists (or one of the domain's declared extras)
//   D4 sections     every primitive page has the seven sections in order, and a `Lives in:` line whose paths exist
//   D5 index        every domain README lists every page in its directory, and every page it lists exists
//   D6 links        no relative link in docs/ points at a file that does not exist
//
// docs/references/ is vendored third-party material and is exempt; so are the top-level method documents.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MOVES } from "../src/camera/index.mjs";
import { COMPONENTS } from "../src/components/index.mjs";
import { TRANSITIONS } from "../src/transitions/index.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "docs");
const bad = [];
const fail = (id, where, msg) => bad.push(`  ${id} [${where}] ${msg}`);

/** domain -> { ids: the registry's primitives (every one needs a page), extras: pages that are not registry entries } */
const DOMAINS = {
  layers: { ids: null, extras: [] },
  camera: { ids: Object.keys(MOVES), extras: ["director"] },
  pointer: { ids: null, extras: [] },
  motion: { ids: null, extras: [] },
  components: { ids: Object.keys(COMPONENTS), extras: ["anatomy", "layout", "family"] },
  extrusion: { ids: null, extras: [] },
  transitions: { ids: Object.keys(TRANSITIONS), extras: ["speed-ramp"] },
  tooling: { ids: null, extras: [] },
};
const SECTIONS = ["What it is", "When it comes to the composition", "How it works", "How it composes", "Rules and gates", "Related"];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// D1
for (const d of fs.readdirSync(DOCS, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name === "references") continue;
  if (!(d.name in DOMAINS)) fail("D1", `docs/${d.name}`, `unknown domain (known: ${Object.keys(DOMAINS).join(", ")}); add it to the table in docs/naming-conventions.md and to this gate`);
}
for (const dom of Object.keys(DOMAINS)) {
  const dir = path.join(DOCS, dom);
  if (!fs.existsSync(dir)) { fail("D1", `docs/${dom}`, "domain directory is missing"); continue; }
  if (!fs.existsSync(path.join(dir, "README.md"))) { fail("D1", `docs/${dom}`, "missing README.md"); continue; }
  const pages = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => f.slice(0, -3));
  const readme = fs.readFileSync(path.join(dir, "README.md"), "utf8");

  // D2
  for (const p of pages) if (!KEBAB.test(p)) fail("D2", `docs/${dom}/${p}.md`, "doc file names are lowercase kebab-case");

  // D3
  const { ids, extras } = DOMAINS[dom];
  if (ids) {
    for (const id of ids) if (!pages.includes(id)) fail("D3", `docs/${dom}`, `"${id}" is registered in src/ but has no docs/${dom}/${id}.md`);
    for (const p of pages) if (!ids.includes(p) && !extras.includes(p)) fail("D3", `docs/${dom}/${p}.md`, `names no primitive: not in the registry (${ids.join(", ")}) and not a declared extra (${extras.join(", ") || "none"})`);
  }

  // D4
  for (const p of pages) {
    const file = `docs/${dom}/${p}.md`, text = fs.readFileSync(path.join(DOCS, dom, p + ".md"), "utf8");
    let at = -1;
    for (const s of SECTIONS) {
      const i = text.indexOf(`\n## ${s}\n`);
      if (i < 0) { fail("D4", file, `missing section "## ${s}"`); continue; }
      if (i < at) fail("D4", file, `section "${s}" is out of order`);
      at = i;
    }
    if (!text.startsWith(`# ${p}\n`)) fail("D4", file, `the title must be "# ${p}" (the primitive's id)`);
    const lives = text.match(/^\*\*Lives in:\*\* (.+)$/m);
    if (!lives) fail("D4", file, "missing the `**Lives in:**` line");
    else for (const m of lives[1].matchAll(/`([^`]+)`/g)) if (!exists(m[1])) fail("D4", file, `Lives in: \`${m[1]}\` does not exist`);
  }

  // D5
  const listed = [...readme.matchAll(/\]\(\.\/([a-z0-9-]+)\.md\)/g)].map((m) => m[1]);
  for (const p of pages) if (!listed.includes(p)) fail("D5", `docs/${dom}/README.md`, `does not list ${p}`);
  for (const l of listed) if (!pages.includes(l)) fail("D5", `docs/${dom}/README.md`, `lists ${l}, which does not exist`);
}

// D6
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.name === "references" ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".md") ? [path.join(dir, e.name)] : []));
for (const file of walk(DOCS)) {
  const text = fs.readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const m of text.matchAll(/\]\((\.{1,2}\/[^)#\s]+)/g)) {
    const target = path.resolve(path.dirname(file), m[1]);
    if (!fs.existsSync(target)) fail("D6", path.relative(ROOT, file).replace(/\\/g, "/"), `link to ${m[1]} does not exist`);
  }
}

if (bad.length) {
  console.error(`\n✗ docs lint: ${bad.length} violation(s)\n\n${bad.join("\n")}\n\nSee docs/naming-conventions.md.`);
  process.exit(1);
}
const n = Object.keys(DOMAINS).reduce((a, d) => a + fs.readdirSync(path.join(DOCS, d)).filter((f) => f.endsWith(".md") && f !== "README.md").length, 0);
console.log(`✓ docs lint clean (${Object.keys(DOMAINS).length} domains, ${n} primitive pages)`);
