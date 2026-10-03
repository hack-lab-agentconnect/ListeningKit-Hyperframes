import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const NARR_DIR = path.join(ROOT, "narrations");
const ASSET_DIR = path.join(ROOT, "assets");
const COMP_DIR = path.join(ROOT, "compositions");
const BASE = "https://twenty.inferencesaver.com/objects";

for (const d of [ASSET_DIR, COMP_DIR, path.join(COMP_DIR, "assets", "audio"), path.join(ASSET_DIR, "timing")]) {
  fs.mkdirSync(d, { recursive: true });
}

const BLUE = "#2B7FFF";
const BLUE_DEEP = "#1558C4";
const INK = "#FFFFFF";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(s) {
  return esc(s).replace(/"/g, "&quot;");
}

/** Group word-level timings into caption chunks of at most maxWords words. */
function chunkCaptions(words, maxWords = 9, maxChars = 62) {
  const out = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    const text = cur.map((x) => x.punctuated_word ?? x.word).join(" ");
    if (cur.length >= maxWords || text.length >= maxChars || /[.!?]$/.test(text)) {
      out.push({
        start: cur[0].start,
        end: cur[cur.length - 1].end,
        text,
      });
      cur = [];
    }
  }
  if (cur.length) {
    const text = cur.map((x) => x.punctuated_word ?? x.word).join(" ");
    out.push({ start: cur[0].start, end: cur[cur.length - 1].end, text });
  }
  // Extend each caption to the next caption's start so there is no dead air on screen.
  for (let i = 0; i < out.length - 1; i++) out[i].end = out[i + 1].start;
  return out;
}

/** Map narration paragraphs onto the audio clock so a card per paragraph can be timed. */
function planCards(narration, captions) {
  const audioDuration = captions[captions.length - 1].end;
  const paras = narration.paragraphs.filter((p) => (p.body ?? "").trim().length);
  const weights = paras.map((p) => {
    const spoken = p.say ? p.say.trim().split(/\s+/).length : 0;
    return Math.max(spoken, Math.floor((p.body ?? "").split(/\s+/).length * 0.55));
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const cards = [];
  let t = 0;
  paras.forEach((p, i) => {
    const dur = i === paras.length - 1 ? audioDuration - t : (weights[i] / total) * audioDuration;
    cards.push({
      eyebrow: p.eyebrow ?? "",
      heading: p.heading ?? "",
      body: (p.body ?? "").trim(),
      start: t,
      duration: Math.max(dur, 1.5),
    });
    t += dur;
  });
  return { audioDuration, cards };
}

function renderComposition(meta, plan) {
  const id = meta.slug;
  const n = meta.narration;
  const INTRO = 4;
  const OUTRO = 4;
  const total = INTRO + plan.audioDuration + OUTRO;

  const cardHtml = plan.cards
    .map((c, i) => {
      const start = (INTRO + c.start).toFixed(3);
      const dur = c.duration.toFixed(3);
      return `        <div class="clip card" data-start="${start}" data-duration="${dur}" data-track-index="1">
          <div class="eyebrow">${esc(c.eyebrow)}</div>
          <h2 class="heading">${esc(c.heading)}</h2>
          <p class="body">${esc(c.body)}</p>
        </div>`;
    })
    .join("\n");

  const capHtml = plan.captions
    .map(
      (c, i) => `        <div class="clip cap" data-start="${(INTRO + c.start).toFixed(3)}" data-duration="${(c.end - c.start).toFixed(3)}" data-track-index="3"><span>${esc(c.text)}</span></div>`,
    )
    .join("\n");

  const bullets = (n.keyFields ?? [])
    .map((f) => `          <li>${esc(f)}</li>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Inter"; src: local("Inter"), local("Inter-Regular"); }
      @font-face { font-family: "StackMono"; src: local("Consolas"), local("Cascadia Mono"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: ${BLUE_DEEP}; }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: linear-gradient(160deg, ${BLUE_DEEP} 0%, ${BLUE} 55%, ${BLUE} 100%); color: ${INK}; }
      .clip { position: absolute; inset: 0; }
      .brand { position: absolute; top: 64px; left: 96px; display: flex; align-items: center; gap: 18px; opacity: 0.92; }
      .brand .dot { width: 22px; height: 22px; border-radius: 6px; background: ${INK}; }
      .brand .label { font-size: 30px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
      .card { display: flex; flex-direction: column; justify-content: center; padding: 150px 190px 230px; }
      .eyebrow { font-size: 30px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.85; margin-bottom: 26px; }
      .heading { font-size: 82px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.06; margin-bottom: 34px; max-width: 1500px; }
      .body { font-size: 40px; line-height: 1.42; font-weight: 500; max-width: 1420px; opacity: 0.96; }
      .cap { display: flex; align-items: flex-end; justify-content: center; padding: 0 240px 84px; }
      .cap span { display: inline-block; max-width: 1300px; text-align: center; font-size: 34px; line-height: 1.35; font-weight: 600; padding: 14px 28px; border-radius: 14px; background: rgba(6, 28, 62, 0.62); }
      .titlewrap { display: flex; flex-direction: column; justify-content: center; padding: 0 190px; }
      .titlewrap .object { font-size: 130px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.02; }
      .titlewrap .api { font-family: "StackMono", ui-monospace, monospace; font-size: 40px; opacity: 0.85; margin-top: 26px; }
      .titlewrap .rule { width: 220px; height: 8px; border-radius: 4px; background: ${INK}; margin: 44px 0; }
      .titlewrap .count { font-size: 40px; font-weight: 600; opacity: 0.95; }
      .slidelist { display: flex; flex-direction: column; justify-content: center; padding: 140px 190px; }
      .slidelist h2 { font-size: 72px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 30px; }
      .slidelist ul { list-style: none; display: flex; flex-wrap: wrap; gap: 20px; }
      .slidelist li { font-size: 34px; font-weight: 600; padding: 16px 30px; border-radius: 999px; background: rgba(6, 28, 62, 0.42); }
      .outwrap { display: flex; flex-direction: column; justify-content: center; padding: 0 190px; }
      .outwrap .cta { font-size: 68px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 34px; }
      .outwrap .url { font-family: "StackMono", ui-monospace, monospace; font-size: 36px; padding: 22px 34px; border-radius: 14px; background: rgba(6, 28, 62, 0.55); align-self: flex-start; }
      .caprail { position: absolute; bottom: 0; left: 0; height: 10px; background: rgba(255,255,255,0.55); width: 0; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${escAttr(id)}" data-start="0" data-duration="${total.toFixed(3)}" data-width="1920" data-height="1080" data-fps="30">
      <div class="brand"><span class="dot"></span><span class="label">ListeningKit</span></div>

      <div class="clip titlewrap" data-start="0" data-duration="${INTRO}" data-track-index="0">
        <div class="object">${esc(n.title)}</div>
        <div class="api">${esc(n.api)}</div>
        <div class="rule"></div>
        <div class="count">${esc(n.recordCount)} record${n.recordCount === "1" ? "" : "s"}</div>
      </div>

${cardHtml}

      <div class="clip slidelist" data-start="${(INTRO + plan.audioDuration).toFixed(3)}" data-duration="${OUTRO}" data-track-index="1">
        <h2>The fields you will see</h2>
        <ul>
${bullets}
        </ul>
      </div>

${capHtml}

      <audio id="${escAttr(id)}-audio" src="assets/audio/${escAttr(id)}.mp3" data-start="${INTRO}" data-duration="${plan.audioDuration.toFixed(3)}" data-has-audio="true" data-volume="1"></audio>
    </div>
    <script>
      const root = document.getElementById("root");
      const INTRO = ${INTRO};
      const SPEECH = ${plan.audioDuration.toFixed(3)};
      const OUTRO = ${OUTRO};
      const TOTAL = ${total.toFixed(3)};
      const cards = Array.from(document.querySelectorAll(".card"));
      const caps = Array.from(document.querySelectorAll(".cap"));
      const rail = document.querySelector(".caprail");
      if (rail) rail.style.display = "none";
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      window.__timelines["${escAttr(id)}"] = tl;
      tl.fromTo(cards[0], { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.5 }, INTRO);
      for (let i = 1; i < cards.length; i++) {
        const at = INTRO + parseFloat(cards[i].dataset.start) - INTRO;
        tl.fromTo(cards[i], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45 }, at);
      }
      tl.seek(0);
    </script>
  </body>
</html>
`;
}

const results = [];
for (const file of fs.readdirSync(NARR_DIR).filter((f) => f.endsWith(".json")).sort()) {
  const meta = JSON.parse(fs.readFileSync(path.join(NARR_DIR, file), "utf8"));
  const timingPath = path.join(ASSET_DIR, "timing", `${meta.slug}.json`);
  if (!fs.existsSync(timingPath)) {
    console.warn(`skip ${meta.slug}: no timing yet`);
    continue;
  }
  const timing = JSON.parse(fs.readFileSync(timingPath, "utf8"));
  const words = timing.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
  if (!words.length) {
    console.warn(`skip ${meta.slug}: no words in timing`);
    continue;
  }
  const captions = chunkCaptions(words);
  const plan = { ...planCards(meta.narration, captions), captions };
  const html = renderComposition(meta, plan);
  fs.writeFileSync(path.join(COMP_DIR, `${meta.slug}.html`), html, "utf8");
  results.push({ slug: meta.slug, title: meta.narration.title, seconds: +plan.audioDuration.toFixed(2), captions: captions.length, cards: plan.cards.length });
}

fs.writeFileSync(path.join(ROOT, "build-report.json"), JSON.stringify(results, null, 2), "utf8");
console.log(`built ${results.length} compositions`);
for (const r of results) console.log(`  ${r.slug.padEnd(34)} ${String(r.seconds).padStart(6)}s  ${r.cards} cards  ${r.captions} captions`);
