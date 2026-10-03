#!/usr/bin/env node
/**
 * Design-system lint for the ListeningKit HyperFrames series.
 *
 * Enforces the rules in DESIGN_SYSTEM.md. Run by lefthook on pre-commit, and
 * available as `npm run lint:design`.
 *
 * Every rule here exists because it was broken at least once. Each carries the
 * failure it prevents, because a lint rule nobody remembers the reason for gets
 * deleted.
 *
 * Scope: the SOURCE files that generate compositions (src/scenes.mjs,
 * src/lkdesign.mjs, src/lkchrome.mjs, src/storyboards.mjs, src/lkicons.mjs).
 * Generated `compositions/**` HTML is excluded — it is build output, and a rule
 * that fires on generated code trains people to ignore it.
 *
 * Repo hygiene (review frames, stray root files) is a DIFFERENT concern and lives
 * in scripts/lint-repo.mjs. Mixing the two would mean one script has both a
 * line-based scanner and a git-level scanner, and the git-level one cannot work
 * on a single staged file.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, NOT new URL(...).pathname. On Windows the pathname is
// "/C:/Users/..." — a leading slash before the drive letter — so path.join
// produced a path that never existed, every `fs.existsSync` returned false, and
// the lint passed vacuously on every file. A lint that cannot fail is worse than
// no lint, because it reads as a clean bill of health.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SOURCES = [
  "src/scenes.mjs",
  "src/lkdesign.mjs",
  "src/lkchrome.mjs",
  "src/lkicons.mjs",
  "src/storyboards.mjs",
];

/** Opaque fills that must not appear on a surface. */
const BANNED_FILL_TOKENS = [
  "C.slate50",
  "C.chip",
  "C.selected",
  "C.panel",
];

/** rgba() alphas that are banned specifically as a CARD/BAR surface fill. */
const BANNED_ALPHA = [0.07, 0.08, 0.1, 0.14];

const RULES = [
  {
    id: "no-opaque-opacity",
    test: (line, file) => {
      // A glass panel is allowed to be translucent. So is an empty bar track —
      // it has nothing behind it to blend into. A CARD is not. Catch the shapes a
      // card actually takes in this codebase.
      if (!/card\(|\.jcard|\.sp\b|frost\(/.test(line)) return null;
      if (/glass\(/.test(line)) return null;
      // The glass() signature itself: a translucent panel with a translucent
      // border is the sanctioned glass treatment, not an opaque card.
      if (/rgba\(255,\s*255,\s*255,\s*0\.10\)[\s\S]{0,40}rgba\(255,\s*255,\s*255,\s*0\.30\)/.test(line)) return null;
      const m = line.match(/rgba\([^)]*?,\s*(0?\.\d+)\s*\)/);
      if (m && BANNED_ALPHA.includes(parseFloat(m[1]))) {
        return `translucent card fill rgba(...${m[1]}) — use a solid surface or glass()`;
      }
      return null;
    },
    why: "an alpha on a fill near the backdrop value costs contrast and buys no depth (DESIGN_SYSTEM 1.1)",
  },
  {
    id: "no-opaque-token-fill",
    test: (line) => {
      if (!/card\(|\.jcard|\.sp\b/.test(line)) return null;
      const bad = BANNED_FILL_TOKENS.find((t) => line.includes(t));
      return bad ? `card fill uses opaque token ${bad}` : null;
    },
    why: "these tokens are near-white and vanish on a white stage (DESIGN_SYSTEM 1.1)",
  },
  {
    id: "no-tracking",
    test: (line) => {
      // Positive tracking is banned on DISPLAY type. It is deliberately allowed
      // on uppercase micro-labels at 20px and under, where it aids legibility and
      // is part of the brand's eyebrow treatment (OnboardingSteps.tsx:627). The
      // rule is scoped rather than absolute because a blanket ban would strip
      // the eyebrow treatment the product actually ships.
      const m = line.match(/letter-spacing:\s*(-?[\d.]+)em/);
      if (!m) return null;
      if (parseFloat(m[1]) <= 0) return null;
      const isMicroLabel = /\.eyebrow|\.label|\.kv|\.node \.nk|\.apichip/.test(line);
      if (isMicroLabel && parseFloat(m[1]) <= 0.2) return null;
      return `positive letter-spacing ${m[1]}em on display type — tracking is 0 or negative (DESIGN_SYSTEM 1.3)`;
    },
    why: "a tracked wordmark is not the wordmark (DESIGN_SYSTEM 1.3)",
  },
  {
    id: "no-monospace",
    test: (line) => {
      // "monospace" has no word boundary after "mono", so `mono\b` never matched
      // `ui-monospace` or `monospace` — the two most common ways this rule gets
      // violated. Match the substring.
      if (!/font-family\s*:/i.test(line)) return null;
      if (/\bmono\b|monospace|Space Mono|JetBrains|IBM Plex Mono|Courier/i.test(line)) {
        if (!/aliased to sans|no monospace/i.test(line)) {
          return "monospace font-family — mono is aliased to sans (DESIGN_SYSTEM 1.2)";
        }
      }
      return null;
    },
    why: "the product aliases mono to sans on purpose; one voice (DESIGN_SYSTEM 1.2)",
  },
  {
    id: "no-squircle",
    test: (line) => {
      if (/clip-path:\s*url\(/.test(line) && !/squircle clip-path was|replaced|no squircle/i.test(line)) {
        return "SVG clip-path squircle — a squircle is a clip-path on a FIXED-size box (DESIGN_SYSTEM 1.6)";
      }
      return null;
    },
    why: "clip-path on a content-sized card crops the fill and smears the ring mask (DESIGN_SYSTEM 1.6)",
  },
  {
    id: "no-logo-invert",
    test: (line) => {
      // Skip CSS/JS comment lines. Rules here routinely name the exact token
      // they ban in the comment explaining WHY it was removed — otherwise every
      // fixed bug re-trips its own rule.
      if (/^\s*(\/\*|\*|\/\/)/.test(line)) return null;
      if (/invert\(1\)/.test(line) && /logo|ecmark|lockup/i.test(line)) {
        if (!/flatten|never filter|used to be here|both the background/i.test(line)) {
          return "filter invert on the logo — brightness(0) invert(1) flattens blue bg AND white mark to solid white (DESIGN_SYSTEM 1.7)";
        }
      }
      return null;
    },
    why: "the end card shipped a blank white square because of this filter (DESIGN_SYSTEM 1.7)",
  },
];

/* Resolve the real export names so the undefined-token rule is not guesswork.
   Every one of these shipped as a literal `undefined` in the output CSS or in an
   inline style, which the browser silently discards - so the rule failed OPEN
   and the frame was quietly wrong with nothing in the build to explain it:
     TYPE.kv   -> never existed -> `font:undefined` on every record key label
     R.input   -> never existed -> `border-radius:undefinedpx`
     R.badge   -> never existed -> `border-radius:undefinedpx` on the end card
     glass(430, 128, R.card) -> args transposed -> a 128px lozenge AND a stray
                  ";20;" declaration in the same style attribute */
const { C, R, TYPE, M, SHADOW, DITHER } = await import("../src/lkdesign.mjs");
const EXPORTED = new Set([
  ...Object.keys(C),
  ...Object.keys(R),
  ...Object.keys(TYPE),
  ...Object.keys(M),
  ...Object.keys(SHADOW),
  ...Object.keys(DITHER),
]);

RULES.push({
  id: "no-undefined-token",
  test: (line) => {
    if (/^\s*(\/\*|\*|\/\/)/.test(line)) return null;
    for (const m of line.matchAll(/\b(?:TYPE|R|C|M|SHADOW|DITHER)\.(\w+)/g)) {
      if (!EXPORTED.has(m[1])) {
        return `\`${m[0]}\` is not exported by src/lkdesign.mjs - it emits a literal "undefined" into the composition, which the browser drops silently`;
      }
    }
    return null;
  },
  why: "an undefined design token fails OPEN: no error, no warning, just a quietly wrong frame",
});

let failures = 0;
const report = [];

const SELECTOR = /^\s*(\.[A-Za-z][\w.\-\s]*|#[\w-]+)\s*\{/;

/**
 * Per line, WITH ITS SELECTOR.
 *
 * These files build CSS as multi-line template literals, so a property routinely
 * sits on its own line with its selector two or three lines up. Matching the bare
 * line made rules fire on the wrong unit. Line-only was also wrong in the other
 * direction: splitting on `;` severed `letter-spacing:.2em` from `.eyebrow` and
 * flagged a sanctioned micro-label. So: scan linearly, remember the last selector
 * opened, and test each line against its own text plus that selector.
 */
function scan(rel, text) {
  const lines = text.split(/\r?\n/);
  let selector = "";
  lines.forEach((line, i) => {
    const m = line.match(SELECTOR);
    if (m) selector = m[1].trim();
    const unit = `${selector} ${line}`;
    for (const rule of RULES) {
      const msg = rule.test(unit, rel);
      if (msg) {
        failures++;
        report.push(`  ${rel}:${i + 1}  [${rule.id}] ${msg}`);
      }
    }
  });
}

for (const rel of SOURCES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  scan(rel, fs.readFileSync(abs, "utf8"));
}

if (failures) {
  console.error(`\n✗ design-system lint failed — ${failures} violation${failures === 1 ? "" : "s"}\n`);
  console.error(report.join("\n"));
  console.error(`\nRules: DESIGN_SYSTEM.md\n`);
  process.exit(1);
}

console.log(`✓ design-system lint clean (${RULES.length} rules, ${SOURCES.length} sources)`);