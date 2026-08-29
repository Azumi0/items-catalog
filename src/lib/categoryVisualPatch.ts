import type { CategoryVisualInput } from '@/lib/services/categories';

export interface CategoryVisualFields {
  /** Tabler icon name as submitted; blank means "no icon". */
  icon: string;
  /** Filename of an image uploaded with this submission, if any. */
  uploadedImage: string | null;
  /** The form's "remove the picture" flag. */
  removeImage: boolean;
  /** "create" has no "unchanged" state — a new row is always written whole. */
  mode: 'create' | 'update';
}

/**
 * Turns what a category form submitted into the patch the service applies.
 *
 * The icon is plain: whatever came back, blank meaning none. The image is
 * tri-state, and the third state is the one worth naming — an edit form whose
 * dropzone was never touched submits no file and no remove flag, and must
 * leave the stored picture exactly where it is rather than clearing it.
 */
export function categoryVisualPatch({
  icon,
  uploadedImage,
  removeImage,
  mode,
}: CategoryVisualFields): CategoryVisualInput {
  const patch: CategoryVisualInput = { icon: icon.trim() || null };

  if (uploadedImage) {
    patch.mainImage = uploadedImage;
  } else if (removeImage || mode === 'create') {
    patch.mainImage = null;
  }

  return patch;
}
