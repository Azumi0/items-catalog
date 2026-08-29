import { describe, it, expect } from 'vitest';
import { categoryVisual } from '@/lib/categoryVisual';

describe('Category visual fallback', () => {
  it('prefers the category image over everything else', () => {
    expect(
      categoryVisual({
        name: 'Elektronika',
        icon: 'IconDeviceLaptop',
        mainImage: 'hero.jpg',
        newestItemImage: 'laptop.jpg',
      })
    ).toEqual({ kind: 'image', value: 'hero.jpg' });
  });

  it('falls back to the icon when there is no category image', () => {
    expect(
      categoryVisual({
        name: 'Elektronika',
        icon: 'IconDeviceLaptop',
        mainImage: null,
        newestItemImage: 'laptop.jpg',
      })
    ).toEqual({ kind: 'icon', value: 'IconDeviceLaptop' });
  });

  it("falls back to the newest item's image when there is no image and no icon", () => {
    expect(
      categoryVisual({
        name: 'Narzędzia',
        icon: null,
        mainImage: null,
        newestItemImage: 'wiertarka.jpg',
      })
    ).toEqual({ kind: 'derived', value: 'wiertarka.jpg' });
  });

  it('falls back to the monogram when the category has nothing to show', () => {
    expect(
      categoryVisual({
        name: 'książki',
        icon: null,
        mainImage: null,
        newestItemImage: null,
      })
    ).toEqual({ kind: 'monogram', value: 'K' });
  });

  it('treats blank strings as absent', () => {
    expect(
      categoryVisual({
        name: 'Ogród',
        icon: '   ',
        mainImage: '',
        newestItemImage: null,
      })
    ).toEqual({ kind: 'monogram', value: 'O' });
  });

  it('tolerates a category loaded without the derived image', () => {
    expect(
      categoryVisual({ name: 'Sport', icon: null, mainImage: null })
    ).toEqual({ kind: 'monogram', value: 'S' });
  });

  it('falls back to a question mark when the name is blank', () => {
    expect(
      categoryVisual({ name: '  ', icon: null, mainImage: null })
    ).toEqual({ kind: 'monogram', value: '?' });
  });
});
