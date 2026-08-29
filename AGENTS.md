## Agent skills

### Package manager

Use `pnpm` exclusively for all package operations and scripts (`pnpm install`, `pnpm <script>`, `pnpm test`, `pnpm dlx`). Never use `npm`, `yarn`, or `bun`.

### Authorization invariant

**Every `page.tsx` rendering protected content MUST call `await requireAuthPage()` first**, and **every Server Action MUST call `requireAuth()`**.

The only exceptions are `/login`, `/setup`, and the auth actions that back them.

`src/middleware.ts` is not a security boundary. It only checks that a session cookie is *present* — it never decrypts or validates one, and it cannot query the database because the Edge runtime cannot load `better-sqlite3`. A page that omits `requireAuthPage()` is therefore effectively public: middleware waves through any request carrying any cookie value.

Nothing enforces this mechanically. See `docs/adr/ADR-003-page-level-authorization-invariant.md`.

### Issue tracker


GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo (`CONTEXT.md` and `docs/adr/` at repo root). See `docs/agents/domain.md`.

### Deliberate departures from the design handoff

The UI is built from `docs/design_handoff_mobile_first/`. Seven places
deliberately differ from it — among them the missing `capture` on the photo
dropzone, the login screen's absent mode-switch link, the category picture
files deleted on update and delete, and `CategoryWithCount.newestItemImage`,
which the handoff calls `firstItemImage`.

**Before "fixing" a mismatch between the UI and that handoff, read
`docs/adr/ADR-004-odstepstwa-od-handoffu-mobile-first.md`.** Each entry is a
recorded decision with its reasoning; several of them undo a real defect that
literal compliance would reintroduce.
