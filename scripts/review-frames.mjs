#!/usr/bin/env node
/**
 * Capture review frames OUTSIDE the repository.
 *
 * Why this exists: review frames used to land in `snapshots/` inside the repo.
 * `.gitignore` listed `*.png`, which hides them from `git status` and therefore
 * from every diff review — so they accumulated silently and one got committed with
 * `git add -f`. The frames are throwaway artefacts of a review pass, they are
 * megabytes, and a stale one in the tree is indistinguishable from a current one.
 *
 * So: frames go to the workspace scratch directory, outside the repo, named by
 * slug and label. `scripts/lint-repo.mjs` fails the commit if any image or any
 * review directory is tracked, and .gitignore keeps them out of the working tree
 * in the first place.
 *
 * Usage:
 *   node scripts/review-frames.mjs --at 94 --no-end --label spine
 *   node scripts/review-frames.mjs --frames 15 --slug agency-prospects
 *   node scripts/review-frames.mjs --at 3,20,45 --out C:\tmp\frames
 *
 * Every argument after -- is forwarded to `hyperframes snapshot` untouched, so any
 * flag that command gains later works here without a change to this file.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

/**
 * Where frames go. Outside the repo by DEFAULT, not by convention — the whole point
 * is that `hyperframes snapshot -o <dir>` will happily write anywhere, including
 * here, and the first version of this project proved that.
 */
const DEFAULT_OUT = process.env.REVIEW_FRAMES_DIR
  || path.resolve(path.dirname(ROOT), "..", ".scratch", "hyperframes-review");

const argv = process.argv.slice(2);
const passthrough = [];
let slug = null;
let label = null;
let out = null;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--slug") slug = argv[++i];
  else if (a === "--label") label = argv[++i];
  else if (a === "--out") out = argv[++i];
  else passthrough.push(a);
}

if (out) {
  const abs = path.resolve(out);
  const inside = abs === ROOT || abs.startsWith(ROOT + path.sep);
  if (inside) {
    console.error(`✗ refusing to write review frames inside the repo: ${abs}`);
    console.error(`  Frames are throwaway review output. Use the default, or pass a path outside the tree.`);
    process.exit(1);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dest = path.join(out || DEFAULT_OUT, [slug, label, stamp].filter(Boolean).join("-"));

fs.mkdirSync(dest, { recursive: true });

// `npm run entry` first: index.html points at whichever composition it names, and a
// snapshot of the wrong entry silently captures the `hyperframes init` scaffold —
// 15 identical black frames. That happened here once already.
const entry = spawnSync(process.execPath, [path.join(ROOT, "scripts", "entry.mjs")], {
  cwd: ROOT,
  stdio: "inherit",
});
if (entry.status !== 0) {
  console.error("✗ could not point index.html at a composition");
  process.exit(entry.status ?? 1);
}

console.log(`\n▸ review frames -> ${dest}\n  (outside the repo; nothing here will ever be committed)\n`);

// Read the pinned CLI version out of the `snapshot` npm script rather than
// hard-coding it here. A second copy of the pin is a second thing to forget at
// upgrade time, and this file would then render frames with a different CLI
// version than `npm run render` uses.
const PIN = (PKG.scripts.snapshot.match(/hyperframes@([\d.]+)/) || [])[1];
if (!PIN) {
  console.error("✗ could not find the pinned hyperframes version in package.json scripts.snapshot");
  process.exit(1);
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const res = spawnSync(npx, ["--yes", `hyperframes@${PIN}`, "snapshot", "-o", dest, ...passthrough], {
  cwd: ROOT,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (res.status !== 0) {
  console.error(`\n✗ snapshot failed (exit ${res.status}). Frames, if any, are in ${dest}\n`);
  process.exit(res.status ?? 1);
}

const frames = fs
  .readdirSync(dest)
  .filter((f) => /\.(png|jpe?g)$/i.test(f));
console.log(`\n✓ ${frames.length} frame(s) in ${dest}`);