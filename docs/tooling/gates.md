# gates

**Lives in:** `package.json`, `lefthook.yml`, `scripts/lint-docs.mjs`

## What it is

The gates are the checks that keep every rule in these docs true. A rule with no gate is a wish.

## When it comes to the composition

`npm run lint` runs them all; the pre-commit hook runs the ones for the files you touched and the pre-push hook runs all of them.

## How it works

| gate | checks |
| --- | --- |
| `lint:design` | the design system: no blur, no fade, no bare drop, no cheap ease, no plane dip |
| `lint:pacing` | M1 to M14: scene length, dead air, the peak rule |
| `test:spring` | springs, `track`, activation |
| `test:color` | the OKLCH lip |
| `test:camera` | the camera moves and the director |
| `test:pointer` | the pointer and camera model |
| `test:fx` | flash, ramp, rings, wipe, extrusion, layers |
| `lint:components` | the component contract, C1 to C17 |
| `lint:transitions` | the transition contract, T1 to T11 |
| `lint:docs` | this documentation tree mirrors the source |
| `lint:repo` | the tree, secrets |

## How it composes

Order of work: `npm run lint`, then `npm run build`, then `npm run review` (read the frames), then `npm run check`, then commit.

## Rules and gates

| rule | enforced by |
| --- | --- |
| every rule in `docs/` names its gate | `lint:docs` |

## Related

[naming-conventions](../naming-conventions.md), [WORKFLOW.md](../WORKFLOW.md)
