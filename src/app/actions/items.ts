'use server';

import { requireAuth } from '@/lib/session';
import {
  createItem,
  updateItem,
  deleteItem,
  getItem,
} from '@/lib/services/items';
import { saveImage, discardUploads, getImagePath } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { revalidateCategoryScreens } from '@/lib/revalidate';
import {
  generateItemDescription,
  GeminiError,
  type GeminiFailure,
} from '@/lib/gemini';
import fs from 'fs';
import path from 'path';

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

    revalidateCategoryScreens(categoryId);
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

    revalidatePath(`/items/${id}`);
    revalidatePath(`/items/${id}/edit`);
    revalidateCategoryScreens(categoryId);
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
    // Read the category before the row goes, so its list can be invalidated.
    const existing = await getItem(id);
    await deleteItem(id);
    revalidateCategoryScreens(existing?.categoryId);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Błąd podczas usuwania przedmiotu.' };
  }
}

/**
 * What the user is shown when generation fails. Deliberately specific per
 * failure: "coś poszło nie tak" tells someone who has just hit a quota to
 * retry forever, and someone whose key is wrong to blame their photo.
 *
 * `misconfigured` never mentions the API key. It is the one failure whose
 * true cause is a server-side secret, and the message is read by a household
 * member who cannot act on it anyway.
 */
const GENERATION_ERRORS: Record<GeminiFailure, string> = {
  'rate-limit': 'Przekroczono limit zapytań do AI. Spróbuj ponownie za chwilę.',
  timeout: 'AI nie odpowiedziało w ciągu minuty. Spróbuj ponownie.',
  misconfigured: 'AI nie jest poprawnie skonfigurowane.',
  'bad-image': 'Nie udało się przetworzyć zdjęcia.',
  unknown: 'Nie udało się wygenerować opisu.',
};

/**
 * Propose a description for the item's main photo.
 *
 * Takes the image itself, never an item id. The form lets the main photo be
 * replaced without saving, on the edit screen as well as the add screen — so
 * an id would name the row's *old* photo while the user is looking at the new
 * one, and would answer about a picture that is not on screen. The client
 * sends whatever it is actually rendering:
 *
 * - `mainImage` — a File the user just picked, not yet on disk;
 * - `storedFilename` — an original already written by `saveImage`.
 *
 * Nothing is written here. The result is a proposal the user accepts by
 * saving the form, or discards by editing over it.
 */
export async function generateDescriptionAction(formData: FormData) {
  await requireAuth();

  const file = formData.get('mainImage') as File | null;
  const storedFilename = formData.get('storedFilename') as string | null;

  try {
    let buffer: Buffer;

    if (file instanceof File && file.size > 0) {
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (storedFilename) {
      // Same containment as the image route: only ever a basename, so a
      // crafted value cannot climb out of the uploads directory.
      const filePath = getImagePath('originals', path.basename(storedFilename));
      if (!fs.existsSync(filePath)) {
        return { error: 'Nie znaleziono zdjęcia głównego.' };
      }
      buffer = await fs.promises.readFile(filePath);
    } else {
      return { error: 'Najpierw dodaj zdjęcie główne.' };
    }

    const description = await generateItemDescription(buffer);
    return { success: true, description };
  } catch (err) {
    if (err instanceof GeminiError) {
      return { error: GENERATION_ERRORS[err.failure] };
    }
    // Deliberately not `err.message`: the only errors reaching here come from
    // reading a local file, and their text carries filesystem paths.
    console.error('Unexpected failure generating a description.');
    return { error: GENERATION_ERRORS.unknown };
  }
}
