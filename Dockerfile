# 1. Base image
# Wersja przypieta dokladnie (nie node:24-alpine): obraz jest artefaktem
# odtwarzalnym, wiec podbicie patcha ma byc swiadoma zmiana w repo.
# Dolny prog nadal obowiazuje: pnpm 11 wymaga Node >= 22.13, bo korzysta
# z wbudowanego modulu node:sqlite. 24.18.0 spelnia go z zapasem.
FROM node:24.18.0-alpine AS base
RUN apk add --no-cache libc6-compat su-exec python3 make g++
# Bez --activate/@latest: corepack pobiera dokladnie wersje z pola packageManager.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# 2. Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm run build
RUN pnpm exec esbuild src/db/migrate.ts --bundle --platform=node --target=node24 --outfile=dist/migrate.js --external:better-sqlite3


# 4. Production Runner
FROM node:24.18.0-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat su-exec

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create unprivileged user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built artifacts and standalone server
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/dist/migrate.js ./migrate.js
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

VOLUME ["/data"]
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
