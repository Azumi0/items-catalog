# Home Item Catalog

Self-hosted home inventory and item catalog progressive web application (PWA) designed for household users on Synology NAS and Docker environments.

---

## Features

- **Progressive Web App (PWA):** Responsive UI optimized for mobile and desktop, built with Mantine UI v7, with Light and Dark mode support.
- **Item & Category Management:** Organize household items into categories, search instantly by description, and sort chronologically.
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

## Getting Started (Local Development)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set environment variables

Create a `.env.local` file (or provide environment variables):

```env
DATA_PATH=./data
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
| `pnpm typecheck` | Validates TypeScript types (`tsc --noEmit`) |
| `pnpm db:generate` | Generates Drizzle migration files from schema |
| `pnpm db:push` | Pushes schema changes directly to SQLite database |
| `pnpm db:migrate` | Applies pending Drizzle migrations |

---

## Deployment (Docker & Synology NAS)

The application is containerized for deployment via Synology Container Manager or standard Docker Compose.

### Docker Compose

```yaml
services:
  app:
    image: ghcr.io/azumi0/items-catalog:latest # or build locally
    container_name: home-item-catalog
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PUID=1000
      - PGID=1000
      - SESSION_SECRET=your-secure-random-session-secret-min-32-chars
      - DATA_PATH=/data
    volumes:
      - ./data:/data
```

Start the container:

```bash
docker compose up -d
```

---

## Documentation & Architecture

- [CONTEXT.md](CONTEXT.md) – Ubiquitous domain language, entity definitions, and naming conventions.
- [docs/adr/ADR-001-item-catalog-pwa-architecture.md](docs/adr/ADR-001-item-catalog-pwa-architecture.md) – Architecture decision record covering data model, security, and Synology deployment.
