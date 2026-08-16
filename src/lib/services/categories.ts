import { getDb } from '@/db';
import { categories, items, Category } from '@/db/schema';
import { eq, sql, count } from 'drizzle-orm';
import { deleteItemFiles } from '@/lib/storage';
import crypto from 'crypto';

export interface CategoryWithCount extends Category {
  itemCount: number;
}

export async function getCategories(): Promise<CategoryWithCount[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      itemCount: count(items.id),
    })
    .from(categories)
    .leftJoin(items, eq(items.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.name);

  return rows;
}

export async function getCategory(id: string): Promise<Category | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  return row || null;
}

export async function createCategory(name: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name cannot be empty');
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(categories)
    .where(sql`lower(${categories.name}) = lower(${trimmed})`)
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Category "${trimmed}" already exists`);
  }

  const now = new Date();
  const [created] = await db
    .insert(categories)
    .values({
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created;
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name cannot be empty');
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(categories)
    .where(sql`lower(${categories.name}) = lower(${trimmed}) and ${categories.id} != ${id}`)
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Category "${trimmed}" already exists`);
  }

  const now = new Date();
  const [updated] = await db
    .update(categories)
    .set({
      name: trimmed,
      updatedAt: now,
    })
    .where(eq(categories.id, id))
    .returning();

  if (!updated) {
    throw new Error('Category not found');
  }

  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getDb();
  // Find all items associated with this category to delete physical files
  const categoryItems = await db
    .select({
      mainImage: items.mainImage,
      additionalImages: items.additionalImages,
    })
    .from(items)
    .where(eq(items.categoryId, id));

  // Delete physical files
  for (const item of categoryItems) {
    await deleteItemFiles(item.mainImage, item.additionalImages || []);
  }

  // Delete category from DB (foreign key cascade deletes items in DB)
  await db.delete(categories).where(eq(categories.id, id));
}
