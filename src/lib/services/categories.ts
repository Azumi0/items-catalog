import { getDb } from '@/db';
import { categories, items, Category } from '@/db/schema';
import { eq, sql, count } from 'drizzle-orm';
import { deleteImage, deleteItemFiles } from '@/lib/storage';
import crypto from 'crypto';

export interface CategoryWithCount extends Category {
  itemCount: number;
  /**
   * `main_image` of the newest item in the category, or null when it has none.
   * The third step of the category visual fallback — see src/lib/categoryVisual.ts.
   */
  firstItemImage: string | null;
}

/**
 * The presentation columns a category form writes. Both are optional and
 * tri-state on update: omitted leaves the stored value alone, `null` clears it.
 */
export interface CategoryVisualInput {
  icon?: string | null;
  mainImage?: string | null;
}

/**
 * Correlated subquery rather than a second join: the outer statement already
 * joins `items` to count them, and joining it again for "newest row per group"
 * would need a window function SQLite only gained in 3.25.
 */
const firstItemImageSql = sql<
  string | null
>`(select ${items.mainImage} from ${items} where ${items.categoryId} = ${categories.id} order by ${items.createdAt} desc limit 1)`;

export async function getCategories(): Promise<CategoryWithCount[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      mainImage: categories.mainImage,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      itemCount: count(items.id),
      firstItemImage: firstItemImageSql,
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

export async function createCategory(
  name: string,
  visual: CategoryVisualInput = {}
): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Nazwa kategorii nie może być pusta.');
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(categories)
    .where(sql`lower(${categories.name}) = lower(${trimmed})`)
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Kategoria "${trimmed}" już istnieje.`);
  }

  const now = new Date();
  const [created] = await db
    .insert(categories)
    .values({
      id: crypto.randomUUID(),
      name: trimmed,
      icon: visual.icon ?? null,
      mainImage: visual.mainImage ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created;
}

export async function updateCategory(
  id: string,
  name: string,
  visual: CategoryVisualInput = {}
): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Nazwa kategorii nie może być pusta.');
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(categories)
    .where(sql`lower(${categories.name}) = lower(${trimmed}) and ${categories.id} != ${id}`)
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Kategoria "${trimmed}" już istnieje.`);
  }

  const current = await getCategory(id);
  if (!current) {
    throw new Error('Nie znaleziono kategorii.');
  }

  const now = new Date();
  const patch: Partial<typeof categories.$inferInsert> = {
    name: trimmed,
    updatedAt: now,
  };

  if (visual.icon !== undefined) {
    patch.icon = visual.icon;
  }
  if (visual.mainImage !== undefined) {
    patch.mainImage = visual.mainImage;
  }

  const [updated] = await db
    .update(categories)
    .set(patch)
    .where(eq(categories.id, id))
    .returning();

  // Only after the row stopped pointing at it. A file removed before a failed
  // write would leave the category referencing a picture that is gone.
  if (
    visual.mainImage !== undefined &&
    current.mainImage &&
    current.mainImage !== visual.mainImage
  ) {
    await deleteImage(current.mainImage);
  }

  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getDb();
  const category = await getCategory(id);

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

  if (category?.mainImage) {
    await deleteImage(category.mainImage);
  }

  // Delete category from DB (foreign key cascade deletes items in DB)
  await db.delete(categories).where(eq(categories.id, id));
}
