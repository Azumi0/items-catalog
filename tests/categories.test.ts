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

  it('exposes the newest item main image as firstItemImage', async () => {
    const user = await setupFirstUser('admin', 'admin123');
    const cat = await createCategory('Tools');

    const db = getDb();
    const older = new Date('2026-01-01T10:00:00Z');
    const newer = new Date('2026-02-01T10:00:00Z');

    await db.insert(items).values({
      id: crypto.randomUUID(),
      categoryId: cat.id,
      description: 'older',
      mainImage: 'older.jpg',
      additionalImages: [],
      createdById: user.id,
      createdByName: user.username,
      createdAt: older,
      updatedAt: older,
    });
    await db.insert(items).values({
      id: crypto.randomUUID(),
      categoryId: cat.id,
      description: 'newer',
      mainImage: 'newer.jpg',
      additionalImages: [],
      createdById: user.id,
      createdByName: user.username,
      createdAt: newer,
      updatedAt: newer,
    });

    const [row] = await getCategories();
    expect(row.itemCount).toBe(2);
    expect(row.firstItemImage).toBe('newer.jpg');
  });

  it('reports firstItemImage as null for an empty category', async () => {
    await createCategory('Empty');

    const [row] = await getCategories();
    expect(row.itemCount).toBe(0);
    expect(row.firstItemImage).toBeNull();
  });

  it('stores the icon and the category image, and exposes them on the list', async () => {
    const created = await createCategory('Elektronika', {
      icon: 'IconDeviceLaptop',
      mainImage: 'hero.jpg',
    });

    expect(created.icon).toBe('IconDeviceLaptop');
    expect(created.mainImage).toBe('hero.jpg');

    const [row] = await getCategories();
    expect(row.icon).toBe('IconDeviceLaptop');
    expect(row.mainImage).toBe('hero.jpg');
  });

  it('leaves icon and image untouched when the update omits them', async () => {
    const cat = await createCategory('Narzedzia', { icon: 'IconTool' });

    const updated = await updateCategory(cat.id, 'Narzedzia domowe');

    expect(updated.name).toBe('Narzedzia domowe');
    expect(updated.icon).toBe('IconTool');
  });

  it('clears the icon when the update passes null', async () => {
    const cat = await createCategory('Ksiazki', { icon: 'IconBook' });

    const updated = await updateCategory(cat.id, 'Ksiazki', { icon: null });

    expect(updated.icon).toBeNull();
  });

  it('deletes the replaced category image from disk', async () => {
    const imgBuffer = await sharp({
      create: { width: 60, height: 60, channels: 3, background: { r: 10, g: 10, b: 10 } },
    }).jpeg().toBuffer();

    const first = await saveImage(imgBuffer, 'first.jpg');
    const second = await saveImage(imgBuffer, 'second.jpg');

    const cat = await createCategory('Ogrod', { mainImage: first.filename });
    await updateCategory(cat.id, 'Ogrod', { mainImage: second.filename });

    expect(fs.existsSync(getImagePath('originals', first.filename))).toBe(false);
    expect(fs.existsSync(getImagePath('originals', second.filename))).toBe(true);
  });

  it('deletes the category image when the category is removed', async () => {
    const imgBuffer = await sharp({
      create: { width: 60, height: 60, channels: 3, background: { r: 10, g: 10, b: 10 } },
    }).jpeg().toBuffer();

    const saved = await saveImage(imgBuffer, 'hero.jpg');
    const cat = await createCategory('Sport', { mainImage: saved.filename });

    await deleteCategory(cat.id);

    expect(fs.existsSync(getImagePath('originals', saved.filename))).toBe(false);
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
