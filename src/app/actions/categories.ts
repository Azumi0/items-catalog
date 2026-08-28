'use server';

import { requireAuth } from '@/lib/session';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/services/categories';
import { revalidatePath } from 'next/cache';

export async function createCategoryAction(prevState: any, formData: FormData) {
  await requireAuth();
  const name = formData.get('name') as string;

  if (!name || !name.trim()) {
    return { error: 'Nazwa kategorii jest wymagana.' };
  }

  try {
    await createCategory(name);
    revalidatePath('/categories');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
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

  try {
    await updateCategory(id, name);
    revalidatePath('/categories');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Błąd podczas aktualizacji kategorii.' };
  }
}

export async function deleteCategoryAction(id: string) {
  await requireAuth();

  try {
    await deleteCategory(id);
    revalidatePath('/categories');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Błąd podczas usuwania kategorii.' };
  }
}
