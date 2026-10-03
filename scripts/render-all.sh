#!/usr/bin/env bash
# Batch-render every arc that HAS a storyboard, one mp4 per slug.
#
# Counterpart to render-all.ps1 for the Linux render machine. It derives the slug
# list from src/storyboards.mjs (never a hard-coded list), and renders only arcs
# that exist — a narration with no arc yet is reported and skipped, not a hard
# abort, because the object set is being filled in incrementally and the arcs that
# DO exist still need to come out.
#
# Rendered mp4s land in renders/ at the repo root, which is gitignored: this repo
# ships the compositions, not the video.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CLI="$(node -e "const p=require('./package.json');console.log((p.scripts.render.match(/hyperframes@([\\d.]+)/)||[])[1]||'')")"
if [[ -z "$CLI" ]]; then echo "✗ no pinned hyperframes version in package.json"; exit 1; fi

mkdir -p renders
LOG="renders/render-all.log"
echo "=== render all started $(date -Is)  cli=$CLI ===" | tee -a "$LOG"

# Slugs come from the storyboard, not from a list in this file.
mapfile -t SLUGS < <(node -e "import('./src/storyboards.mjs').then(m=>Object.keys(m.ARCS).forEach(s=>console.log(s)))")
if [[ ${#SLUGS[@]} -eq 0 ]]; then echo "✗ no arcs found in src/storyboards.mjs"; exit 1; fi
echo "=== ${#SLUGS[@]} arcs: ${SLUGS[*]} ===" | tee -a "$LOG"

# Narrations with no arc yet are a known, explicit gap — report and continue.
for f in narrations/*.json; do
  base="$(basename "$f" .json)"
  [[ " ${SLUGS[*]} " == *" $base "* ]] || echo "--- note: no storyboard arc for $base (skipped)" | tee -a "$LOG"
done

for s in "${SLUGS[@]}"; do
  out="renders/$s.mp4"
  if [[ -s "$out" && $(stat -c%s "$out") -gt 1000000 ]]; then
    echo "$s SKIP (exists)" | tee -a "$LOG"; continue
  fi
  echo "--- $s render start $(date +%H:%M:%S)" | tee -a "$LOG"
  node scripts/entry.mjs "$s" >/dev/null
  npx --yes "hyperframes@$CLI" render --output "$out" 2>&1 | tail -3 | tee -a "$LOG"
  echo "--- $s render end $(date +%H:%M:%S)" | tee -a "$LOG"
done
echo "=== render all finished $(date -Is) ===" | tee -a "$LOG"
