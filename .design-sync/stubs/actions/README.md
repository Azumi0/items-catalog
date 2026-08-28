# Server Action stubs

The real `src/app/actions/*` modules are `'use server'` Server Actions: they
open the SQLite database through `better-sqlite3` and read the iron-session
cookie. Neither exists in the claude.ai/design browser runtime, and bundling
them drags the whole data layer — `better-sqlite3`, `sharp`, `node:fs`,
`node:crypto` — into a browser bundle that cannot resolve any of it.

Each stub here mirrors one real module's export list, resolving to the success
shape `useActionRunner` expects (`{ success: true }`). The management screens
therefore complete their optimistic flow — notification, modal close,
`router.refresh()` against the no-op router in `../next-navigation.ts` — and
stay visually truthful. **Nothing is persisted**: designs built with these
components mutate no data.

Wired in through `paths` in `../../tsconfig.sync.json`. That mapping substitutes
the matched module name into the target directory, so a stub file must exist
per real module — adding an action module to `src/app/actions/` means adding a
matching file here, or the real one gets bundled and the build fails.
