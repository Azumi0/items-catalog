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

# Run database migrations
echo "Running database migrations..."
if [ -f "migrate.js" ]; then
  node migrate.js
elif [ -f "dist/migrate.js" ]; then
  node dist/migrate.js
elif [ -f "src/db/migrate.ts" ]; then
  npx tsx src/db/migrate.ts || true
fi

echo "Starting server..."
if command -v su-exec >/dev/null 2>&1; then
  exec su-exec "$PUID:$PGID" node server.js
else
  exec node server.js
fi
