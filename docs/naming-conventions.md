# Naming conventions

A convention that is only half-enforced is worse than none, because it teaches the reader to expect a structure that is
not there. This document is the rule, and `scripts/lint-docs.mjs` is the gate that keeps the documentation half of it
true. If the two disagree, the gate is the bug.

Adapted from the `blaster` repo's backend convention (`blaster/docs/naming-conventions.md`), which is the same idea:
**scope, then domain, then primitive**. The same name means the same thing in every repo, so a reader who learns one does
not have to re-learn the other.

## The shape

Everything in this repo is a **domain**, and a domain is made of **primitives**: the small named things a film is built
from. A primitive has a name, a contract, one source home, and one doc.

```text
src/{domain}/{primitive}/index.mjs     a primitive that is a directory (a component, a camera move's module)
src/{domain}/{primitive}.mjs           a primitive that is one file (a camera move, a transition)
src/{domain}/index.mjs                 the domain's registry: get(), list(), validate()
docs/{domain}/README.md                the domain: what it is for, the primitives, how they compose
docs/{domain}/{primitive}.md           the primitive: what it does when it comes to the composition, and how it all works
```

Read it as **scope, then domain, then primitive**. `camera/push` is the `push` move of the camera domain.
`components/table` is the `table` component. `layers/adjustment-layer` is the adjustment layer of the layer stack.

The documentation tree **mirrors** the source tree: a primitive that exists in `src/` and has no page in `docs/` is a
failure, and so is a page for something that does not exist.

## The domains

| domain | what it owns | source home | doc home |
| --- | --- | --- | --- |
| `motion` | how things accelerate: springs, the peak rule, activation | `src/lkspring.mjs` | `docs/motion/` |
| `camera` | where the frame is: moves, the director that plans them, blending | `src/camera/` | `docs/camera/` |
| `pointer` | the one cursor, its path, the click | `src/lkpointer.mjs`, `src/lkdirector.mjs` | `docs/pointer/` |
| `layers` | what is above what: composite, adjustment layer, rings, pointer, flash | `src/build-demo.mjs`, `src/transitions/common.mjs` | `docs/layers/` |
| `components` | the shared UI: card, tile, pill, chip, table, satellite, cutout | `src/components/` | `docs/components/` |
| `extrusion` | thickness: the slab, who owns it, the derived lip | `src/lkextrude.mjs`, `src/lkcolor.mjs` | `docs/extrusion/` |
| `transitions` | cuts between two compositions: wipe, swap, the speed ramp | `src/transitions/` | `docs/transitions/` |
| `tooling` | the gates and the builds | `scripts/`, `lefthook.yml` | `docs/tooling/` |

Files that predate the convention keep their flat `lk*.mjs` names (`lkspring`, `lkpointer`, `lkextrude`, ...). They are
named for their domain, and the table above is the map. **New** code goes in `src/{domain}/`, and a flat file moves into
its domain directory when it is next substantially changed, never in a drive-by rename.

The long-form method documents at the top of `docs/` (`ANIMATION.md`, `COMPONENTS.md`, `TRANSITION_FX.md`,
`POINTER_MOTION.md`, `MOTION_CRITERIA.md`, `SCENE_GRAMMAR.md`) stay: they are the *why* and the research. The
`docs/{domain}/{primitive}.md` pages are the *what and how*, and link to them.

## Naming style: the external system wins

**A name that mirrors an external system keeps that system's spelling.** This is the rule that is easiest to get silently
wrong.

| comes from | spelling | examples |
| --- | --- | --- |
| a Twenty object (`nameSingular`) | camelCase, verbatim | `agencyProspect`, `agencyCall`, `agencyOpportunity` |
| a Heroicon | the icon's own name | `building-storefront`, `phone` |
| a GSAP property or ease | GSAP's own | `rotationX`, `transformPerspective`, `power2.inOut` |
| a CSS property | CSS's own | `transform-style`, `clip-path` |
| the ear cutouts | the source asset's name | `ear1` .. `ear8` |
| **this repo** | **lowercase kebab-case** | `pixel-wipe`, `scale-swap`, `adjustment-layer`, `peak-rule` |

To check a name: ask *what is the source of this name?* If it is Twenty, a library, or a source asset, copy its
spelling exactly. If it is ours, it is kebab-case. A directory or file for something we invented is never camelCase.

## Naming rules

| thing | rule | example |
| --- | --- | --- |
| Domain directory (src and docs) | lowercase, one word where possible | `camera`, `layers`, `extrusion` |
| Primitive id | lowercase kebab-case, singular | `cutpush`, `pixel-wipe`, `adjustment-layer` |
| Primitive doc | `docs/{domain}/{id}.md`, same id as the code | `docs/camera/cutpush.md` |
| Domain index | `docs/{domain}/README.md`, always | `docs/layers/README.md` |
| Source file in a domain | lowercase kebab-case | `scale-swap.mjs` |
| Registry key | equals the primitive's `id`, which equals its doc name | `MOVES.cutpush` |

Prefer singular. `components/table` is one component; `components/tables` reads like a collection of table files.

## What a primitive page contains

Every `docs/{domain}/{primitive}.md` has the same sections, in this order, so a reader never has to hunt:

1. **Lives in:** the source path(s), as `` `src/...` `` (the gate checks they exist).
2. **What it is** one paragraph.
3. **When it comes to the composition**: what it does in a film, when it is used, what it is not for.
4. **How it works**: the mechanism, with the numbers.
5. **How it composes**: what it sits above, below and beside; what it hands over to.
6. **Rules and gates**: the rules that bind it and the check that enforces each.
7. **Related**: links.

A page that cannot fill a section says so in one line; it does not drop the section.

## Rules the gate enforces (`npm run lint:docs`)

1. Every domain directory in `docs/` is in the table above, lowercase, with a `README.md`.
2. Doc file names are lowercase kebab-case, with no exception.
3. Every registered primitive has a page: every camera move, component and transition in its registry has
   `docs/{domain}/{id}.md`, and every page in a registry-backed domain names a primitive that exists.
4. Every primitive page has the seven sections, in order, and a `Lives in:` line whose paths exist.
5. Every domain `README.md` lists every page in its directory, and every page it lists exists.
6. No relative link in `docs/` points at a file that does not exist.

Each violation is reported as `path: reason` and fails the pre-commit hook.

## Exemptions

| path | why |
| --- | --- |
| `docs/references/` | vendored third-party references with their own provenance; not ours to restructure |
| `docs/*.md` at the top level | the long-form method documents and this one; they are not primitives |
| `src/legacy/`, `scripts/legacy/` | retired code, kept for history |

Adding a path to this list is a deliberate act with a reason in the gate, not a way to silence a failure.
