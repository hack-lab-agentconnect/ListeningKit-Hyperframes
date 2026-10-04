// Regenerate src/heroicon-paths.json from an installed @heroicons/react package.
//
// The compositions are built from vendored icon path data so a fresh clone with
// no `node_modules` (and no reachable product repo) still emits every glyph. Run
// this only when the icon set is deliberately upgraded:
//
//   npm i --no-save @heroicons/react@2.2.0
//   node src/vendor-icons.mjs
//
// Key = the icon file's basename without the `Icon` suffix (bare PascalCase), so
// resolution in lkicons.mjs is exact and independent of how a caller spells it.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = "node_modules/@heroicons/react/24/outline";
const dir = path.resolve(process.cwd(), pkg);
if (!fs.existsSync(dir)) {
  console.error(`✗ ${pkg} not found — install @heroicons/react first`);
  process.exit(1);
}
const out = {};
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith("Icon.js")) continue;
  const bare = f.replace(/Icon\.js$/, "");
  const src = fs.readFileSync(path.join(dir, f), "utf8");
  const d = [...src.matchAll(/d:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (d.length) out[bare] = d;
}
const dest = path.resolve(process.cwd(), "src/heroicon-paths.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log(`✓ ${Object.keys(out).length} icons -> ${dest}`);
