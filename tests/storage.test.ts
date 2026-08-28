import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { testTmpDir } from './helpers/tmpdir';
import sharp from 'sharp';
import {
  saveImage,
  deleteImage,
  getImagePath,
  deleteItemFiles,
  getUploadDirs,
} from '@/lib/storage';

const TEST_DATA_DIR = testTmpDir('test-storage');

describe('Storage & Media Processing Seam', () => {
  beforeEach(() => {
    process.env.DATA_DIR = TEST_DATA_DIR;
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    delete process.env.DATA_DIR;
  });

  it('saves an image original and generates a webp thumbnail (max 400x400)', async () => {
    // Create a 800x600 test image in memory with sharp
    const testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await saveImage(testImageBuffer, 'photo.jpg');

    expect(result.filename).toBeDefined();
    expect(result.thumbFilename).toBeDefined();
    expect(result.thumbFilename).toMatch(/\.webp$/);

    const originalPath = getImagePath('originals', result.filename);
    const thumbPath = getImagePath('thumbs', result.thumbFilename);

    expect(fs.existsSync(originalPath)).toBe(true);
    expect(fs.existsSync(thumbPath)).toBe(true);

    // Verify getImagePath resolves thumbnail even when queried with original filename (.jpg)
    const resolvedThumbPath = getImagePath('thumbs', result.filename);
    expect(fs.existsSync(resolvedThumbPath)).toBe(true);
    expect(resolvedThumbPath).toBe(thumbPath);

    // Verify thumbnail dimensions <= 400x400 and format is webp
    const thumbMetadata = await sharp(thumbPath).metadata();
    expect(thumbMetadata.format).toBe('webp');
    expect(thumbMetadata.width).toBeLessThanOrEqual(400);
    expect(thumbMetadata.height).toBeLessThanOrEqual(400);
  });

  it('deletes both original and thumbnail files when deleteImage is called', async () => {
    const testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const saved = await saveImage(testImageBuffer, 'test.png');
    const originalPath = getImagePath('originals', saved.filename);
    const thumbPath = getImagePath('thumbs', saved.thumbFilename);

    expect(fs.existsSync(originalPath)).toBe(true);
    expect(fs.existsSync(thumbPath)).toBe(true);

    await deleteImage(saved.filename, saved.thumbFilename);

    expect(fs.existsSync(originalPath)).toBe(false);
    expect(fs.existsSync(thumbPath)).toBe(false);
  });

  it('deletes all files for an item via deleteItemFiles', async () => {
    const buffer1 = await sharp({
      create: { width: 50, height: 50, channels: 3, background: { r: 0, g: 0, b: 255 } },
    }).jpeg().toBuffer();
    const buffer2 = await sharp({
      create: { width: 50, height: 50, channels: 3, background: { r: 255, g: 255, b: 0 } },
    }).jpeg().toBuffer();

    const main = await saveImage(buffer1, 'main.jpg');
    const add1 = await saveImage(buffer2, 'extra.jpg');

    await deleteItemFiles(main.filename, [add1.filename]);

    expect(fs.existsSync(getImagePath('originals', main.filename))).toBe(false);
    expect(fs.existsSync(getImagePath('originals', add1.filename))).toBe(false);
  });
});
