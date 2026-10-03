import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NARR_DIR = path.join(ROOT, "narrations");
const AUDIO_DIR = path.join(ROOT, "compositions", "assets", "audio");
const TIMING_DIR = path.join(ROOT, "assets", "timing");
fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(TIMING_DIR, { recursive: true });

const DG = process.env.DEEPGRAM_API_KEY ?? fs.readFileSync("C:/Users/0/.buzz/.secrets/deepgram.key", "utf8").trim();
const VOICE = process.env.DEEPGRAM_VOICE ?? "aura-2-thalia-en";
const only = process.argv.slice(2);

async function dgSpeak(text) {
  const r = await fetch(`https://api.deepgram.com/v1/speak?model=${VOICE}&encoding=mp3`, {
    method: "POST",
    headers: { Authorization: `Token ${DG}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(`speak ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Deepgram caps a single TTS request, so speak the script in sentence-safe chunks and concat the mp3 frames. */
function speakChunks(text, limit = 1400) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const chunks = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > limit && cur) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

async function speakAll(text) {
  const parts = [];
  for (const c of speakChunks(text)) {
    parts.push(await dgSpeak(c));
    await new Promise((r) => setTimeout(r, 150));
  }
  return Buffer.concat(parts);
}

async function dgTranscribe(buf) {
  const r = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&punctuate=true&smart_format=true&utterances=true", {
    method: "POST",
    headers: { Authorization: `Token ${DG}`, "Content-Type": "audio/wav" },
    body: buf,
  });
  if (!r.ok) throw new Error(`listen ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

const files = fs
  .readdirSync(NARR_DIR)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !only.length || only.includes(f.replace(/\.json$/, "")))
  .sort();

for (const file of files) {
  const meta = JSON.parse(fs.readFileSync(path.join(NARR_DIR, file), "utf8"));
  const audioPath = path.join(AUDIO_DIR, `${meta.slug}.mp3`);
  const timingPath = path.join(TIMING_DIR, `${meta.slug}.json`);

  let buf;
  if (fs.existsSync(audioPath) && !process.env.FORCE) {
    buf = fs.readFileSync(audioPath);
    console.log(`${meta.slug}: reusing existing audio (${buf.length} bytes)`);
  } else {
    const chunks = [];
    for (const p of meta.narration.paragraphs) {
      const say = (p.say ?? p.text).trim();
      if (!say) continue;
      chunks.push(say);
      await new Promise((r) => setTimeout(r, 120));
    }
    const text = chunks.join(" ");
    buf = await speakAll(text);
    fs.writeFileSync(audioPath, buf);
    console.log(`${meta.slug}: synthesised ${text.split(/\s+/).length} words -> ${(buf.length / 1024).toFixed(0)} KB mp3`);
  }

  if (fs.existsSync(timingPath) && !process.env.FORCE) {
    console.log(`${meta.slug}: reusing existing timing`);
    continue;
  }
  const timing = await dgTranscribe(buf);
  fs.writeFileSync(timingPath, JSON.stringify(timing, null, 2), "utf8");
  const dur = timing.metadata?.duration;
  console.log(`${meta.slug}: transcribed ${dur}s`);
}
