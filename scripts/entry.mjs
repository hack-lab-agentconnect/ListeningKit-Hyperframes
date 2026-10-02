#!/usr/bin/env node
/**
 * Point the project entry (`index.html`) at a composition.
 *
 * HyperFrames resolves the entry from the project root, and `snapshot` / `render`
 * / `check` all read it from there. The real compositions live in
 * `compositions/<slug>.html` because each beat is its own sub-composition. So
 * without this, every root-level command silently captures the `hyperframes init`
 * scaffold — a black frame with the word "Title" on it.
 *
 * That is not hypothetical: it is exactly what happened. A snapshot run produced
 * 15 identical black frames that were nearly posted as the scene review.
 *
 * Usage: node scripts/entry.mjs [slug]   (default: agency-prospects)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2] || "agency-prospects";
const src = path.join(ROOT, "compositions", `${slug}.html`);
const dest = path.join(ROOT, "index.html");

if (!fs.existsSync(src)) {
  console.error(`✗ no such composition: compositions/${slug}.html`);
  process.exit(1);
}

fs.copyFileSync(src, dest);
const id = (fs.readFileSync(dest, "utf8").match(/data-composition-id="([^"]+)"/) || [])[1];
console.log(`✓ index.html → compositions/${slug}.html (id: ${id})`);