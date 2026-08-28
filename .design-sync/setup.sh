#!/usr/bin/env bash
# Prepares everything the design-sync converter needs that `pnpm install` does
# not produce. Safe to re-run; run it from the repo root before every sync,
# and after any `pnpm install` (which wipes the shim below).
#
#   bash .design-sync/setup.sh
#
# Three pieces:
#
# 1. node_modules/home-item-catalog — the converter resolves the design system
#    as an installed package (node_modules/<pkg>/package.json). pnpm never
#    self-installs a private app, so we build a shim. It must NOT be a symlink
#    to the repo root: the converter's ts-morph pass walks the package's
#    descendants, and repo-root/node_modules/home-item-catalog -> repo-root is
#    an infinite directory cycle that dies with ELOOP (or OOMs first). A real
#    directory holding a package.json plus a symlink to src/ has no cycle.
#
# 2. mantine-styles.css — the design system's stylesheet. Mantine ships three
#    separate ones, all self-contained (no @import, no url()), and cfg.cssEntry
#    takes a single file bounded to the package dir. Concatenating them there
#    is the whole story; regenerate whenever @mantine/* is upgraded.
#
# 3. .design-sync/node_modules — lets .design-sync/overrides/dts.mjs resolve
#    its bare `ts-morph` import from the staged converter's deps. Gitignored,
#    so it needs recreating on every fresh clone.
set -euo pipefail

cd "$(dirname "$0")/.."
root=$(pwd)
shim=node_modules/home-item-catalog

[ -d node_modules/@mantine/core ] || { echo "run pnpm install first" >&2; exit 1; }

rm -rf "$shim"
mkdir -p "$shim/.design-sync"
ln -s ../../src "$shim/src"
node -e '
  const fs = require("fs");
  const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
  fs.writeFileSync(
    process.argv[1] + "/package.json",
    JSON.stringify({ name: p.name, version: p.version, private: true }, null, 2) + "\n",
  );
' "$shim"

# cfg.tsconfig and cfg.cssEntry resolve relative to the package dir, so both
# have to be reachable from the shim. Link them item by item rather than
# linking .design-sync wholesale — that directory also holds the
# node_modules link from step 3, and pulling the converter's own dependency
# tree under the package makes the ts-morph descendant walk needlessly huge.
# tsconfig.sync.json's baseUrl ("..") lands on the repo root from its real
# home and on the shim from here; both resolve src/* and the stubs correctly.
ln -s ../../../.design-sync/tsconfig.sync.json "$shim/.design-sync/tsconfig.sync.json"
ln -s ../../../.design-sync/stubs "$shim/.design-sync/stubs"
ln -s ../../../.design-sync/screens.ts "$shim/.design-sync/screens.ts"
ln -s ../../../.design-sync/docs "$shim/.design-sync/docs"
ln -s ../../../.design-sync/screens "$shim/.design-sync/screens"

cat node_modules/@mantine/core/styles.css \
    node_modules/@mantine/notifications/styles.css \
    node_modules/@mantine/dropzone/styles.css > "$shim/.design-sync/mantine-styles.css"

ln -sfn ../.ds-sync/node_modules .design-sync/node_modules

echo "shim:   $root/$shim"
echo "styles: $(wc -c < "$shim/.design-sync/mantine-styles.css") bytes"
