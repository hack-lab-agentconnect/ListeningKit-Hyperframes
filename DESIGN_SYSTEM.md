# ListeningKit HyperFrames — Design System

The binding rules for the ListeningKit object-explainer video series. Everything
here is enforced: `lefthook.yml` runs `npm run lint:design` on every commit and
fails the commit on a violation.

Source of truth for the brand itself is the product repo,
[`listeningkit-hackathon`](https://github.com/matthewdonsemail-lab/log). Every value
below cites the file it came from. Nothing in this document is invented.

---

## 1. The rules

### 1.1 No opaque opacity

**A surface is either solid, or it is a deliberate glass panel. There is no middle
setting where a card is a translucent wash that happens to be the same value as
its own background.**

This is the rule that broke the most, so it is worth being precise about what it
means. The failure is not "transparency is bad". It is: an alpha applied to a
fill whose colour is already close to the backdrop produces a shape with no edge
and no depth — you get a smudge, and any text on it loses contrast for nothing.
Alpha that costs contrast without buying depth is banned.

| Surface | Fill | Where |
|---|---|---|
| **Card on a blue stage** | `#FFFFFF` solid + `0 6px 0 0 rgba(13,42,76,0.24)` | `surface()` |
| **Card on a white stage** | `#2A8CFF` solid + `0 6px 0 0 #1F6FE6` | `blueCard()` |
| Glass panel on blue | `rgba(255,255,255,0.10)` + `1.5px rgba(255,255,255,0.30)` | `glass()` |
| Caption pill on blue | `rgba(10,24,48,0.42)` + `1.5px rgba(255,255,255,0.16)` | `.cap span` |
| Caption pill on white | `rgba(255,255,255,0.88)` + `1.5px #E2E8F0` | `.cap span` |
| Record row fill on a blue card | `rgba(255,255,255,0.10)` | `.row` |
| Record row fill on a white card | `rgba(42,140,255,0.06)` | `.row` |
| API name chip | `rgba(42,140,255,0.10)` + `1.5px rgba(42,140,255,0.22)` | `.apichip` |

#### 1.1a The card inverts with the stage — the one rule that was wrong twice

**A card is WHITE on the blue stage and BRAND BLUE on the white stage.**

This is not a preference; it is the only way a card reads as an object at all
when the stage underneath it is already one of those two colours. Two earlier
attempts at the white stage were the same mistake in different clothes: an
opaque near-white fill, and then an opaque white fill with a `1.5px` blue
hairline "for an edge". Both are the stage, redrawn. A hairline is not an edge
at video scale — it is a rumour of one.

Pick the card with `cardFor(tone, maxW, radius, extra)`, which is the only place
the inversion is decided. Do **not** hand-pick `surface()` vs `frost()` per tone
in a scene: that is exactly how the record panel shipped with byte-identical
branches on both tones (`onBlue ? surface(...) : surface(...)`) and rendered
white-on-white.

Everything **inside** a card inverts with it — key labels, values, the focus row
fill, the waveform, and the icon tile. `.ico.on-bluecard` is a white tile with a
blue glyph; a blue tile on a blue card is the icon disappearing. Derive the inner
ink from the same flag you derive the surface from, never from the stage tone
independently.

`frost()` (translucent white card) exists in `scenes.mjs` but is no longer used by
any beat. If you reach for it, you are about to reintroduce this bug.

**Exception, deliberate:** the dither field. `rgba(42,140,255,0.30)` crossed at
45° is a *pattern*, not a wash — it has hard edges and it animates. It is
edge-masked on **both** backgrounds (`OnboardingShell.tsx:15`). Removing that mask
is what turned every white beat pale blue.

**Exception, deliberate (matt, 2026-10-03): the converge core card.** The centre
card of the converge beat — the one captioned `THE SPINE` — is **solid brand blue
on both tones**, including the blue stage where it deliberately goes against its
own background. It is the one object the whole beat is about, so it earns the
break; it is separated from the blue stage by a **2px `C.blueEdge` border** and by the
white ink, not by an alpha or a hairline. Do not "fix" this one back to white.

**The one edge colour (`C.blueEdge`, #7FBAFF).** Any card whose fill matches its
stage needs a real edge, and this is the only colour allowed to be it - lightened
brand blue, on **both** stages. Explicitly NOT `SHADOW.grey`: that ink is a drop
shadow, and reusing it as a stroke makes border and shadow read as two unrelated
treatments. It applies to THE SPINE (`2px`) and to every converge object chip
(`1.5px`) - a border set to the chip's own fill colour is a decorative no-op that
leaves the tile looking borderless.

`frost()` (translucent white card) exists in `scenes.mjs` but is no longer used by
the journey or split beats. If you reach for it, you are probably about to
reintroduce this bug.

### 1.2 No monospace, ever

`tailwind.config.js:63-71` aliases `mono` to `sans` **on purpose**. There is one
voice in this brand: Satoshi. Do not introduce a second family to create
hierarchy — create it with weight and size.

> Note: HyperFrames' own typography reference argues the opposite ("don't pair two
> sans-serifs; cross into serif or mono"). That advice is **overridden here**. The
> product aliased mono to sans deliberately, and the video follows the product.

### 1.3 No letter-spacing

Tracking is `0` everywhere, including the wordmark. Negative tracking
(`-0.03em` on display sizes) is the one exception HyperFrames recommends for
video, and it is applied to display type only — see `TYPE` in `lkdesign.mjs`.

A tracked-out wordmark is not the wordmark. The previous end card set
`letter-spacing: .18em` on `LISTENINGKIT` and the lockup `.14em`; both are zero now.

### 1.4 No fully-rounded shapes

The app's radii, from `DashboardFormSheet.tsx`, `OnboardingSteps.tsx:319`,
`DashboardFormPrimitives.tsx`, and `OnboardingShell.tsx:43`:

| Token | Value | Source |
|---|---|---|
| `R.sm` | 8 | `tailwind rounded-sm` |
| `R.md` | 12 | `tailwind rounded-md`, `button.tsx:253` |
| `R.lg` | 14 | `rounded-xl` |
| `R.tile` | 16 | `DashboardFormPrimitives.tsx:88` |
| `R.card` | 20 | `BrandRevealStep.tsx:75` |
| `R.panel` | 24 | `rounded-2xl`, `OnboardingAuth.tsx:37` |
| `R.logo` | 18 | `OnboardingShell.tsx:43` |
| `R.pill` | 999 | **genuine pills only** |

`R.pill` is for real pills and badges — CTA buttons, status chips, the numbered
`rounded-full` step marker from `OnboardingSteps.tsx:421`. It is **not** for icon
tiles, progress bars, or cards. Icon tiles are `R.sm`. Bar tracks are `R.sm`
(they were `13px` on a `26px` height, which is a fully-rounded pill). The converge
chips were `R.pill` while carrying an object name — they are `R.lg` now, because
a card that says `agencyOpportunities` is not a badge.

### 1.5 Icon tiles

An icon **inside a tile** takes its colour from the tile, and the two must be
opposite ends of the value range. The tile follows the **card**, not the stage:

- `.ico.on-blue` — brand blue `#2A8CFF` tile, **white** glyph. On a white card.
- `.ico.on-bluecard` — solid white tile, **blue** glyph. On a blue card.
- `.ico.on-white` — light tint `#EFF6FF` tile, **blue** glyph. On a white stage
  outside any card.
- `.ico.plain` — no tile, `color: inherit`. A bare icon is fine anywhere.

The specific bug: a light-blue tile on a white card left the icon within a few
points of the card's own value, so the icon read as a faint smudge. The mirror of
it is worse — a blue tile on a blue card is the icon gone entirely.

### 1.6 No squircle

`packages/ui/src/squircle.tsx` applies an SVG `clip-path` to a **fixed-size** box.
Every card in this series is content-sized, so wherever the path geometry and the
real box disagreed, the clip cropped the fill and the ring mask painted its border
outside the visible shape — that was the smeared-edge artefact. Plain
`border-radius` has no such failure mode.

### 1.7 Never invert the logo

`logo.svg` is a **blue tile with a white mark**. `filter: brightness(0) invert(1)`
flattens *both* the background and the mark to solid white, which shipped an end
card that was a blank white square. The logo gets a hard offset shadow and
nothing else. Never filter it.

---

## 2. Type

Satoshi only, and it must be declared with an explicit `@font-face`.

HyperFrames pre-bundles exactly 18 families (Inter, Roboto, Lato, Poppins,
Montserrat, Oswald, Archivo Black, Space Mono, IBM Plex Mono…). Satoshi is neither
bundled nor a Google font, so **without `@font-face` the render silently falls back
to a system font.** This already happened once: `assets/fonts/` did not exist and
every weight 404'd, so a full series shipped in Arial. `Fonts FAILED: Satoshi` in
the compiler output is the tell — check it on every run.

Source: `listeningkit-hackathon/apps/web/public/fonts/satoshi-webfont/`.
Cuts used: Light 300, Regular 400, Medium 500, Bold 700, Black 900.

### Weight contrast is the whole game

HyperFrames' typography reference is blunt: *"Weight contrast must be extreme. You
default to 400 vs 700. Video needs 300 vs 900."* This series was built at 700-vs-500
and read as flat body copy at 96px. The scale in `lkdesign.mjs`:

| Role | Weight | Size |
|---|---|---|
| `hero` | **900** | 104px |
| `h1` | **900** | 84px |
| `h2` | **900** | 62px |
| `h3` | 500 (recedes) | 38px |
| `body` | 400 | 30px |
| `eyebrow` / `label` | 700 | 20 / 17px |
| `kv` | 500 | 21px |
| `caption` | 400 | 34px |

Eyebrows and labels stay at 700 because at 17–20px a lighter cut disappears under
the encoder's letter-detail compression. Everything large is Black.

### Video sizes, not web sizes

Full-screen viewing: body ≥20px, headlines ≥60px, data labels ≥16px. In-feed
(before a video plays small in a scrolling timeline): body ≥32px, headlines ≥90px.

---

## 3. Colour

| Token | Value | Source |
|---|---|---|
| `C.blue` | `#2A8CFF` | `OnboardingShell.tsx:65`, `button.tsx:22` |
| `C.blueHover` | `#1F6FE6` | `button.tsx:22` |
| `C.tint` | `#EFF6FF` | `button.tsx:26`, `SquircleBadge.tsx:26` |
| `C.ink` | `#0D2A4C` | `tailwind.config.js:52` |
| `C.slate900` | `#0F172A` | `OnboardingAuth.tsx:20` |
| `SHADOW.grey` | `rgba(13,42,76,0.24)` | `index.css:6-14` retinted to brand ink |

`--ods-brand-600` (`#2563eb`) is **legacy**. Do not use it. The blue the product
actually ships is the literal `#2a8cff`.

Stage colours are flat: `#2A8CFF` or `#FFFFFF`, never a gradient. Tones alternate
per beat so the edit keeps cutting between white-on-blue and blue-on-white.

---

## 4. Motion

- **Tone is an input to the scene factory, never an override applied after.**
  Each factory computes `onBlue` internally and bakes text colour into markup.
  `build-beats.mjs` passes `tone` in; it must never do `built.tone = x`
  afterwards. That bug rendered blue-tone content on a white stage — white type,
  white cards, invisible.
- **J-cuts**: each beat's animation starts `LEAD` (0.55s) before its narration
  names it. You see the next idea land before it is spoken.
- **Every scene animates continuously.** A held frame is a failure, not a rest.
- **Cut on meaning, not on sections.** HyperFrames' kinetic-type reference
  segments copy into 3–7 word scenes tagged Hook → Build → Punch → Resolve, with
  emphasis words getting `glow`/`scale_pulse` on the beat.
- **Never tween `letterSpacing`.** It reflows text and snaps glyph positions under
  frame-by-frame capture. Entrance timing carries the meaning instead.
- One sub-composition per beat. A single file carrying every scene reaches ~47
  heavy overlays and HyperFrames renders solid-black past the halfway point.

---

## 5. Layout

- Nothing lives permanently in a corner. Type is centre-stage. The only persistent
  element is the chapter rail at the bottom, which wipes.
- Boxes must be able to grow. A fixed `300x52` chip silently clipped longer labels
  mid-word.
- Record panels follow the same inversion as every other card (1.1a). They are
  reconstructed product surfaces, but a reconstructed surface that is invisible is
  not representing the product, it is contradicting it.
- **Generated `compositions/**` HTML must be rebuilt and committed with any source
  change.** The journey-card fix landed in `scenes.mjs` and the committed
  compositions still carried the old hardcoded `background:#FFFFFF` — every frame
  reviewed after that commit was a frame of the *previous* design. Run
  `npm run build` (both compositions) before committing.

---

## 6. Enforced by

```bash
npm run lint:design     # lefthook pre-commit
```

`scripts/lint-design.mjs` fails on: opaque card fills, `border-radius` ≥ half the
box, `letter-spacing` other than 0 or negative, monospace families, the squircle
`clip-path`, the logo invert filter, and **any `R.*` / `TYPE.*` / `C.*` token that
`lkdesign.mjs` does not export**.

That last rule exists because an undefined token **fails open**: the browser
drops `font:undefined` and `border-radius:undefinedpx` without a warning, so the
frame is quietly wrong and the build says nothing. Three shipped that way —
`TYPE.kv` (every record key label), `R.input` (the overwhelm cards),
`R.badge` (the end-card URL chip) — plus one call with transposed arguments,
`glass(430, 128, R.card)`, which produced a 128px lozenge and a stray `;20;` in
the same style attribute. `TYPE.kv` was the visible one: the record keys were
rendering in the inherited body face, which is most of why the camelCase object
names looked visually inconsistent with everything around them.