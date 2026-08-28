import { getDb } from '@/db';
import { items, categories, Item } from '@/db/schema';
import { eq, desc, asc, and, like } from 'drizzle-orm';
import { deleteImage, deleteItemFiles } from '@/lib/storage';
import crypto from 'crypto';

export interface ItemWithCategory extends Item {
  categoryName: string;
}

export interface GetItemsOptions {
  categoryId?: string;
  search?: string;
  sortOrder?: 'newest' | 'oldest';
}

export async function getItems(
  options: GetItemsOptions = {}
): Promise<ItemWithCategory[]> {
  const db = getDb();
  const { categoryId, search, sortOrder = 'newest' } = options;

  const conditions = [];

  if (categoryId && categoryId !== 'all') {
    conditions.push(eq(items.categoryId, categoryId));
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    // description is nullable. `LIKE` yields NULL against a NULL column, which
    // excludes description-less items from search results — the intended
    // behaviour, and what the client-side filter in ItemsCatalog does too.
    // See the characterisation test in tests/items.test.ts.
    conditions.push(like(items.description, term));
  }

  const orderByClause =
    sortOrder === 'oldest' ? asc(items.createdAt) : desc(items.createdAt);

  const query = db
    .select({
      id: items.id,
      categoryId: items.categoryId,
      description: items.description,
      mainImage: items.mainImage,
      additionalImages: items.additionalImages,
      createdById: items.createdById,
      createdByName: items.createdByName,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
      categoryName: categories.name,
    })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderByClause);

  return query;
}

export async function getItem(id: string): Promise<ItemWithCategory | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: items.id,
      categoryId: items.categoryId,
      description: items.description,
      mainImage: items.mainImage,
      additionalImages: items.additionalImages,
      createdById: items.createdById,
      createdByName: items.createdByName,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
      categoryName: categories.name,
    })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.id, id))
    .limit(1);

  return row || null;
}

export interface CreateItemInput {
  categoryId: string;
  description?: string;
  mainImage: string;
  additionalImages?: string[];
  createdById: string;
  createdByName: string;
}

export async function createItem(data: CreateItemInput): Promise<Item> {
  const db = getDb();
  const now = new Date();

  const [created] = await db
    .insert(items)
    .values({
      id: crypto.randomUUID(),
      categoryId: data.categoryId,
      description: data.description?.trim() || null,
      mainImage: data.mainImage,
      additionalImages: data.additionalImages || [],
      createdById: data.createdById,
      createdByName: data.createdByName,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created;
}

export interface UpdateItemInput {
  categoryId?: string;
  description?: string;
  mainImage?: string;
  additionalImages?: string[];
}

export async function updateItem(
  id: string,
  data: UpdateItemInput
): Promise<Item> {
  const db = getDb();
  const existing = await getItem(id);
  if (!existing) {
    throw new Error('Nie znaleziono przedmiotu.');
  }

  // If mainImage was changed, delete the old main image
  if (data.mainImage && data.mainImage !== existing.mainImage) {
    await deleteImage(existing.mainImage);
  }

  // If additionalImages changed, clean up removed images
  if (data.additionalImages) {
    const existingSet = new Set(existing.additionalImages || []);
    const newSet = new Set(data.additionalImages);
    for (const oldImg of existingSet) {
      if (!newSet.has(oldImg)) {
        await deleteImage(oldImg);
      }
    }
  }

  const now = new Date();
  const updateData: Partial<typeof items.$inferInsert> = {
    updatedAt: now,
  };

  if (data.categoryId !== undefined) {
    updateData.categoryId = data.categoryId;
  }
  if (data.description !== undefined) {
    updateData.description = data.description.trim() || null;
  }
  if (data.mainImage !== undefined) {
    updateData.mainImage = data.mainImage;
  }
  if (data.additionalImages !== undefined) {
    updateData.additionalImages = data.additionalImages;
  }

  const [updated] = await db
    .update(items)
    .set(updateData)
    .where(eq(items.id, id))
    .returning();

  return updated;
}

export async function deleteItem(id: string): Promise<void> {
  const db = getDb();
  const existing = await getItem(id);
  if (!existing) {
    return;
  }

  await deleteItemFiles(existing.mainImage, existing.additionalImages || []);
  await db.delete(items).where(eq(items.id, id));
}
