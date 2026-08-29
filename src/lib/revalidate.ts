import { revalidatePath } from 'next/cache';

/**
 * Every screen whose content is derived from a category: the tiles (counts and
 * the borrowed item photo), the management list, and that category's own item
 * list. Item writes change all three just as category writes do, so both action
 * modules call this rather than each re-listing the paths.
 *
 * Not a Server Action module — a 'use server' file may only export async
 * functions, and this has to stay callable as a plain helper.
 */
export function revalidateCategoryScreens(categoryId?: string | null) {
  revalidatePath('/');
  revalidatePath('/categories');
  if (categoryId) {
    revalidatePath(`/categories/${categoryId}/items`);
  }
}
