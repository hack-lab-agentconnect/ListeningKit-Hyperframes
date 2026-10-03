# Workflow

How this repo is built, reviewed, committed and pushed. Written 2026-10-03.

Two things live here and nowhere else:

- **[DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)** — the *visual* rules. Binding, and
  machine-enforced by `scripts/lint-design.mjs`.
- **[COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)** — the motion language: which treatment
  animates which beat, and what data it needs.
- **This file** — the *repo* rules. What may be committed, where output goes, and
  the order of operations for a change. Enforced by `scripts/lint-repo.mjs`.

---

## 1. Layout

```
src/         build + design-system modules (the only place source lives)
  lkdesign.mjs     every colour/radius/shadow/type value, with product provenance
  lkchrome.mjs     shared stylesheet: stage, dither, captions, icons, cursor
  lkicons.mjs      Heroicons 24 outline, read from the product's own package
  scenes.mjs       the scene library — one factory per beat type
  lkmotion.mjs     the treatment library — how a beat is animated (see COMPONENT_LIBRARY.md)
  storyboards.mjs  per-object beat plans, timed against Deepgram word timings
  cues.mjs         narration beat cues
  build-beats.mjs  emits compositions/<slug>.html + one sub-composition per beat
  fetch-audio.mjs  Deepgram: narrations/*.json -> audio + word timings
  extend-narrations.mjs  appends the closing section to each narration
  brand-pass.mjs, logo-pass.mjs   capture passes (not part of the build)
scripts/     tooling, run by hand or by lefthook
  entry.mjs        points index.html at a composition
  lint-design.mjs  design-system lint (line scanner)
  lint-repo.mjs    repo hygiene lint (git index)
  review-frames.mjs  captures review frames OUTSIDE the repo
  render-all.ps1   batch render
  legacy/          superseded generator, kept for reference, not on any path
docs/        this file and anything else written down
assets/      input assets: timing/, cursors/ (SVG — source, never ignored)
narrations/  narration scripts (JSON)
compositions/  GENERATED, and committed on purpose — see §5
index.html   GENERATED pointer at the current entry composition
```

Nothing loose at the repo root. The root is an **allowlist** in
`scripts/lint-repo.mjs` (`ROOT_ALLOWLIST`), not a denylist: `msg.txt`,
`lint.json` and `build-report.json` all sat at the root, and a denylist would have
quietly allowed the next one. Adding a root file is now a decision you make on
purpose by editing that list.

---

## 2. Review frames go OUTSIDE the repo

```bash
npm run review -- --at 94 --no-end --label spine
# -> C:\Users\0\.buzz\.scratch\hyperframes-review\spine-edge-<timestamp>\
```

Not `npm run snapshot`, which writes wherever you point it — including into the
tree. Frames used to land in `snapshots/` here, where `.gitignore`'s `*.png` hid
them from `git status` and therefore from every diff review, so they accumulated
silently and one got committed with `git add -f`.

Three things now prevent that, and they are deliberately redundant:

1. `review-frames.mjs` **refuses** an `--out` inside the repo (exit 1, verified).
2. `.gitignore` excludes `snapshots/ .shots/ review/ out/ renders/ transcripts/`
   and all image + media extensions.
3. `scripts/lint-repo.mjs` fails the commit if **git tracks** any image or render
   artefact, or any file inside a review directory. This is the one that catches
   `git add -f`, which the first two cannot.

SVG is not in the ignore list and not in the lint's artefact list, on purpose: the
logo, the cursors and the Heroicons are source, and the compositions fail to render
without them.

---

## 3. Order of operations for a change

```bash
npm run lint          # design-system + repo hygiene
npm run build         # regenerate compositions/ and index.html
npm run review -- --at <t> --no-end --label <what>   # look at it
npm run check         # hyperframes check (lint + runtime + layout + motion + contrast)
git add -A && git commit -m "..."
```

`git commit` runs lefthook, which is not decoration — it is the enforcement:

| hook | what it does | why it exists |
|---|---|---|
| `design-system` | line-scans staged `mjs/html/css` | every visual rule was broken at least once |
| `repo-hygiene` | checks what git tracks | catches `git add -f` frames, loose root files, secrets |
| `build` | regenerates and stages `compositions/` | a stale build cannot ship |
| `verify-build` | `git diff --quiet` after build | build and commit can never disagree |

`--no-verify` skips all four. Do not reach for it to get past a failure: every one
of these has caught a real bug, and two of them (`diff-check` as it was, and the
Windows path bug in the lint) were themselves bugs that had to be fixed first.

### Known pre-existing `check` failure

`npm run check` reports one error, `audio_src_not_found` for
`assets/audio/agency-prospects.mp3`. That is correct and expected: media is
gitignored by design, so **a fresh clone renders silent** until you run
`npm run audio` (`src/fetch-audio.mjs`, needs `DEEPGRAM_API_KEY`). It is written in
`.gitignore` as a stated consequence rather than left to be discovered.

---

## 4. What has to happen before `main`

`main` is the public repo. `card-inversion` is where the design work lives until
matt signs off on the frames — worker owns this repo, so the branch/merge call is
matt's, not mine.

1. Frames reviewed and approved on the branch, **both stages** (blue and white) for
   any scene whose colours changed. A white-stage-only frame is how the pale-blue
   and white-on-white bugs shipped.
2. `npm run lint && npm run check` — one known audio error only.
3. Merge to `main`, push, confirm `git rev-parse HEAD` on `main` equals local.

## 5. Then: render every video

Only after main is clean, per slug:

```bash
npm run audio                                    # once per clone
node scripts/entry.mjs agency-prospects && npm run render
# ...or all slugs:
pwsh scripts/render-all.ps1
```

Rendered mp4s go to `renders/`, which is gitignored — the repo ships the
*compositions*, not the video.

---

## 6. Non-negotiables

- **Never `--no-verify`.**
- **Never add a review frame to git.** `--force` included.
- **Never a loose file at the root.** Move it or extend the allowlist on purpose.
- **Never an undefined design token.** An undefined `R.*`/`C.*`/`TYPE.*` emits a
  literal `undefined` into the composition, the browser drops it, and the frame is
  quietly wrong with nothing in the build to explain it. `no-undefined-token` exists
  for this and was verified by injecting a bad token.
- **Tone is an input to a scene factory, never an override applied after.**
- **A card whose fill matches its stage needs `C.blueEdge`.** A border set to the
  fill's own colour is a decorative no-op.