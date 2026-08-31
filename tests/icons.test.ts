import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Every app icon is generated from assets/icon.svg by scripts/generate-icons.mjs
 * and then referenced from two places by literal path: public/manifest.json and
 * `metadata.icons` in src/app/layout.tsx.
 *
 * Nothing links those three. Rename a generated file, or change a size in the
 * master, and the reference keeps pointing at a path that no longer exists —
 * the build succeeds, the page renders, and the app simply has no icon. That is
 * exactly the failure this file exists to make loud, so it checks the
 * references against the bytes on disk rather than against each other.
 */

const ROOT = path.resolve(__dirname, '..');
const ICON_DIR = path.join(ROOT, 'public', 'icons');

/** Reads what a PNG actually is, not what its name or its caller claims. */
async function dimensionsOf(publicPath: string) {
  const file = path.join(ROOT, 'public', publicPath.replace(/^\//, ''));
  expect(fs.existsSync(file), `${publicPath} is referenced but missing on disk`).toBe(true);
  const { width, height, format } = await sharp(file).metadata();
  return { width, height, format };
}

type ManifestIcon = { src: string; sizes: string; type: string; purpose?: string };

function manifest(): { icons: ManifestIcon[] } {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'manifest.json'), 'utf8'));
}

/** Pulls `{ url: '…', sizes: 'NxN' }` pairs out of the layout's metadata. */
function layoutIcons(): { url: string; sizes: string }[] {
  const source = fs.readFileSync(path.join(ROOT, 'src', 'app', 'layout.tsx'), 'utf8');
  return [...source.matchAll(/url:\s*'([^']+)',\s*sizes:\s*'(\d+x\d+)'/g)].map((m) => ({
    url: m[1],
    sizes: m[2],
  }));
}

describe('App icon references', () => {
  it('resolves every manifest icon to a file of the declared size', async () => {
    const icons = manifest().icons;
    expect(icons.length).toBeGreaterThan(0);

    for (const icon of icons) {
      const { width, height, format } = await dimensionsOf(icon.src);
      expect(format).toBe('png');
      expect(`${width}x${height}`, `${icon.src} declares sizes="${icon.sizes}"`).toBe(icon.sizes);
    }
  });

  it('keeps a maskable entry, which is what rounds the icon on Android', () => {
    // Collapsing the plain and maskable entries into a single `any maskable`
    // reads as tidying and is not: it lets a launcher drop the unmasked tile
    // into a masked slot and add its own backdrop behind artwork that already
    // has one. See the header of scripts/generate-icons.mjs.
    const purposes = manifest().icons.map((i) => i.purpose);
    expect(purposes).toContain('maskable');
    expect(purposes).toContain(undefined);
  });

  it('resolves every favicon and apple-touch-icon declared in the layout', async () => {
    const icons = layoutIcons();
    // 32 and 48 for the tab strip, 180 for iOS. If this count drops, a
    // reference was deleted rather than repointed.
    expect(icons.length).toBe(3);

    for (const icon of icons) {
      const { width, height, format } = await dimensionsOf(icon.url);
      expect(format).toBe('png');
      expect(`${width}x${height}`, `${icon.url} declares sizes="${icon.sizes}"`).toBe(icon.sizes);
    }
  });

  it('leaves no generated icon unreferenced', () => {
    // Catches the other half of a rename: new files written, old ones left
    // behind, and nobody able to tell afterwards which set is live.
    const referenced = new Set([
      ...manifest().icons.map((i) => i.src),
      ...layoutIcons().map((i) => i.url),
    ]);
    const onDisk = fs.readdirSync(ICON_DIR).map((f) => `/icons/${f}`);

    expect(onDisk.sort()).toEqual([...referenced].sort());
  });
});
