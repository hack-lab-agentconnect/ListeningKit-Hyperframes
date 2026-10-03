import fs from 'node:fs';

const slug = process.argv[2] || 'agency-calls';
const t = JSON.parse(fs.readFileSync(`assets/timing/${slug}.json`, 'utf8'));
const words = t.results.channels[0].alternatives[0].words;

// group into caption cues: break on punctuation or ~9 words
const cues = [];
let cur = [];
for (const w of words) {
  cur.push(w);
  const p = (w.punctuated_word || '').trim();
  const endsSentence = /[.!?]$/.test(p);
  const endsClause = /[,;:]$/.test(p);
  if (cur.length >= 9 || endsSentence || (endsClause && cur.length >= 4)) {
    cues.push(cur);
    cur = [];
  }
}
if (cur.length) cues.push(cur);

console.log('duration', t.metadata.duration, 'cues', cues.length);
for (const [i, c] of cues.entries()) {
  const text = c.map((w) => w.punctuated_word).join(' ').trim();
  console.log(`${c[0].start.toFixed(2)}|${c[c.length - 1].end.toFixed(2)}|${text}`);
}

// anchor lookup
const targets = process.argv.slice(3);
for (const q of targets) {
  const qa = q.toLowerCase();
  for (const [i, c] of cues.entries()) {
    if (c.some((w) => (w.punctuated_word || '').toLowerCase().replace(/[^a-z]/g, '').includes(qa))) {
      console.log(`ANCHOR ${q} -> cue ${i} @ ${c[0].start.toFixed(2)}s : ${c.map((w) => w.punctuated_word).join(' ')}`);
      break;
    }
  }
}