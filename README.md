# Home Item Catalog

Self-hosted home inventory and item catalog progressive web application (PWA) designed for household users on Synology NAS and Docker environments.

---

## Features

- **Mobile-first Progressive Web App (PWA):** One single-column design that reflows to desktop without breakpoints, built with Mantine UI v7, with Light and Dark mode support. Navigation is a floating bottom bar with a contextual "+" button; every touch target is at least 44px.
- **Two-screen catalog:** Category tiles are the entry screen; picking one opens that category's items, where search and sorting live. Each category shows its own picture or icon, falling back to its newest item's photo and then to a monogram.
- **Item & Category Management:** Organize household items into categories, search instantly by description, and sort chronologically. Adding and editing happen on full screens with a sticky action bar; deletions confirm in a bottom sheet.
- **Optimized Media Pipeline:** Upload original images with automatic WebP thumbnail generation using `sharp`, served through authenticated endpoints.
- **Flat Authentication & Onboarding:** Simple multi-user household access secured with `iron-session` cookies and `bcryptjs`. Automatically redirects to `/setup` on initial launch.
- **Single-Volume Persistence:** SQLite database (`better-sqlite3` + Drizzle ORM) and uploads live in `/data`, making backups via Synology Hyper Backup straightforward.

---

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Standalone output)
- **UI Library:** [Mantine UI v7](https://mantine.dev/) & [Tabler Icons](https://tabler.io/icons)
- **Database & ORM:** SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) and [Drizzle ORM](https://orm.drizzle.team/)
- **Image Processing:** [sharp](https://sharp.pixelplumbing.com/)
- **Auth & Security:** [iron-session](https://github.com/vvo/iron-session) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Package Manager:** **[pnpm](https://pnpm.io/)**

---

## Package Manager (`pnpm`)

This project strictly uses **`pnpm`** as its package manager. Do not use `npm`, `yarn`, or `bun`.

Ensure `pnpm` is installed:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

---

## Environment Variables

| Variable | Default | Used by | Description |
| --- | --- | --- | --- |
| `SESSION_SECRET` | built-in fallback | `src/lib/auth.ts` | Encryption key for the `iron-session` cookie. **Minimum 32 characters.** Changing it invalidates all active sessions. |
| `DATA_DIR` | `/data` if it exists, otherwise `./data` | `src/lib/storage.ts`, `src/db/index.ts` | Root directory for the SQLite database and uploaded images. |
| `DATABASE_URL` | `<DATA_DIR>/app.db` | `src/db/index.ts`, `drizzle.config.ts` | Explicit path to the SQLite file. Overrides `DATA_DIR` for the database only. |
| `NODE_ENV` | `production` in the image | Next.js, `src/lib/auth.ts` | Also controls the `Secure` flag on the session cookie — see the warning below. |
| `PUID` / `PGID` | `1000` / `1000` | `entrypoint.sh` | UID/GID that owns `/data` inside the container. Set these to match the folder owner on Synology DSM to avoid `EACCES`. |
| `PORT` | `3000` | Next.js standalone server | Port the server listens on inside the container. |

> **Note:** earlier revisions of this document referenced `DATA_PATH`. That variable is **not** read anywhere in the code — use `DATA_DIR`.

### Generating a session secret

```bash
openssl rand -hex 32
```

If `SESSION_SECRET` is unset, the application falls back to a constant defined in `src/lib/auth.ts`. That value is public in this repository, so anyone who reads the source can forge a session cookie. Always set it outside local development.

---

## HTTPS is required in production

`src/lib/auth.ts` sets the session cookie with `secure: process.env.NODE_ENV === 'production'`. In the Docker image `NODE_ENV=production`, so browsers will **refuse to store the session cookie over plain HTTP**. The symptom is a login loop: credentials are accepted, but every subsequent request bounces back to `/login`.

Consequences:

- `http://<nas-ip>:3000` — login will not work. Use it only to confirm the container starts.
- `https://<nas-ip>:3000` — **will not work either.** The container speaks plain HTTP on port 3000; it terminates no TLS. A browser attempting a TLS handshake there gets `ERR_SSL_PROTOCOL_ERROR`.
- `http://localhost:3000` — works, because browsers treat `localhost` as a trustworthy origin. This is the supported way to test the production image on your own machine.
- A reverse proxy terminating TLS in front of port 3000 — the intended production setup.

Camera capture (`getUserMedia`) and "Add to Home Screen" also require a secure context, so a valid certificate matters beyond just login.

---

## Getting Started (Local Development)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set environment variables

Create a `.env.local` file (or provide environment variables):

```env
DATA_DIR=./data
SESSION_SECRET=change-this-to-a-secure-random-string-with-at-least-32-chars
```

### 3. Run database migrations

```bash
pnpm db:migrate
```

### 4. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. On first run, navigate to `/setup` to create the initial user.

`pnpm dev` runs with `NODE_ENV=development`, so the session cookie is not marked `Secure` and plain HTTP works from any host on your network.

---

## Project Structure

```
src/
  app/
    actions/          Server Actions — auth, categories, items, users
    api/images/       Authenticated image route (originals + thumbs)
    page.tsx          Catalog entry screen: the category tiles
    categories/       Category management, the category form, and
                      [id]/items — the items of one category
    items/            Item detail, new and edit pages
    login/  setup/    Public pages: sign-in and first-run onboarding
    users/            User management, the new-user and password forms
    layout.tsx        MantineProvider, Notifications, viewport, SW registration
  components/         AppLayout (top bar, bottom nav, FAB), CategoryTiles,
                      CategoryItemsList, CategoriesManager, UsersManager,
                      CategoryForm, UserForm, ItemForm, CategoryVisual,
                      ConfirmSheet, FormActionBar, FormField, AutoGrid,
                      ImageDropzone, ImageLightboxModal, AuthScreen,
                      ServiceWorkerRegistration
  hooks/              useActionRunner, useImagePreviews
  lib/
    auth.ts           Session options, secret validation, password hashing
    session.ts        getSession, requireAuth, requireAuthPage
    storage.ts        Image writes, thumbnail generation, deletion
    images.ts         Image URL builders and inline placeholders
    categoryVisual.ts   The category image/icon/derived/monogram fallback
    categoryVisualPatch.ts  What a category form submission changes
    categoryIcons.ts  The Tabler glyphs a category can be given
    itemCount.ts      "1 przedmiot" / "N przedmiotów"
    services/         Data access: categories, items, users
  db/                 Drizzle schema, connection, migrator
  middleware.ts       Cookie-presence fast path (not a security boundary)

public/
  manifest.json       Web App Manifest
  sw.js               Minimal pass-through service worker (installability only)
  icons/              PWA icons (192, 512, maskable)

tests/                Vitest suite, one file per seam
  helpers/            Shared fixture-path helper

drizzle/              Generated SQL migrations and snapshots

docs/
  initial-prompt.md   The originating specification (archived, Polish)
  design_handoff_mobile_first/  The mobile-first redesign handoff: screen
                      specifications, prototypes and screenshots
  adr/                Architecture decision records
  agents/             Agent conventions: issue tracker, triage labels, domain
  deployment-synology.md

AGENTS.md             Rules agents must follow in this repo
CONTEXT.md            Ubiquitous domain language
eslint.config.mjs     ESLint 9 flat config
Dockerfile            Multi-stage build (base, deps, builder, runner)
entrypoint.sh         PUID/PGID handling, migrations, server start
docker-compose.yml            Local build and run
docker-compose.synology.yml   NAS deployment from a pre-built image
```

Note that `docs/initial-prompt.md` §5 lists only the files the original
generation pass was asked to produce. The tree above is the current, complete
inventory; the agent-facing and deployment documents were added afterwards.

---

## Available Scripts

All scripts are executed via `pnpm`:

| Command | Description |
| --- | --- |
| `pnpm dev` | Starts Next.js development server |
| `pnpm build` | Compiles application for production (standalone mode) |
| `pnpm start` | Runs the compiled Next.js production server |
| `pnpm test` | Runs the test suite once via Vitest |
| `pnpm test:watch` | Runs Vitest in watch mode |
| `pnpm lint` | Runs ESLint across the project |
| `pnpm lint:fix` | Runs ESLint and applies fixable changes |
| `pnpm typecheck` | Validates TypeScript types (`tsc --noEmit`) |
| `pnpm db:generate` | Generates Drizzle migration files from schema |
| `pnpm db:push` | Pushes schema changes directly to SQLite database |
| `pnpm db:migrate` | Applies pending Drizzle migrations |

---

## Deployment (Docker)

Two compose files ship with the repository:

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Local/dev deployment. Builds the image from source via the `build:` section. |
| `docker-compose.synology.yml` | Synology Container Manager. No `build:` section — runs a pre-built image imported into DSM, published on loopback only for the DSM reverse proxy. |
| `.env.example` | Template for the `.env` file that supplies `SESSION_SECRET` to `docker-compose.yml`. |

### Building the image

```bash
docker build -t home-item-catalog:1.0.0 .
```

The build compiles `better-sqlite3` and `sharp` natively, so expect several minutes. Prefer versioned tags over `latest`: rolling back then means editing one line of compose instead of rebuilding.

Verify the architecture matches your target host — Synology models with Intel/AMD CPUs need `linux/amd64`, ARM models need `linux/arm64`:

```bash
docker image inspect home-item-catalog:1.0.0 --format "{{.Os}}/{{.Architecture}}"
```

### Running

`docker-compose.yml` reads `SESSION_SECRET` from a `.env` file beside it and refuses to start without one:

```bash
cp .env.example .env
openssl rand -hex 32   # paste into .env
docker compose up -d
```

Then browse to `http://localhost:3000` and create the first user at `/setup`. Use `localhost`, not the machine's IP — see [HTTPS is required in production](#https-is-required-in-production).

### Build troubleshooting

**`esbuild: not found` during `pnpm exec esbuild`** — `esbuild` is only a transitive dependency of `drizzle-kit`, and pnpm does not link binaries of transitive dependencies into `node_modules/.bin`. Add it as a direct dev dependency and commit the updated lockfile:

```bash
pnpm add -D esbuild
```

**Container exits immediately with `no such file or directory`** — `entrypoint.sh` was checked out with CRLF line endings, so the kernel looks for an interpreter literally named `/bin/sh\r`. The repository ships a `.gitattributes` pinning `eol=lf`; if you cloned before it existed, run `git add --renormalize .` and re-checkout the working tree.

**`EACCES` / permission denied on `/data`** — `PUID`/`PGID` do not match the owner of the mounted host directory. On DSM, run `id <your-user>` over SSH and use the reported values.

---

## Deployment on Synology NAS

### 1. Import the image

Build and export the image on a workstation, then import it into DSM rather than building on the NAS — a Next.js build plus native compilation of `sharp` is slow on NAS hardware and can exhaust available RAM.

```bash
docker save home-item-catalog:1.0.0 -o home-item-catalog-1.0.0.tar
```

In DSM: **Container Manager → Image → Action → Import → Add from file**, choosing either *From local device* (uploads through the browser) or *From this DSM system* (after copying the `.tar` in via File Station).

### 2. Prepare the project folder

```
/volume1/docker/items-catalog/
├── docker-compose.yml     <- contents of docker-compose.synology.yml
└── data/                  <- empty; app.db and uploads/ are created on first start
```

Determine the correct `PUID`/`PGID` over SSH:

```bash
id <your-dsm-user>
# uid=1026(user) gid=100(users)
```

### 3. Create the project

**Container Manager → Project → Create**, pointing at `/volume1/docker/items-catalog` and using the contents of `docker-compose.synology.yml`:

```yaml
services:
  item-catalog:
    image: home-item-catalog:1.0.0
    container_name: item-catalog
    restart: unless-stopped
    ports:
      # Loopback only: reachable by the DSM reverse proxy, invisible from the LAN.
      - "127.0.0.1:3000:3000"
    volumes:
      - ./data:/data
    environment:
      - NODE_ENV=production
      - DATA_DIR=/data
      - PUID=1026
      - PGID=100
      - SESSION_SECRET=<your-random-32-plus-character-string>
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

Publishing the port on `127.0.0.1` rather than `0.0.0.0` means the only route into the application is the reverse proxy — port 3000 is not exposed to the LAN at all. The DSM reverse proxy runs on the host, so `localhost:3000` still resolves for it. The trade-off is that you cannot reach `http://<nas-ip>:3000` even for a quick check; switch the mapping back to `"3000:3000"` temporarily if you need to debug before the proxy is configured.

Do not use the repository's `docker-compose.yml` here — its `build:` section would make Container Manager compile the application on the NAS.

If the project fails to start with `pull access denied`, Container Manager is trying to fetch the image from a registry instead of using the imported one. Confirm the tag matches the entry under **Image** exactly, and add `pull_policy: never` to the service.

### 4. Auto-start

`restart: unless-stopped` brings the container back after a DSM reboot. Two caveats: a container you stopped **manually** stays stopped by design, and the Container Manager package itself must be set to start automatically.

If the data volume is encrypted or mounts later than the Docker daemon, add a boot-triggered task under **Control Panel → Task Scheduler** (user `root`, event *Boot-up*):

```bash
sleep 120
/usr/local/bin/docker compose -f /volume1/docker/items-catalog/docker-compose.yml up -d
```

### 5. HTTPS via DSM reverse proxy

Required for login to work at all — see [HTTPS is required in production](#https-is-required-in-production).

Issue a certificate under **Control Panel → Security → Certificate**. For a LAN-only deployment, a wildcard certificate for a Synology DDNS hostname (`*.example.synology.me`) is validated over DNS-01 and needs no router port forwarding; point the hostname at the NAS's LAN address with a local DNS record so it resolves internally.

Then **Control Panel → Login Portal → Advanced → Reverse Proxy → Create**:

| Section | Field | Value |
| --- | --- | --- |
| Source | Protocol | HTTPS |
| Source | Hostname | `catalog.example.synology.me` |
| Source | Port | 443 |
| Destination | Protocol | HTTP |
| Destination | Hostname | `localhost` |
| Destination | Port | 3000 |

Under **Custom Header**, add the built-in *WebSocket* preset plus `X-Forwarded-Proto: https` and `X-Forwarded-For: $proxy_add_x_forwarded_for`. Finally assign the certificate to the new reverse proxy service under **Control Panel → Security → Certificate → Settings**.

Avoid pointing the proxy at a bare IP address: certificate authorities do not issue publicly trusted certificates for IP addresses, and a self-signed certificate leaves every visit behind a browser interstitial — which browsers may still treat as an untrustworthy context for camera access and PWA installation.

If uploading photos returns `413 Request Entity Too Large`, DSM's nginx is capping the request body below the 20 MB Server Actions limit in `next.config.mjs`:

```bash
echo 'client_max_body_size 50m;' | sudo tee /usr/local/etc/nginx/conf.d/items-catalog.conf
sudo synosystemctl restart nginx
```

### 6. Backup

All state lives in `/volume1/docker/items-catalog/data`; everything else is reproducible from the image. Back up that single folder with Hyper Backup.

SQLite runs in WAL mode (`journal_mode = WAL`), so a live copy can capture a partial transaction. For a consistent backup, either stop the project for the duration or back up a Btrfs snapshot via Snapshot Replication.

---

## Documentation & Architecture

- [CONTEXT.md](CONTEXT.md) – Ubiquitous domain language, entity definitions, and naming conventions.
- [docs/deployment-synology.md](docs/deployment-synology.md) – Step-by-step deployment walkthrough for Synology Container Manager (Polish), covering image import, project setup, auto-start and the reverse proxy.
- [docs/adr/ADR-001-item-catalog-pwa-architecture.md](docs/adr/ADR-001-item-catalog-pwa-architecture.md) – Architecture decision record covering data model, security, and Synology deployment.
- [docs/adr/ADR-002-interactive-image-lightbox-zoom-pan.md](docs/adr/ADR-002-interactive-image-lightbox-zoom-pan.md) – Lightbox zoom and pan behaviour, and why pinch-to-zoom is component-scoped rather than global.
- [docs/adr/ADR-003-page-level-authorization-invariant.md](docs/adr/ADR-003-page-level-authorization-invariant.md) – Why `requireAuthPage()` is the real access guard and middleware is not a security boundary.
- [docs/adr/ADR-004-odstepstwa-od-handoffu-mobile-first.md](docs/adr/ADR-004-odstepstwa-od-handoffu-mobile-first.md) – The closed list of places where the mobile-first redesign deliberately departs from its design handoff, and why each one is not a bug.
- [docs/design_handoff_mobile_first/README.md](docs/design_handoff_mobile_first/README.md) – The mobile-first design handoff: screen specifications, prototypes and screenshots (Polish).
- [AGENTS.md](AGENTS.md) – Rules agents must follow when working in this repository.
- [docs/initial-prompt.md](docs/initial-prompt.md) – The originating specification (Polish, archived).
