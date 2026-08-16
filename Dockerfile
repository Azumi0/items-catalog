# 1. Base image
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat su-exec python3 make g++
RUN corepack enable && corepack prepare pnpm@latest --activate

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
RUN pnpm exec esbuild src/db/migrate.ts --bundle --platform=node --target=node20 --outfile=dist/migrate.js --external:better-sqlite3


# 4. Production Runner
FROM node:20-alpine AS runner
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
