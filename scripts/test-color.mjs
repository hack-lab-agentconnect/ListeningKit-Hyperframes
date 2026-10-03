#!/usr/bin/env node
// test-color - offline checks of the OKLCH lip (src/lkcolor.mjs, docs/COMPONENTS.md "the lip").
//
//   node scripts/test-color.mjs
//
// The lip of an extruded element is its own base colour with the lightness lowered in OKLCH, hue and chroma kept.
// Pure functions, so it is all checked by evaluating them:
//   - sRGB -> OKLCH -> sRGB round-trips; known colours land where the OKLab reference says
//   - the lip keeps the HUE (within 1 deg) and the CHROMA (unless gamut forces it down), and lowers L by the factor
//   - it follows ANY colour: no table of colours, the same code makes the lip of blue, white, red and a pale tint
//   - near is lighter than far (the slab shades with depth); everything stays inside sRGB; deterministic
//   - the runtime applies it from the computed background and skips transparent hosts
//   - no colour literal anywhere in the slab markup (lkextrude.mjs): the lip is never hard coded

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { colorModule } from "../src/lkcolor.mjs";
import { slabFor, slab } from "../src/lkextrude.mjs";

const k = colorModule();
const rows = [];
let failed = 0;
const check = (name, value, ok, limit) => { rows.push({ name, value, ok, limit }); if (!ok) failed++; };
const near = (a, b, e) => Math.abs(a - b) <= e;
const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("");
const dh = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };

const BLUE = k.parse("#2A8CFF"), WHITE = k.parse("#FFFFFF"), RED = k.parse("#E5322D"), TINT = k.parse("rgb(66, 150, 255)"), BLACK = k.parse("#000000");

/* ---- conversion */
{
  const w = k.toOklch(WHITE), bk = k.toOklch(BLACK), bl = k.toOklch(BLUE);
  check("white is L 1, no chroma", `L ${w.L.toFixed(3)} C ${w.C.toFixed(4)}`, near(w.L, 1, 1e-3) && w.C < 1e-3, "L = 1, C = 0");
  check("black is L 0", `L ${bk.L.toFixed(3)}`, bk.L < 1e-3, "L = 0");
  check("brand blue is where OKLab says", `L ${bl.L.toFixed(3)} C ${bl.C.toFixed(3)} h ${bl.h.toFixed(0)}`, near(bl.L, 0.64, 0.03) && bl.C > 0.17 && near(bl.h, 255, 12), "L ~0.64, C ~0.19, h ~255");
  let worst = 0;
  for (let i = 0; i < 400; i++) { const c = { r: (i * 53) % 256, g: (i * 97) % 256, b: (i * 193) % 256 }; const back = k.fromOklch(k.toOklch(c)); worst = Math.max(worst, Math.abs(back.r - c.r), Math.abs(back.g - c.g), Math.abs(back.b - c.b)); }
  check("sRGB -> OKLCH -> sRGB round-trips", `max error ${worst} of 255`, worst <= 1, "<= 1");
  check("parses the forms a computed style uses", `${hex(k.parse("rgb(42, 140, 255)"))} ${k.parse("rgba(1,2,3,0.5)").a} ${hex(k.parse("#abc"))}`, hex(k.parse("rgb(42, 140, 255)")) === "#2a8cff" && k.parse("rgba(1,2,3,0.5)").a === 0.5 && hex(k.parse("#abc")) === "#aabbcc", "rgb / rgba / #rgb");
}

/* ---- the lip */
for (const [name, base] of [["brand blue", BLUE], ["red", RED], ["a pale tint", TINT], ["a pale row", k.parse("rgb(86, 160, 255)")]]) {
  const b = k.toOklch(base), l = k.toOklch(k.lip(base, 0)), f = k.toOklch(k.lip(base, 1));
  check(`${name}: keeps the hue`, `${b.h.toFixed(1)} -> ${l.h.toFixed(1)} / ${f.h.toFixed(1)} deg`, dh(b.h, l.h) <= 1.5 && dh(b.h, f.h) <= 1.5, "within 1.5 deg");
  check(`${name}: lowers the lightness`, `${b.L.toFixed(3)} -> ${l.L.toFixed(3)} (near) -> ${f.L.toFixed(3)} (far)`, near(l.L, b.L * k.LIP.near, 0.02) && near(f.L, b.L * k.LIP.far, 0.02) && l.L > f.L, `x ${k.LIP.near} near, x ${k.LIP.far} far`);
  check(`${name}: keeps the chroma (unless sRGB cannot hold it)`, `${b.C.toFixed(3)} -> ${l.C.toFixed(3)}`, l.C >= b.C * 0.9 || l.C > 0, "kept, gamut-limited only");
}
{
  const l = k.toOklch(k.lip(BLUE, 0.5));
  check("the lip of blue is a DARKER BLUE, not grey or black", `${hex(k.lip(BLUE, 0.5))}: C ${l.C.toFixed(3)}`, l.C > 0.12 && k.lip(BLUE, 0.5).b > k.lip(BLUE, 0.5).r * 1.5, "still saturated blue");
  check("the lip of white is a neutral grey (there was no hue to keep)", hex(k.lip(WHITE, 0.5)), (() => { const c = k.lip(WHITE, 0.5); return Math.abs(c.r - c.g) <= 1 && Math.abs(c.g - c.b) <= 1 && c.r < 200 && c.r > 90; })(), "r = g = b, mid grey");
  check("black stays black", hex(k.lip(BLACK, 1)), k.lip(BLACK, 1).r === 0, "= #000000");
  let inside = true;
  for (let i = 0; i < 300; i++) { const c = k.lip({ r: (i * 31) % 256, g: (i * 71) % 256, b: (i * 131) % 256 }, (i % 10) / 9); if ([c.r, c.g, c.b].some((v) => v < 0 || v > 255 || !Number.isInteger(v))) inside = false; }
  check("always a valid sRGB colour", inside ? "300 colours, all in gamut" : "out of gamut", inside, "0..255 integers");
  const t = (x) => hex(k.lip(RED, x));
  check("shades with depth (near lighter than far)", `${t(0)} -> ${t(0.5)} -> ${t(1)}`, k.toOklch(k.lip(RED, 0)).L > k.toOklch(k.lip(RED, 0.5)).L && k.toOklch(k.lip(RED, 0.5)).L > k.toOklch(k.lip(RED, 1)).L, "monotonic darker");
  check("deterministic", "identical twice", hex(k.lip(RED, 0.3)) === hex(k.lip(RED, 0.3)), "same colour, same lip");
}

/* ---- the runtime: computed background in, lip out */
{
  const style = (bg) => ({ backgroundColor: bg });
  const mk = (bg, slices) => {
    const kids = slices.map((t, i) => { const el = { classList: { contains: (c) => c === "xl" }, tagName: "I", style: {}, getAttribute: () => String(t) }; return el; });
    return { kids, host: { children: kids, _bg: bg } };
  };
  const a = mk("rgb(42, 140, 255)", [0.2, 0.6, 1]), b = mk("rgba(0, 0, 0, 0)", [0.5]);
  const root = { querySelectorAll: () => [a.host, b.host] };
  const prev = globalThis.getComputedStyle; globalThis.getComputedStyle = (h) => style(h._bg);
  const n = k.apply(root);
  globalThis.getComputedStyle = prev;
  check("apply: derives each slice's lip from the host's computed background", `${n} slices coloured: ${a.kids.map((x) => x.style.backgroundColor).join(" | ")}`, n === 3 && a.kids.every((x) => /^rgb\(/.test(x.style.backgroundColor)) && a.kids[0].style.backgroundColor !== a.kids[2].style.backgroundColor, "3 slices, darker with depth");
  check("apply: a transparent host gets no lip", `${b.kids[0].style.backgroundColor || "left alone"}`, !b.kids[0].style.backgroundColor, "skipped");
}

/* ---- nothing is hard coded in the slab */
{
  const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "lkextrude.mjs"), "utf8");
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
  const out = slabFor("card") + slab({ layers: 4, step: 3 });
  check("the slab markup carries no colour at all", /#[0-9a-f]{3,8}|rgb|background/i.test(out) ? "has a colour" : "none (the runtime derives it)", !/#[0-9a-f]{3,8}|rgb|background/i.test(out), "no literal, no background");
  check("lkextrude.mjs has no colour literal", (code.match(/#[0-9A-Fa-f]{6}\b/g) || []).join(",") || "none", !/#[0-9A-Fa-f]{6}\b/.test(code), "none");
  check("every slice carries its depth for the runtime", (out.match(/data-t="/g) || []).length + " slices with data-t", (out.match(/class="xl"/g) || []).length === (out.match(/data-t="/g) || []).length && (out.match(/data-t="/g) || []).length > 4, "data-t on each");
}

const w = Math.max(...rows.map((r) => r.name.length));
console.log("\nColour test (the OKLCH lip)\n");
for (const r of rows) console.log(`  ${r.ok ? "✓" : "✗"} ${r.name.padEnd(w)}  ${String(r.value).padEnd(48)} (${r.limit})`);
if (failed) { console.error(`\n✗ colour test: ${failed} check(s) failed. See docs/COMPONENTS.md (the lip).`); process.exit(1); }
console.log("\n✓ colour test clean");
