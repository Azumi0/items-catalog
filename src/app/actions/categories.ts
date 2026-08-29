'use server';

import { requireAuth } from '@/lib/session';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryVisualInput,
} from '@/lib/services/categories';
import { saveImage, discardUploads } from '@/lib/storage';
import { categoryVisualPatch } from '@/lib/categoryVisualPatch';
import { revalidatePath } from 'next/cache';

/**
 * Reads the presentation half of a category form and saves any uploaded
 * picture, returning the patch plus the filenames written — so the caller can
 * unlink them if the database write then fails.
 *
 * The tri-state decision itself lives in categoryVisualPatch().
 */
async function readVisual(
  formData: FormData,
  { forUpdate }: { forUpdate: boolean }
): Promise<{ visual: CategoryVisualInput; uploaded: string[] }> {
  const imageFile = formData.get('mainImage') as File | null;
  const uploaded: string[] = [];

  if (imageFile instanceof File && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const saved = await saveImage(buffer, imageFile.name || 'image.jpg');
    uploaded.push(saved.filename);
  }

  const visual = categoryVisualPatch({
    icon: (formData.get('icon') as string) || '',
    uploadedImage: uploaded[0] ?? null,
    removeImage: formData.get('removeMainImage') === '1',
    forUpdate,
  });

  return { visual, uploaded };
}

function revalidateCategoryScreens(id?: string) {
  revalidatePath('/categories');
  revalidatePath('/');
  if (id) {
    revalidatePath(`/categories/${id}/items`);
  }
}

export async function createCategoryAction(prevState: any, formData: FormData) {
  await requireAuth();
  const name = formData.get('name') as string;

  if (!name || !name.trim()) {
    return { error: 'Nazwa kategorii jest wymagana.' };
  }

  let uploaded: string[] = [];
  try {
    const read = await readVisual(formData, { forUpdate: false });
    uploaded = read.uploaded;

    await createCategory(name, read.visual);
    revalidateCategoryScreens();
    return { success: true };
  } catch (err: any) {
    await discardUploads(uploaded);
    return { error: err.message || 'Błąd podczas tworzenia kategorii.' };
  }
}

export async function updateCategoryAction(prevState: any, formData: FormData) {
  await requireAuth();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;

  if (!id || !name || !name.trim()) {
    return { error: 'ID i nowa nazwa kategorii są wymagane.' };
  }

  let uploaded: string[] = [];
  try {
    const read = await readVisual(formData, { forUpdate: true });
    uploaded = read.uploaded;

    await updateCategory(id, name, read.visual);
    revalidateCategoryScreens(id);
    return { success: true };
  } catch (err: any) {
    await discardUploads(uploaded);
    return { error: err.message || 'Błąd podczas aktualizacji kategorii.' };
  }
}

export async function deleteCategoryAction(id: string) {
  await requireAuth();

  try {
    await deleteCategory(id);
    revalidateCategoryScreens(id);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Błąd podczas usuwania kategorii.' };
  }
}
