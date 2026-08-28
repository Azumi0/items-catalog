#!/bin/sh
set -e

PUID=${PUID:-1000}
PGID=${PGID:-1000}

echo "Starting Home Item Catalog..."
echo "Using PUID: $PUID, PGID: $PGID"

# Create directories if they do not exist
mkdir -p /data/uploads/originals
mkdir -p /data/uploads/thumbs

# Adjust permissions for Synology DSM compatibility
chown -R "$PUID:$PGID" /data
chmod -R 775 /data

# Run database migrations.
#
# The runner image ships a single pre-bundled migrator: the Dockerfile builds
# dist/migrate.js with esbuild and copies it to ./migrate.js. There is no
# node_modules, no src/ and no package manager in this image, so the previous
# `npx tsx src/db/migrate.ts` fallback could never have run here — and `npx`
# is an npm entrypoint, which AGENTS.md forbids in this repo.
echo "Running database migrations..."
if [ -f "migrate.js" ]; then
  node migrate.js
else
  echo "FATAL: migrate.js not found — image was built incorrectly." >&2
  exit 1
fi

echo "Starting server..."
if command -v su-exec >/dev/null 2>&1; then
  exec su-exec "$PUID:$PGID" node server.js
else
  exec node server.js
fi
