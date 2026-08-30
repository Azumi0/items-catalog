## Agent skills

### Package manager

Use `pnpm` exclusively for all package operations and scripts (`pnpm install`, `pnpm <script>`, `pnpm test`, `pnpm dlx`). Never use `npm`, `yarn`, or `bun`.

### Dependency and Node upgrades

Bumping Node, pnpm, or any dependency — and adapting the codebase to a major —
follows a fixed procedure. Version strictness differs per surface, upgrades land
one per commit, and the baseline suite is written before anything moves. See
`docs/agents/dependency-upgrades.md`.

### Authorization invariant

**Every `page.tsx` rendering protected content MUST call `await requireAuthPage()` first**, and **every Server Action MUST call `requireAuth()`**.

The only exceptions are `/login`, `/setup`, and the auth actions that back them.

`src/proxy.ts` (Next 16's rename of `middleware.ts`) is not a security boundary. It only checks that a session cookie is *present* — it never decrypts or validates one, and it cannot query the database because the Edge runtime cannot load `better-sqlite3`. A page that omits `requireAuthPage()` is therefore effectively public: the proxy waves through any request carrying any cookie value.

Nothing enforces this mechanically. See `docs/adr/ADR-003-page-level-authorization-invariant.md`.

### Internet-facing hardening

This catalog is published to the internet through the DSM reverse proxy, so the login form is exposed to more than the household. Eight things exist because of that and are not spare parts:

- the throttle in `src/lib/loginThrottle.ts`, and its split into a trusted and a shared ledger;
- the rightmost-hop rule in `src/lib/requestIp.ts`;
- `MIN_PASSWORD_LENGTH = 12`;
- the decoy bcrypt comparison for unknown usernames;
- the device cookie in `src/lib/deviceCookie.ts`, and the fact that it is sealed with a *derived* key and validated *statelessly*;
- the `session_version` check in `getCurrentUser` (`src/lib/session.ts`), including its fail-closed behaviour on a database error;
- the absence of CSRF tokens, which is a decision and not an omission — see `next.config.mjs`;
- `sameSite: 'strict'` on both cookies.

Each has a plausible-looking "simplification" that quietly removes the protection — reading the leftmost `X-Forwarded-For` entry, returning early when the user is not found, lowering the password floor to make a test convenient, re-issuing the device cookie on every login so it "rotates", letting `getCurrentUser` trust the cookie alone to save a query, adding hidden CSRF tokens to "fix" their absence.

Read `docs/adr/ADR-006-hartowanie-pod-dostep-z-internetu.md` and `docs/adr/ADR-007-ciastko-urzadzenia-i-uniewaznianie-sesji.md` before touching any of them. ADR-007 supersedes one recorded cost in ADR-006; the rest of ADR-006 stands.

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

The category form's icon field comes from a second handoff,
`docs/design_handoff_icon_picker/`, which six places deliberately differ from —
among them the icon grid's column count, which adapts to the viewport instead
of staying at eight, and the icon library, which is code-split on the render
path and not only in the modal.

**Before "fixing" a mismatch between the UI and either handoff, read
`docs/adr/ADR-004-odstepstwa-od-handoffu-mobile-first.md` and
`docs/adr/ADR-005-odstepstwa-od-handoffu-icon-picker.md`.** Each entry is a
recorded decision with its reasoning; several of them undo a real defect that
literal compliance would reintroduce.
