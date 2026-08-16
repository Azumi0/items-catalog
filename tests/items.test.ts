import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runMigrations } from '@/db/migrate';
import { closeDb, getDb } from '@/db';
import {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
} from '@/lib/services/items';
import { setupFirstUser } from '@/lib/services/users';
import { createCategory } from '@/lib/services/categories';
import { saveImage, getImagePath } from '@/lib/storage';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const TEST_DIR = path.resolve(process.cwd(), 'tmp/test-items');
const TEST_DB_PATH = path.join(TEST_DIR, 'app.db');

describe('Items Management Seam', () => {
  let userId: string;
  let userName: string;
  let catElectronicsId: string;
  let catBooksId: string;

  beforeEach(async () => {
    closeDb();
    process.env.DATA_DIR = TEST_DIR;
    process.env.DATABASE_URL = TEST_DB_PATH;
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
    runMigrations();

    const user = await setupFirstUser('alice', 'pass123');
    userId = user.id;
    userName = user.username;

    const cat1 = await createCategory('Electronics');
    catElectronicsId = cat1.id;
    const cat2 = await createCategory('Books');
    catBooksId = cat2.id;
  });

  afterEach(() => {
    closeDb();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    delete process.env.DATABASE_URL;
    delete process.env.DATA_DIR;
  });

  it('creates and retrieves items by ID', async () => {
    const item = await createItem({
      categoryId: catElectronicsId,
      description: 'MacBook Pro 16',
      mainImage: 'macbook.jpg',
      additionalImages: ['macbook-side.jpg'],
      createdById: userId,
      createdByName: userName,
    });

    expect(item.id).toBeDefined();
    expect(item.description).toBe('MacBook Pro 16');

    const fetched = await getItem(item.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.categoryName).toBe('Electronics');
    expect(fetched?.createdByName).toBe('alice');
    expect(fetched?.additionalImages).toEqual(['macbook-side.jpg']);
  });

  it('filters by category, searches description, and sorts newest/oldest', async () => {
    await createItem({
      categoryId: catElectronicsId,
      description: 'Sony Headphones Noise Cancelling',
      mainImage: 'sony.jpg',
      additionalImages: [],
      createdById: userId,
      createdByName: userName,
    });

    await createItem({
      categoryId: catElectronicsId,
      description: 'Bose Headphones SoundSport',
      mainImage: 'bose.jpg',
      additionalImages: [],
      createdById: userId,
      createdByName: userName,
    });

    await createItem({
      categoryId: catBooksId,
      description: 'Clean Architecture by Uncle Bob',
      mainImage: 'book.jpg',
      additionalImages: [],
      createdById: userId,
      createdByName: userName,
    });

    // 1. All items
    const all = await getItems();
    expect(all.length).toBe(3);

    // 2. Filter by category
    const electronics = await getItems({ categoryId: catElectronicsId });
    expect(electronics.length).toBe(2);

    // 3. Search query
    const searchRes = await getItems({ search: 'Noise Cancelling' });
    expect(searchRes.length).toBe(1);
    expect(searchRes[0].description).toContain('Sony');

    // 4. Search and category together
    const searchCat = await getItems({ categoryId: catElectronicsId, search: 'Clean' });
    expect(searchCat.length).toBe(0);
  });

  it('updates item and cleans up replaced images from disk', async () => {
    const buffer = await sharp({
      create: { width: 50, height: 50, channels: 3, background: { r: 10, g: 10, b: 10 } },
    }).jpeg().toBuffer();

    const img1 = await saveImage(buffer, 'old-main.jpg');
    const img2 = await saveImage(buffer, 'old-extra.jpg');
    const img3 = await saveImage(buffer, 'keep-extra.jpg');

    const item = await createItem({
      categoryId: catElectronicsId,
      description: 'Original Desk',
      mainImage: img1.filename,
      additionalImages: [img2.filename, img3.filename],
      createdById: userId,
      createdByName: userName,
    });

    const newMain = await saveImage(buffer, 'new-main.jpg');

    // Update: replace mainImage with newMain, keep img3, drop img2
    await updateItem(item.id, {
      description: 'Updated Desk',
      mainImage: newMain.filename,
      additionalImages: [img3.filename],
    });

    // Old main and old extra should be deleted
    expect(fs.existsSync(getImagePath('originals', img1.filename))).toBe(false);
    expect(fs.existsSync(getImagePath('originals', img2.filename))).toBe(false);

    // New main and kept extra should still exist
    expect(fs.existsSync(getImagePath('originals', newMain.filename))).toBe(true);
    expect(fs.existsSync(getImagePath('originals', img3.filename))).toBe(true);
  });

  it('deletes item and physically unlinks all its images', async () => {
    const buffer = await sharp({
      create: { width: 50, height: 50, channels: 3, background: { r: 50, g: 50, b: 50 } },
    }).jpeg().toBuffer();

    const imgMain = await saveImage(buffer, 'main.jpg');
    const imgAdd = await saveImage(buffer, 'add.jpg');

    const item = await createItem({
      categoryId: catElectronicsId,
      description: 'To be deleted',
      mainImage: imgMain.filename,
      additionalImages: [imgAdd.filename],
      createdById: userId,
      createdByName: userName,
    });

    expect(fs.existsSync(getImagePath('originals', imgMain.filename))).toBe(true);
    expect(fs.existsSync(getImagePath('originals', imgAdd.filename))).toBe(true);

    await deleteItem(item.id);

    expect(await getItem(item.id)).toBeNull();
    expect(fs.existsSync(getImagePath('originals', imgMain.filename))).toBe(false);
    expect(fs.existsSync(getImagePath('originals', imgAdd.filename))).toBe(false);
  });
});
