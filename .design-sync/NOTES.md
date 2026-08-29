# design-sync notes

Repo-specific gotchas for syncing this repo to claude.ai/design. Read before
re-running the sync.

## What this sync actually ships

- This repo is a **Next.js application**, not a component library. There is no
  built component entry — `dist/` holds only the drizzle `migrate.js`. The
  converter runs in synth-entry mode over `src/components` (`[NO_DIST]` in the
  build log is expected, not a failure).
- The design system is **Mantine 9 + `src/theme.ts`** (teal ramp,
  `defaultRadius: 'md'`, system-ui stack) plus twenty of the app's own
  components. `cfg.extraEntries` merges `@mantine/core`, `@mantine/hooks`,
  `@mantine/notifications`, `@mantine/dropzone`, `@tabler/icons-react` and the
  theme onto `window.HomeItemCatalog` — ~6,850 exports, ~6.9 MB bundle. Tabler
  alone is ~2.9 MB of that; drop it from `extraEntries` if the bundle ever
  needs to shrink, at the cost of the design agent losing the icon vocabulary.
- `ServiceWorkerRegistration` is deliberately excluded
  (`componentSrcMap: null`): it renders nothing and calls
  `navigator.serviceWorker.register()` on mount, which should not fire inside
  every preview. `AutoGrid` and `FieldBlock` are excluded for the opposite
  reason — they are invisible layout plumbing (a grid declaration and a
  label/hint pair), and a card showing either of them teaches nothing that the
  components using them do not already show. `CategoryIcon` (added
  2026-08-29, wraps `categoryIconComponent()` via `createElement` so the
  lookup isn't misread as defining a component every render) is excluded for
  the same reason as `AutoGrid`/`FieldBlock` — it's a one-line glyph lookup,
  and `CategoryVisual`'s own card already shows every icon it renders.
- `UserForm` and `PasswordForm` both map to `src/components/UserForm.tsx`:
  one module, two screens that differ only in how many fields they hold.

## Run it like this

```sh
pnpm install --frozen-lockfile
bash .design-sync/setup.sh                       # REQUIRED — see below
NODE_OPTIONS=--max-old-space-size=12288 node .ds-sync/package-build.mjs \
  --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle
NODE_OPTIONS=--max-old-space-size=12288 node .ds-sync/package-validate.mjs ./ds-bundle
```

Or, for a re-sync, the driver does build → diff → validate → capture in one
command — see "Re-syncs are one command" in the skill; the exact invocation
used here:

```sh
NODE_OPTIONS=--max-old-space-size=12288 node .ds-sync/resync.mjs \
  --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle \
  --remote .design-sync/.cache/remote-sync.json
```

- **`.design-sync/setup.sh` is not optional.** It builds the
  `node_modules/home-item-catalog` package shim the converter resolves the DS
  through, concatenates the three Mantine stylesheets into the file
  `cfg.cssEntry` points at, and recreates the `.design-sync/node_modules` link
  the forked `dts.mjs` needs for `ts-morph`. `pnpm install` wipes the shim, so
  re-run setup after every install. It regenerates the concatenated Mantine
  stylesheet from whatever `@mantine/*` version is installed, so a Mantine
  major bump (7→9, verified 2026-08-29) needs no changes here.
- **The shim must not be a symlink to the repo root.** That makes
  `node_modules/home-item-catalog/node_modules/home-item-catalog/…` an infinite
  cycle; the ts-morph descendant walk then dies with `ELOOP`, or OOMs first.
- **`--max-old-space-size` is required.** Parsing Mantine's 719 `.d.ts` files
  plus Tabler exceeds the default 4 GB heap and dies with
  "Ineffective mark-compacts near heap limit".
- Converter deps live in `.ds-sync/` and are installed with
  `pnpm install --ignore-workspace` (AGENTS.md bans npm/yarn/bun repo-wide).
  esbuild's postinstall is reported as ignored — harmless, the binary works.
- **The staged `.ds-sync/` scripts are re-copied fresh from the skill on every
  re-sync** (the skill's own instruction — a stale `.ds-sync/` runs an old
  converter against these notes). The 2026-08-29 re-sync found every staged
  file differed from the bundled skill (the skill itself had moved on since
  the prior sync); re-copying is instant and expected, not a sign of drift to
  chase. `.design-sync/overrides/dts.mjs` was diffed against the fresh
  `.ds-sync/lib/dts.mjs` afterwards and the only substantive difference was
  still exactly the declared fork (the `Manager` suffix line) — everything
  else was punctuation-only upstream churn (em-dashes, arrows). No merge was
  needed; check this on every re-sync before trusting the fork.

## Browser-only shims (`.design-sync/stubs/`)

The components import Server Actions and Next runtime modules that cannot exist
in a browser preview. `cfg.tsconfig` (`.design-sync/tsconfig.sync.json`) remaps
them via `paths`:

| Real module | Stub | Why |
|---|---|---|
| `@/app/actions/*` | `stubs/actions/*` | `'use server'`; pull in better-sqlite3, sharp, iron-session |
| `next/navigation` | `stubs/next-navigation.ts` | `usePathname` / `useRouter` need App Router context |
| `next/link` | `stubs/next-link.tsx` | forwards a ref so Mantine's `component={Link}` works |

- **Adding a module to `src/app/actions/` means adding a stub file with the
  same name**, or the real one gets bundled and the build fails on
  `Could not resolve "fs"`.
- **Never put comments in `tsconfig.sync.json`.** The converter's paths plugin
  strips comments with a regex before `JSON.parse`; a `"//"` key or a `/* */`
  block silently corrupts the file, the plugin returns null, and every stub
  quietly stops applying. It fails as server code appearing in the bundle, not
  as a config error.
- The stubs are why **writes are no-ops in a design** — actions resolve
  `{ success: true }` and persist nothing. Documented for the design agent in
  `conventions.md`.

## Forks and overrides

- `.design-sync/overrides/dts.mjs` — one-line fork: upstream's
  `isComponentName` drops any name ending in `Manager` as a utility singleton,
  which silently dropped `CategoriesManager` and `UsersManager`. Declared in
  `cfg.libOverrides`. On re-sync, diff it against `.ds-sync/lib/dts.mjs`
  (confirmed still clean 2026-08-29 — see above).
- **`componentSrcMap` additions suppress src auto-discovery.** The moment one
  non-null entry exists, the derive-from-src fallback stops running, so *all
  twenty* components must stay pinned there. Adding a component to
  `src/components/` will NOT pick it up automatically — it silently stays out
  of the sync until it's added to `componentSrcMap` (as a real path) or
  explicitly excluded (`null`, with a reason recorded above).
- **Groups come from the last directory segment of a component's source path.**
  The components under `src/app` would otherwise land in groups named after
  route segments (`id`, `new`, `edit`, `login`, `setup`).
  `.design-sync/screens/<group>/` holds a one-line re-export per component so
  the path yields a real group; `componentSrcMap` points at those, and
  `.design-sync/screens.ts` re-exports them onto the global via
  `extraEntries`.
- `cfg.dtsPropsFor` carries every component's props by hand. With no shipped
  `.d.ts` tree, extraction yields `[key: string]: unknown` — useless as the
  design agent's API contract. **Edit a component's props in `src/` and the
  contract here goes stale**; update `dtsPropsFor` in the same change.

## Known render warns (all triaged — re-syncs should expect these)

- `[TOKENS_MISSING] --app-shell-*` — Mantine's `AppShell` sets those custom
  properties at runtime via inline styles. Nothing to ship.
- `[TOKENS_MISSING] --mantine-text-wrap` (new in Mantine 9, seen 2026-08-29) —
  the second-level fallback in `text-wrap: var(--text-text-wrap,
  var(--mantine-text-wrap))` on `Text`/`Blockquote`. Nothing in this app's
  theme sets it, so the browser's own default (`text-wrap: wrap`, already the
  CSS default) applies — no visual difference. Harmless.
- `[RENDER_THIN] ImageLightboxModal … rendered height is 0px` — the modal is a
  portal with fixed positioning, so measured height collapses. The screenshot
  is correct and complete; benign.
- `[RENDER_THIN] ConfirmSheet … rendered height is 0px` — same cause (a
  `Drawer` portal).
- `[EXPORT_COLLISION] ./.design-sync/screens.ts exports 3 name(s) the main
  package also exports` — false positive. In synth-entry mode the converter
  adds every discovered component to its "main exports" set before comparing,
  but the synth entry re-exports only `src/components`. Confirmed harmless:
  validate reports all 20 as real function exports and every preview renders.
- `[EXPORT_COLLISION] @mantine/core exports 1 name(s) the main package also
  exports: EmptyState` (new in Mantine 9, seen 2026-08-29) — Mantine 9 shipped
  its own compound `EmptyState`/`EmptyStateTitle`/`EmptyStateDescription`.
  Two independent reasons this is harmless here: (1) `bundle.mjs`'s IIFE
  footer does `Object.assign({}, merged, mainNs, …)` — the main package's own
  exports always win over an `extraEntries` collision, so
  `window.HomeItemCatalog.EmptyState` is provably this app's component, not
  Mantine's; (2) the warning only matters for a *story* that imports the
  colliding name from `@mantine/core` directly — grepped every file in
  `.design-sync/previews/`, none do (`EmptyState.tsx` imports from
  `'home-item-catalog'`). No config change needed; re-confirm the import
  check if a future preview ever imports `EmptyState` from `@mantine/core`
  for some other reason.
- Photos never resolve in a preview — there is no `/api/images` route behind
  one. `CategoryTiles`, `CategoryItemsList` and `ItemDetailView` fall back to
  the app's own "Brak zdjęcia" placeholder; `ImageLightboxModal` and
  `ItemForm` have no `img` fallback and show alt text. Accepted as the honest
  render.

## The short-form-content / fixed-action-bar overlap (found + fixed 2026-08-29)

`cardMode: "single"` renders a story inside a `.ds-single` wrapper that has
`transform: translateZ(0)` — deliberately, so a `position: fixed` descendant
(like `FormActionBar`) is contained inside the card instead of escaping to
the real page (see the comment above `previewHtmlModule` in `lib/emit.mjs`).
That wrapper has **no explicit height** — it sizes to its in-flow content,
and a `position: fixed` child does not contribute to that intrinsic height.
For a form with enough fields this is invisible: the bar pins comfortably
below the last field with room to spare. For a *short* form — one or two
fields — the wrapper's intrinsic height can be barely taller than the bar
itself, so `bottom: 0` pins the (opaque) bar directly on top of the last
field, hiding it completely. Nothing in the render check catches this
(`rootEmpty`/`thin`/`bad` are all false — there's plenty of non-empty DOM, it's
just painted over), and the resulting screenshot looks superficially
plausible (banner, then buttons) so it is easy to grade "good" without
noticing a field is missing.

Found on `PasswordForm` (one field: `Nowe hasło` vanished entirely) and
`UserForm` (two fields: `Hasło początkowe`, the second one, vanished) while
grading the redesigned component set. Confirmed real by reading
`getBoundingClientRect()` on the hidden input (correctly positioned, fully
styled — it's occlusion, not a layout failure) and by cross-checking the
screenshot's visible fields against the real component's JSX. **Not a bug in
the real app** — every real usage wraps these forms in `AppLayout`, whose
full mobile-viewport height leaves the bar plenty of clearance; it is purely
an artifact of the isolated single-card preview harness.

**Fix applied**: wrap the story's root in `<div style={{ minHeight: 420 }}>`
in the preview `.tsx` (see `.design-sync/previews/PasswordForm.tsx` and
`UserForm.tsx`) — tall enough to clear the bar regardless of content, small
enough not to look like a mistake. **Check any future short single-field (or
two-field) form preview for this before grading it "good"** — cross the
screenshot's visible fields against the real component's JSX line by line;
don't trust "the buttons are there and nothing looks broken" as sufficient.

## Re-sync risks

- **`.design-sync/screens.ts`, `screens/` and `componentSrcMap` hard-code paths
  into `src/app`.** Moving or renaming a route directory breaks the build with
  an unresolved import; renaming a component silently drops it from the sync.
- **`dtsPropsFor` and `docs/*.md` duplicate knowledge that lives in `src/`.**
  Both go stale on any prop or copy change, and nothing checks them. The
  domain types they inline are `CategoryWithCount`, `ItemWithCategory` and
  `User` minus `passwordHash`.
- **The Mantine stylesheet is concatenated at setup time** from
  `node_modules/@mantine/*/styles.css`. It is regenerated on every setup run,
  so a Mantine upgrade is picked up automatically — but the three packages are
  hard-coded in `setup.sh`; adding a fourth `@mantine/*` package means editing
  it.
- **`.design-sync/conventions.md` names Mantine components, props and CSS
  variables.** Verified against the build on 2026-08-28, then re-verified
  (and three stale claims fixed: the Mantine major version, a
  never-filled-in `_ds/<folder>/styles.css` placeholder path that should have
  read `styles.css`, and the photo-fallback bullet still naming the
  pre-redesign `ItemsCatalog` component) on 2026-08-29 against Mantine 9 /
  the redesigned component set. Re-run the validation pass on every re-sync
  rather than trusting it, especially after a major Mantine bump or a
  component rename/redesign.
- Playwright is pinned to **1.62.0** in `.ds-sync/package.json`; the repo's
  own `@playwright/test` moved to **1.62.1** during the Next 16 bump. Both
  pin the same cached chromium build (**1234**) — verified by checking both
  versions' `packages/playwright-core/browsers.json` on GitHub — so no
  mismatch yet, but re-check both against the cache on every re-sync rather
  than assuming they stay in lockstep.
- The build was run on Node 24.18.0, pnpm 11.24.0, Mantine 9.5.2, Next 16.3.3
  (2026-08-29). The prior sync (2026-08-28) was on Mantine 7.17, Next 15.1 —
  both majors were bumped between syncs and, per the app's own upgrade
  commits, needed no application code changes; this sync independently
  re-verified render output and confirmed only the two new warns above.
- **The remote project (`1aadc841-…`) predates the component redesign.** Its
  `_ds_sync.json` anchor only knew the old 11-component set
  (`ItemsCatalog`/`EditItemForm`/`NewItemForm`/… — apparently the redesign's
  local output was never actually uploaded before this sync). This sync's
  diff correctly computed `removed: [EditItemForm, ItemsCatalog, NewItemForm]`
  and `added:` the twelve new-named components; the atomic upload deletes the
  old paths verbatim from the diff. If a future re-sync ever again shows a
  large unexpected `removed`/`added` set against the anchor, check whether
  the last local build was actually uploaded before trusting the diff.
- **This project has content design-sync doesn't own**: `design_handoff_mobile_first/`,
  `templates/mobile-first/`, `uploads/*.png` and `github.md`. Per the user
  (2026-08-29): `design_handoff_mobile_first/` and `templates/mobile-first/`
  are the actual design source the mobile redesign was built from — the
  current `src/components` implementation applied that design, which is *why*
  the component set changed shape (old `ItemsCatalog`/`EditItemForm`/
  `NewItemForm` → the new `CategoryTiles`/`CategoryItemsList`/`ItemForm`/etc.
  set this sync uploaded). Keep these paths untouched — design-sync's
  `writes`/`deletes` globs (`components/**`, `tokens/**`, `fonts/**`,
  `_vendor/**`, `_preview/**`, `guidelines/**`, plus the fixed root files)
  never reach them; verify that stays true on any future change to the
  upload plan.

## Validator warnings that are expected here

- `[RENDER_THIN] ConfirmSheet` and `[RENDER_THIN] ImageLightboxModal` — both
  are Mantine overlays (`Drawer` and `Modal`), so their content renders into a
  portal outside the measured subtree and the preview measures 0px high. The
  screenshots in `_screenshots/` show both rendering correctly; the check is
  measuring the wrong box, not finding an empty one.
- `[GRID_OVERFLOW]` on the form components — `FormActionBar` is
  `position: fixed` by design, so no grid cell can contain it. They carry
  `cardMode: "single"` in `cfg.overrides` for that reason; re-adding a story
  to one of them may re-trip the check until the override is confirmed. See
  also the short-form/fixed-bar overlap note above — a clean `[GRID_OVERFLOW]`
  pass does not mean the card is visually correct.
- `[TOKENS_MISSING] --app-shell-*` — Mantine's `AppShell` stylesheet still
  ships in the concatenated CSS, but the redesign replaced `AppShell` with a
  hand-built shell, so nothing sets those variables. Harmless.
