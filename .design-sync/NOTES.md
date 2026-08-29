# design-sync notes

Repo-specific gotchas for syncing this repo to claude.ai/design. Read before
re-running the sync.

## What this sync actually ships

- This repo is a **Next.js application**, not a component library. There is no
  built component entry — `dist/` holds only the drizzle `migrate.js`. The
  converter runs in synth-entry mode over `src/components` (`[NO_DIST]` in the
  build log is expected, not a failure).
- The design system is **Mantine 7 + `src/theme.ts`** (teal ramp,
  `defaultRadius: 'md'`, system-ui stack) plus twenty of the app's own
  components. `cfg.extraEntries` merges `@mantine/core`, `@mantine/hooks`,
  `@mantine/notifications`, `@mantine/dropzone`, `@tabler/icons-react` and the
  theme onto `window.HomeItemCatalog` — ~6,730 exports, ~6.5 MB bundle. Tabler
  alone is ~2.9 MB of that; drop it from `extraEntries` if the bundle ever
  needs to shrink, at the cost of the design agent losing the icon vocabulary.
- `ServiceWorkerRegistration` is deliberately excluded
  (`componentSrcMap: null`): it renders nothing and calls
  `navigator.serviceWorker.register()` on mount, which should not fire inside
  every preview. `AutoGrid` and `FieldBlock` are excluded for the opposite
  reason — they are invisible layout plumbing (a grid declaration and a
  label/hint pair), and a card showing either of them teaches nothing that the
  components using them do not already show.
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

- **`.design-sync/setup.sh` is not optional.** It builds the
  `node_modules/home-item-catalog` package shim the converter resolves the DS
  through, concatenates the three Mantine stylesheets into the file
  `cfg.cssEntry` points at, and recreates the `.design-sync/node_modules` link
  the forked `dts.mjs` needs for `ts-morph`. `pnpm install` wipes the shim, so
  re-run setup after every install.
- **The shim must not be a symlink to the repo root.** That makes
  `node_modules/home-item-catalog/node_modules/home-item-catalog/…` an infinite
  cycle; the ts-morph descendant walk then dies with `ELOOP`, or OOMs first.
- **`--max-old-space-size` is required.** Parsing Mantine's 652 `.d.ts` files
  plus Tabler exceeds the default 4 GB heap and dies with
  "Ineffective mark-compacts near heap limit".
- Converter deps live in `.ds-sync/` and are installed with
  `pnpm install --ignore-workspace` (AGENTS.md bans npm/yarn/bun repo-wide).
  esbuild's postinstall is reported as ignored — harmless, the binary works.

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
  `cfg.libOverrides`. On re-sync, diff it against `.ds-sync/lib/dts.mjs`.
- **`componentSrcMap` additions suppress src auto-discovery.** The moment one
  non-null entry exists, the derive-from-src fallback stops running, so *all*
  eleven components must stay pinned there. Adding a component to
  `src/components/` will NOT pick it up automatically.
- **Groups come from the last directory segment of a component's source path.**
  The five components under `src/app` would otherwise land in groups named
  `id`, `new`, `edit`, `login` and `setup`. `.design-sync/screens/<group>/`
  holds a one-line re-export per component so the path yields a real group;
  `componentSrcMap` points at those, and `.design-sync/screens.ts` re-exports
  them onto the global via `extraEntries`.
- `cfg.dtsPropsFor` carries every component's props by hand. With no shipped
  `.d.ts` tree, extraction yields `[key: string]: unknown` — useless as the
  design agent's API contract. **Edit a component's props in `src/` and the
  contract here goes stale**; update `dtsPropsFor` in the same change.

## Known render warns (all triaged — re-syncs should expect these)

- `[TOKENS_MISSING] --app-shell-*` — Mantine's `AppShell` sets those custom
  properties at runtime via inline styles. Nothing to ship.
- `[RENDER_THIN] ImageLightboxModal … rendered height is 0px` — the modal is a
  portal with fixed positioning, so measured height collapses. The screenshot
  is correct and complete; benign.
- `[EXPORT_COLLISION] ./.design-sync/screens.ts exports 3 name(s) the main
  package also exports` — false positive. In synth-entry mode the converter
  adds every discovered component to its "main exports" set before comparing,
  but the synth entry re-exports only `src/components`. Confirmed harmless:
  validate reports all 11 as real function exports and every preview renders.
- Photos never resolve in a preview — there is no `/api/images` route behind
  one. `ItemsCatalog` and `ItemDetailView` fall back to the app's own "Brak
  zdjęcia" placeholder; `ImageLightboxModal` and `EditItemForm` have no `img`
  fallback and show alt text. Accepted as the honest render.

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
  variables that were verified against the build on 2026-08-28.** A major
  Mantine upgrade could invalidate them; re-run the validation pass rather than
  trusting it.
- Playwright is pinned to **1.62.0** because the cached chromium build is 1234.
  A different cache means a different Playwright release — check
  `playwright-core/browsers.json` before installing.
- The build was run on Node 24.18, pnpm 11.15.1, Mantine 7.17, Next 15.1.

## Validator warnings that are expected here

- `[RENDER_THIN] ConfirmSheet` and `[RENDER_THIN] ImageLightboxModal` — both
  are Mantine overlays (`Drawer` and `Modal`), so their content renders into a
  portal outside the measured subtree and the preview measures 0px high. The
  screenshots in `_screenshots/` show both rendering correctly; the check is
  measuring the wrong box, not finding an empty one.
- `[GRID_OVERFLOW]` on the four form components — `FormActionBar` is
  `position: fixed` by design, so no grid cell can contain it. They carry
  `cardMode: "single"` in `cfg.overrides` for that reason; re-adding a story
  to one of them may re-trip the check until the override is confirmed.
- `[TOKENS_MISSING] --app-shell-*` — Mantine's `AppShell` stylesheet still
  ships in the concatenated CSS, but the redesign replaced `AppShell` with a
  hand-built shell, so nothing sets those variables. Harmless.
