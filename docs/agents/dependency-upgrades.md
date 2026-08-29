# Dependency and Node Upgrades

How this repo moves Node, the package manager, and dependencies forward. The
decisions below are conventions, not one-off choices — apply them to every
upgrade, not just the one that produced this file.

## Establish the baseline before anything moves

An upgrade is only verifiable against a suite that was **green before it
started**. Where coverage for the affected surface is missing, write it first
and commit it on its own, against the current versions.

For UI upgrades the baseline has one hard requirement: **it must survive a
component-library swap.** Assertions keyed to DOM structure, generated class
names or pixel snapshots go red on a major bump for reasons that are not bugs,
and then they cannot tell you which failures are real. Key them to what the
user sees — roles, labels, visible Polish copy — plus behavioural invariants
that hold across any restyle (an image reports non-zero `naturalWidth`; nothing
overflows the viewport horizontally at mobile width).

## Version topology

Each surface states the version at a different strictness, on purpose:

| Surface                | Form                    | Why                                                             |
| ---------------------- | ----------------------- | --------------------------------------------------------------- |
| `engines.node`         | floor (`>=24.18.0`)     | A hard minimum. An exact value breaks a patch release for nothing |
| `Dockerfile` base      | exact (`node:24.18.0-alpine`) | The image is the reproducible artifact; exactness pays here |
| `.nvmrc`               | exact                   | Local shells agree without argument                              |
| `@types/node`          | tracks the **runtime** major | Types describe the Node you run, never the newest published |
| `packageManager` (pnpm)| exact                   | Corepack fetches precisely this in the build image               |

The pnpm pin and the esbuild `--target` are part of the Node change: move them
in the same commit, so no surface is left describing the previous runtime.

## Sequencing

One upgrade per commit, each independently green, riskiest last — so a future
bisect lands on a single package rather than a wall of changes:

1. Baseline coverage, against current versions.
2. Node and toolchain (`engines`, `.nvmrc`, Dockerfile, esbuild target, pnpm, `@types/node`).
3. Low-risk upgrades, batched (patches, minors, `@types/*`).
4. Each major on its own commit.

**Coupled packages travel in adjacent commits, never merged.** `next` and
`eslint-config-next` are versioned together, and `eslint` follows them — landing
them as one commit means a lint failure and a build failure arrive
indistinguishable.

## Holding a major back

Take the latest stable by default. **Hold** a major when its ecosystem support
is immature relative to what it buys this project — the payoff is measured
against a 61-file codebase, not against a large one. State the hold and its
reason in the commit that skips it.

Currently held:

- **TypeScript** at 5.9.x. `typescript-eslint`, the Next `tsconfig` plugin and
  Vitest type tooling vary in their support of 7, and the reward is compile
  speed this project does not need.
- **ESLint** at 9.x. `eslint-plugin-react` has published no ESLint 10 release
  at all — its peer range stops at `^9.7` and it calls `context.getFilename()`,
  which 10 removed — and it is a hard dependency of `eslint-config-next`.
  Taking 10 therefore means dropping `eslint-config-next` and hand-assembling
  its replacement, which would give up the React Compiler rules that catch real
  defects here. Re-check when `eslint-plugin-react` ships 10 support.

## Adapting the codebase

Work through breakage in place rather than reverting the upgrade:

- **Contained shim** (roughly under 50 lines wrapping a replacement primitive) —
  write it and continue.
- **Real component reimplementation** — write it, then flag it prominently in the
  handback. It is new surface area this repo maintains forever, and it deserves
  a decision rather than a line buried in a large diff.
- **Deprecated `@types/*`** — delete the package once its runtime ships bundled
  types, after verifying they resolve.
- **Stale rationale** — a comment justifying the version you just replaced is
  worse than none, because it teaches the next reader to distrust the file.
  Rewrite it to the constraint that is still true.
- **Visible departure from `docs/design_handoff_mobile_first/`** forced by an
  upgrade — record it as a new ADR, keeping it separate from
  `ADR-004`, which is scoped to the mobile-first rebuild. A commit message is
  not enough: the next review will "fix" an unrecorded departure back.

## Done

A commit is done when **all five gates are green**: typecheck, lint, unit tests,
the `e2e/` suite, and `docker build`. Scripts live in `package.json`.

`docker build` is not optional. It is the only gate that compiles the native
dependencies (`better-sqlite3`, `sharp`) against the Node version in the image
you actually ship — a green `next build` proves nothing about that.
