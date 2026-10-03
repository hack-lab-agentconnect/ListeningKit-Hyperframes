#!/usr/bin/env node
/**
 * Authoring helper: where, in the real narration, does each idea start?
 *
 * Beats are placed at sentence and clause starts from the Deepgram word timings. Guessing
 * those times is how a scene ends up showing a thing 3 s before or after it is said.
 *
 *   npm run times -- sentences agency-calls          every sentence: start, length, text
 *   npm run times -- find agency-calls "the from number" "recording url"
 *                                                    first time each phrase starts
 *   npm run times -- beats agency-calls              the CURRENT storyboard: each beat's
 *                                                    start, duration, kind, and what is
 *                                                    said while it is on screen
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [mode, slug, ...rest] = process.argv.slice(2);

if (!mode || !slug) {
  console.error('usage: npm run times -- <sentences|find|beats> <slug> ["phrase" ...]');
  process.exit(1);
}

const timingFile = path.join(ROOT, "assets", "timing", `${slug}.json`);
if (!fs.existsSync(timingFile)) {
  console.error(`✗ no timing for "${slug}" (assets/timing/${slug}.json)`);
  process.exit(1);
}
const words = JSON.parse(fs.readFileSync(timingFile, "utf8")).results.channels[0].alternatives[0].words;
const pad = (n, w) => n.toFixed(1).padStart(w);
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, "");

if (mode === "sentences") {
  let cur = [];
  const flush = () => {
    if (!cur.length) return;
    console.log(`${pad(cur[0].start, 6)} ${pad(cur[cur.length - 1].end - cur[0].start, 4)}  ${cur.map((c) => c.punctuated_word).join(" ")}`);
    cur = [];
  };
  for (const w of words) {
    cur.push(w);
    if (/[.?!]$/.test(w.punctuated_word)) flush();
  }
  flush();
} else if (mode === "find") {
  for (const phrase of rest) {
    const toks = norm(phrase).split(" ");
    let found = null;
    for (let i = 0; i < words.length && found === null; i++) {
      if (toks.every((t, j) => norm(words[i + j]?.word || "") === t)) found = words[i].start;
    }
    console.log(`${found === null ? "  none" : found.toFixed(2).padStart(7)}  ${phrase}`);
  }
} else if (mode === "beats") {
  const { ARCS } = await import("../src/storyboards.mjs");
  const arc = ARCS[slug];
  if (!arc) {
    console.error(`✗ no storyboard "${slug}"`);
    process.exit(1);
  }
  const seq = [...arc.beats, arc.outro];
  arc.beats.forEach((b, i) => {
    const end = seq[i + 1].t;
    const said = words.filter((w) => w.start >= b.t - 0.05 && w.start < end).map((w) => w.punctuated_word).join(" ");
    console.log(`#${String(i).padStart(2)} t=${String(b.t).padEnd(6)} ${(end - b.t).toFixed(1).padStart(4)}s  ${b.kind}/${b.tone}${b.fx ? ` fx=${b.fx}` : ""}`);
    console.log(`      ${said.slice(0, 150)}${said.length > 150 ? "…" : ""}`);
  });
} else {
  console.error(`✗ unknown mode "${mode}"`);
  process.exit(1);
}
