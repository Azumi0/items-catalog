import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runMigrations } from '@/db/migrate';
import { closeDb, getDb } from '@/db';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/services/categories';
import { setupFirstUser } from '@/lib/services/users';
import { saveImage, getImagePath } from '@/lib/storage';
import { items } from '@/db/schema';
import fs from 'fs';
import path from 'path';
import { testTmpDir } from './helpers/tmpdir';
import sharp from 'sharp';
import crypto from 'crypto';

const TEST_DIR = testTmpDir('test-categories');
const TEST_DB_PATH = path.join(TEST_DIR, 'app.db');

describe('Categories Management Seam', () => {
  beforeEach(() => {
    closeDb();
    process.env.DATA_DIR = TEST_DIR;
    process.env.DATABASE_URL = TEST_DB_PATH;
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
    runMigrations();
  });

  afterEach(() => {
    closeDb();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    delete process.env.DATABASE_URL;
    delete process.env.DATA_DIR;
  });

  it('creates categories and prevents duplicates', async () => {
    const cat1 = await createCategory('Electronics');
    expect(cat1.id).toBeDefined();
    expect(cat1.name).toBe('Electronics');

    await expect(createCategory('Electronics')).rejects.toThrow(
      /już istnieje/i
    );
    await expect(createCategory('  electronics  ')).rejects.toThrow(
      /już istnieje/i
    );
  });

  it('updates category name', async () => {
    const cat = await createCategory('Tools');
    const updated = await updateCategory(cat.id, 'Power Tools');

    expect(updated.name).toBe('Power Tools');
    const all = await getCategories();
    expect(all[0].name).toBe('Power Tools');
  });

  it('deletes category and cleans up associated items and physical files', async () => {
    const user = await setupFirstUser('admin', 'admin123');
    const cat = await createCategory('Furniture');

    // Create a dummy image file
    const imgBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 100, g: 100, b: 100 } },
    }).jpeg().toBuffer();

    const savedMain = await saveImage(imgBuffer, 'chair.jpg');
    const savedAdd = await saveImage(imgBuffer, 'chair2.jpg');

    const db = getDb();
    const itemId = crypto.randomUUID();
    await db.insert(items).values({
      id: itemId,
      categoryId: cat.id,
      description: 'Wooden chair',
      mainImage: savedMain.filename,
      additionalImages: [savedAdd.filename],
      createdById: user.id,
      createdByName: user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(fs.existsSync(getImagePath('originals', savedMain.filename))).toBe(true);
    expect(fs.existsSync(getImagePath('originals', savedAdd.filename))).toBe(true);

    // Delete category
    await deleteCategory(cat.id);

    // Verify category is gone
    const allCats = await getCategories();
    expect(allCats.length).toBe(0);

    // Verify physical files are unlinked
    expect(fs.existsSync(getImagePath('originals', savedMain.filename))).toBe(false);
    expect(fs.existsSync(getImagePath('originals', savedAdd.filename))).toBe(false);
  });
});
