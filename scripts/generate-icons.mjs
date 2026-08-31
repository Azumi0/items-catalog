#!/usr/bin/env node
/**
 * Renders every app icon from the single vector master, assets/icon.svg.
 *
 * Run with `pnpm run icons` after editing the master, and commit the PNGs it
 * writes. This deliberately does NOT run during `pnpm build`: rasterising SVG
 * pulls librsvg into the build path and into the Docker image, to reproduce a
 * byte-identical result every time. The committed PNGs are also the only
 * version a reviewer can actually look at.
 *
 * Three things here look like tidying and are not:
 *
 * 1. The filenames are referenced from public/manifest.json and from
 *    metadata.icons in src/app/layout.tsx. Renaming a file without updating
 *    both leaves the PWA with no icon and nothing throws — tests/icons.test.ts
 *    exists to catch exactly that.
 *
 * 2. Overwriting an existing icon path in place instead of introducing a new
 *    filename does not reach an installed PWA. Android rebuilds its generated
 *    APK when the *manifest content* changes, not when bytes move under a URL
 *    it already fetched, so an in-place swap can leave the old icon on the
 *    home screen until reinstall.
 *
 * 3. app-icon-512.png is listed twice in the manifest, once plain and once
 *    with `purpose: "maskable"`. Collapsing that to a single `any maskable`
 *    entry lets a launcher drop the unmasked artwork into a masked slot, which
 *    adds a platform backdrop behind a tile that already has its own.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const master = join(root, 'assets', 'icon.svg');
const outDir = join(root, 'public', 'icons');

/** Every size we ship, and who consumes it. */
const TARGETS = [
  { size: 32, use: 'favicon, 1x tab strip' },
  { size: 48, use: 'favicon, bookmarks and history' },
  { size: 180, use: 'apple-touch-icon' },
  { size: 192, use: 'manifest' },
  { size: 512, use: 'manifest, plain and maskable' },
];

await mkdir(outDir, { recursive: true });

for (const { size, use } of TARGETS) {
  // density scales the SVG rasterisation itself rather than rendering at the
  // master's 512 and resampling down, so small sizes keep their edges.
  const png = await sharp(master, { density: (72 * size) / 512 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  const file = join(outDir, `app-icon-${size}.png`);
  await writeFile(file, png);
  console.log(`  app-icon-${size}.png  ${String(png.length).padStart(6)} B  — ${use}`);
}

console.log(`\n${TARGETS.length} icons written to public/icons/`);
