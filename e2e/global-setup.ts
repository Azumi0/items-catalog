import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { E2E_FIXTURE_DIR } from './constants';

/**
 * Photo fixtures are generated rather than committed: a real JPEG is what the
 * upload path needs (sharp has to decode it and emit a thumbnail), and
 * generating one keeps binaries out of the repo.
 */
export const MAIN_PHOTO = path.join(E2E_FIXTURE_DIR, 'main.jpg');
export const EXTRA_PHOTO = path.join(E2E_FIXTURE_DIR, 'extra.jpg');

async function writePhoto(file: string, color: string) {
  await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: color,
    },
  })
    .jpeg()
    .toFile(file);
}

export default async function globalSetup() {
  fs.rmSync(E2E_FIXTURE_DIR, { recursive: true, force: true });
  fs.mkdirSync(E2E_FIXTURE_DIR, { recursive: true });

  await writePhoto(MAIN_PHOTO, '#2f9e8f');
  await writePhoto(EXTRA_PHOTO, '#8f2f5e');
}
