import { describe, it, expect } from 'vitest';
import { categoryVisualPatch } from '@/lib/categoryVisualPatch';

const base = {
  icon: '',
  uploadedImage: null,
  removeImage: false,
  mode: 'update' as const,
};

describe('Category visual patch', () => {
  it('keeps a submitted icon and drops a blank one', () => {
    expect(categoryVisualPatch({ ...base, icon: 'IconTool' }).icon).toBe(
      'IconTool'
    );
    expect(categoryVisualPatch({ ...base, icon: '   ' }).icon).toBeNull();
  });

  it('sets the uploaded image when one came with the form', () => {
    expect(
      categoryVisualPatch({ ...base, uploadedImage: 'new.jpg' }).mainImage
    ).toBe('new.jpg');
  });

  it('leaves the stored image alone when an edit submitted neither', () => {
    expect(categoryVisualPatch(base)).not.toHaveProperty('mainImage');
  });

  it('clears the image when an edit asked to remove it', () => {
    expect(
      categoryVisualPatch({ ...base, removeImage: true }).mainImage
    ).toBeNull();
  });

  it('always writes the image on create, so a new row starts explicit', () => {
    expect(
      categoryVisualPatch({ ...base, mode: 'create' }).mainImage
    ).toBeNull();
  });

  it('prefers a new upload over a remove flag', () => {
    expect(
      categoryVisualPatch({
        ...base,
        uploadedImage: 'new.jpg',
        removeImage: true,
      }).mainImage
    ).toBe('new.jpg');
  });
});
