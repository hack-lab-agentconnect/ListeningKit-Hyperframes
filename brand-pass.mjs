import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "C:\\Users\\0\\.buzz\\listeningkit-object-videos\\compositions";
const files = readdirSync(dir).filter((f) => f.endsWith(".html"));

const fontFace = `
      @font-face { font-family: 'Satoshi'; src: url('assets/fonts/Satoshi-Light.woff') format('woff'); font-weight: 300; font-display: block; }
      @font-face { font-family: 'Satoshi'; src: url('assets/fonts/Satoshi-Regular.woff') format('woff'); font-weight: 400; font-display: block; }
      @font-face { font-family: 'Satoshi'; src: url('assets/fonts/Satoshi-Medium.woff') format('woff'); font-weight: 500; font-display: block; }
      @font-face { font-family: 'Satoshi'; src: url('assets/fonts/Satoshi-Bold.woff') format('woff'); font-weight: 700; font-display: block; }
      @font-face { font-family: 'Satoshi'; src: url('assets/fonts/Satoshi-Black.woff') format('woff'); font-weight: 900; font-display: block; }
`;

const report = [];
for (const f of files) {
  const p = join(dir, f);
  let s = readFileSync(p, "utf8");
  const before = s;

  // 1. Satoshi webfonts
  if (!s.includes("@font-face")) {
    s = s.replace(
      /(\s*\* \{ margin: 0; padding: 0; box-sizing: border-box; \})/,
      "$1" + fontFace
    );
  }
  s = s.replace(
    /font-family: Inter, ui-sans-serif, system-ui, sans-serif;/g,
    "font-family: 'Satoshi', ui-sans-serif, system-ui, sans-serif;"
  );

  // 2. Brand palette from ui-kit globals.css
  s = s.replace(/background: #1558C4;/g, "background: #0D2A4C;");
  s = s.replace(
    /background: linear-gradient\(160deg, #1558C4 0%, #2B7FFF 55%, #2B7FFF 100%\);/g,
    "background: radial-gradient(1500px 950px at 78% 10%, rgba(97,165,240,0.40) 0%, rgba(97,165,240,0) 62%), linear-gradient(160deg, #0D2A4C 0%, #123C6B 52%, #0A2140 100%);"
  );
  s = s.replace(/color: #FFFFFF;/g, "color: #F7F6F1;");
  s = s.replace(
    /\.brand \.dot \{ width: 22px; height: 22px; border-radius: 6px; background: #FFFFFF; \}/g,
    ".brand .dot { width: 22px; height: 22px; border-radius: 6px; background: #61A5F0; }"
  );
  s = s.replace(
    /\.titlewrap \.rule \{ width: 220px; height: 8px; border-radius: 4px; background: #FFFFFF;/g,
    ".titlewrap .rule { width: 220px; height: 8px; border-radius: 4px; background: #61A5F0;"
  );
  s = s.replace(
    /\.caprail \{ position: absolute; bottom: 0; left: 0; height: 10px; background: rgba\(255,255,255,0\.55\);/g,
    ".caprail { position: absolute; bottom: 0; left: 0; height: 10px; background: rgba(97,165,240,0.8);"
  );

  const hasFont = s.includes("@font-face");
  const hasSatoshi = s.includes("font-family: 'Satoshi'");
  const hasInk = s.includes("#0D2A4C");
  const hasGeneric = /#2B7FFF|#1558C4/.test(s);
  report.push({
    file: f,
    changed: s !== before,
    fontFaces: (s.match(/@font-face/g) || []).length,
    satoshi: hasSatoshi,
    ink: hasInk,
    leftoverGeneric: hasGeneric,
  });
  if (s !== before) writeFileSync(p, s, "utf8");
}
console.log(JSON.stringify(report, null, 1));
const bad = report.filter((r) => r.fontFaces !== 5 || !r.satoshi || !r.ink || r.leftoverGeneric);
console.log(bad.length === 0 ? "ALL 16 BRANDED OK" : "PROBLEMS: " + JSON.stringify(bad));