# Contributing to Home Item Catalog

First off, thank you for considering contributing to Home Item Catalog! Contributions from the community help make this a reliable, well-hardened self-hosted inventory solution.

---

## Code of Conduct

By participating in this project, you are expected to uphold a welcoming, respectful, and harassment-free environment for everyone. Please be considerate and respectful in issues, discussions, and pull requests.

---

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a helpful bug report. Following these guidelines helps maintainers reproduce the issue and resolve it quickly.

**Before Submitting A Bug Report:**

* Check the [GitHub Issues](https://github.com/Azumi0/items-catalog/issues) to verify if the issue has already been reported. If an open issue exists, add your details there instead of opening a duplicate.
* Confirm whether the issue is reproducible in local development or specifically related to Docker / Synology DSM deployment.

**Submitting A Good Bug Report:**

Bugs are tracked as [GitHub issues](https://github.com/Azumi0/items-catalog/issues). When filing a bug report, please provide:

* A clear, descriptive title.
* Exact step-by-step instructions to reproduce the issue.
* Expected behavior vs. actual behavior.
* Environment details: Node.js version, browser / mobile OS (e.g. Chrome on Android, Safari on iOS), deployment environment (Synology DSM Container Manager, Docker Compose, or local dev).
* Relevant container logs (ensure no secrets or sensitive personal info are included).
* Screenshots or screen recordings when relevant.

---

### Suggesting Enhancements

Feature requests and improvements are welcome!

**Submitting An Enhancement Suggestion:**

1. Check existing [GitHub issues](https://github.com/Azumi0/items-catalog/issues) to see if the feature has already been discussed.
2. Open an issue with a clear title and description.
3. Describe the problem your proposal solves and why it would be beneficial for household inventory management.
4. Provide concrete examples or UI/UX mockups if proposing interface changes.

---

### Pull Requests

When submitting a pull request, ensure it aligns with the project's core invariants and guidelines:

* **Package Manager:** Use `pnpm` exclusively for all package operations (`pnpm install`, `pnpm test`, `pnpm run build`). Never use `npm`, `yarn`, or `bun`.
* **Authorization Invariant:** Every `page.tsx` rendering protected content **must** call `await requireAuthPage()` first, and every Server Action **must** call `requireAuth()`. The only exceptions are `/login`, `/setup`, and the public authentication actions that back them. (See `docs/adr/ADR-003-page-level-authorization-invariant.md`).
* **Security & Hardening:** Do not weaken or bypass internet-facing hardening measures: login rate-limiting, the rightmost `X-Forwarded-For` hop rule, password length requirements (minimum 12 characters in production), decoy bcrypt comparison for unknown users, device cookies, and `session_version` database checks. (See `docs/adr/ADR-006` and `docs/adr/ADR-007`).
* **Outbound Network Requests:** The catalog is designed to run locally with zero external network requirements. The only exception is optional AI description generation via Google Gemini in `src/lib/gemini.ts`. Do not introduce new external network calls, external fonts, or external CDNs without an architectural decision record (ADR).
* **Documentation Language:** Please note that the detailed documentation, architectural decision records (ADRs), deployment guides, and design specifications located in `docs/` are written in **Polish**.
* **Verification:** Verify that all quality checks pass cleanly:
  ```bash
  pnpm typecheck   # Validates TypeScript types (tsc --noEmit)
  pnpm lint        # Runs ESLint (eslint .)
  pnpm test        # Runs Vitest unit and integration suite
  pnpm run build   # Verifies standalone Next.js production compilation
  ```

---

## Styleguides

### Git Commit Messages

This repository follows a strict and consistent commit history convention:

**Subject Line**

* Limit to 72 characters.
* Use imperative mood ("Add icon search caching", "Harden device cookie seal") or declarative descriptions of resulting behavior.
* No emoji prefixes.

**Body**

* Explain **why** rather than *what* — the diff already shows the code changes. Provide the rationale, architectural trade-offs, and constraints.
* Where relevant, note how the change was tested or cite the failing test that the commit resolves.
* Wrap lines at 72 characters.
* Reference issues and PR numbers where applicable.

---

### TypeScript & Code Styleguide

* **Strict typing:** Ensure all types are accurately defined (`noUnusedLocals` is enabled; avoid unnecessary `any`).
* **ESLint:** Run `pnpm lint` and resolve any issues.
* **Modern idioms:**
  * Prefer object spread (`{ ...obj }`) over `Object.assign()`.
  * Inline exports with variable/function definitions:
    ```typescript
    // Preferred:
    export const DEFAULT_PAGE_SIZE = 20;

    // Avoid:
    const DEFAULT_PAGE_SIZE = 20;
    export { DEFAULT_PAGE_SIZE };
    ```
  * Organize imports cleanly: external packages first, internal aliases (`@/...`), then relative local imports.

---

### Documentation Styleguide

* Write documentation in GitHub Flavored Markdown.
* Reference files using paths (e.g. `src/lib/auth.ts`).
* For non-trivial architectural choices, record them as Architecture Decision Records in `docs/adr/`.

---

## Issue and Pull Request Labels

We track issues and pull requests using the following triage roles:

* `needs-triage` — New issue or PR waiting for maintainer evaluation.
* `needs-info` — Waiting on reporter or author for additional details.
* `ready-for-agent` — Fully specified task ready for autonomous agent execution.
* `ready-for-human` — Task requiring human implementation or review.
* `wontfix` — Closed as out of scope or rejected.

---

Thank you for helping improve Home Item Catalog!
