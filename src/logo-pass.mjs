import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "C:\\Users\\0\\.buzz\\listeningkit-object-videos\\compositions";
const files = readdirSync(dir).filter((f) => f.endsWith(".html"));

const report = [];
for (const f of files) {
  const p = join(dir, f);
  let s = readFileSync(p, "utf8");
  const before = s;

  s = s.replace(
    ".brand .dot { width: 22px; height: 22px; border-radius: 6px; background: #61A5F0; }",
    ".brand .logo { width: 52px; height: 52px; border-radius: 12px; display: block; }"
  );
  s = s.replace(
    '<div class="brand"><span class="dot"></span><span class="label">ListeningKit</span></div>',
    '<div class="brand"><img class="logo" src="assets/logo.svg" alt="" /><span class="label">ListeningKit</span></div>'
  );

  report.push({ file: f, changed: s !== before, hasImg: s.includes('class="logo"'), leftoverDot: s.includes(".brand .dot") });
  if (s !== before) writeFileSync(p, s, "utf8");
}
console.log(JSON.stringify(report.filter(r => !r.hasImg || r.leftoverDot).length === 0 ? report.map(r=>r.file).length + " ALL LOGO OK" : report, null, 1));
