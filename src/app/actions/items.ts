'use server';

import { requireAuth } from '@/lib/session';
import {
  createItem,
  updateItem,
  deleteItem,
} from '@/lib/services/items';
import { saveImage, discardUploads } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

async function processImageUploads(files: File[], uploaded: string[]): Promise<string[]> {
  const savedFilenames: string[] = [];
  for (const file of files) {
    if (file && file instanceof File && file.size > 0) {
      const buf = Buffer.from(await file.arrayBuffer());
      const saved = await saveImage(buf, file.name || 'image.jpg');
      uploaded.push(saved.filename);
      savedFilenames.push(saved.filename);
    }
  }
  return savedFilenames;
}

export async function createItemAction(prevState: any, formData: FormData) {
  const user = await requireAuth();

  const categoryId = formData.get('categoryId') as string;
  const description = (formData.get('description') as string) || '';
  const mainImageFile = formData.get('mainImage') as File | null;
  const additionalImageFiles = formData.getAll('additionalImages') as File[];

  if (!categoryId) {
    return { error: 'Kategoria jest wymagana.' };
  }

  if (!mainImageFile || !(mainImageFile instanceof File) || mainImageFile.size === 0) {
    return { error: 'Zdjęcie główne jest wymagane.' };
  }

  const uploaded: string[] = [];
  try {
    // 1. Process Main Image
    const mainBuffer = Buffer.from(await mainImageFile.arrayBuffer());
    const savedMain = await saveImage(mainBuffer, mainImageFile.name || 'image.jpg');
    uploaded.push(savedMain.filename);

    // 2. Process Additional Images
    const savedAdditionalImages = await processImageUploads(additionalImageFiles, uploaded);

    // 3. Save to Database
    const created = await createItem({
      categoryId,
      description,
      mainImage: savedMain.filename,
      additionalImages: savedAdditionalImages,
      createdById: user.id,
      createdByName: user.username,
    });

    revalidatePath('/');
    revalidatePath('/categories');
    return { success: true, itemId: created.id };
  } catch (err: any) {
    await discardUploads(uploaded);
    console.error('Error creating item:', err);
    return { error: err.message || 'Błąd podczas tworzenia przedmiotu.' };
  }
}

export async function updateItemAction(prevState: any, formData: FormData) {
  await requireAuth();

  const id = formData.get('id') as string;
  const categoryId = formData.get('categoryId') as string;
  const description = (formData.get('description') as string) || '';
  const mainImageFile = formData.get('mainImage') as File | null;
  const keptAdditionalImagesJson = formData.get('keptAdditionalImages') as string;
  const newAdditionalImageFiles = formData.getAll('newAdditionalImages') as File[];

  if (!id) {
    return { error: 'ID przedmiotu jest wymagane.' };
  }

  if (!categoryId) {
    return { error: 'Kategoria jest wymagana.' };
  }

  const uploaded: string[] = [];
  try {
    let mainImageFilename: string | undefined = undefined;
    if (mainImageFile && mainImageFile instanceof File && mainImageFile.size > 0) {
      const mainBuffer = Buffer.from(await mainImageFile.arrayBuffer());
      const savedMain = await saveImage(mainBuffer, mainImageFile.name || 'image.jpg');
      uploaded.push(savedMain.filename);
      mainImageFilename = savedMain.filename;
    }

    let keptImages: string[] = [];
    if (keptAdditionalImagesJson) {
      try {
        keptImages = JSON.parse(keptAdditionalImagesJson);
      } catch {
        keptImages = [];
      }
    }

    const savedNewAdditional = await processImageUploads(newAdditionalImageFiles, uploaded);
    const finalAdditionalImages = [...keptImages, ...savedNewAdditional];

    await updateItem(id, {
      categoryId,
      description,
      mainImage: mainImageFilename,
      additionalImages: finalAdditionalImages,
    });

    revalidatePath('/');
    revalidatePath(`/items/${id}`);
    revalidatePath(`/items/${id}/edit`);
    return { success: true, itemId: id };
  } catch (err: any) {
    // Only the files this request wrote. The item's previous images are still
    // referenced by the unchanged row and must survive.
    await discardUploads(uploaded);
    console.error('Error updating item:', err);
    return { error: err.message || 'Błąd podczas edycji przedmiotu.' };
  }
}

export async function deleteItemAction(id: string) {
  await requireAuth();

  try {
    await deleteItem(id);
    revalidatePath('/');
    revalidatePath('/categories');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Błąd podczas usuwania przedmiotu.' };
  }
}
