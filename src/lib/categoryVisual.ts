/**
 * How a category is shown wherever it appears — the tiles on the catalog home
 * screen, the management card list, the chips in the item form.
 *
 * The rule has four steps and one owner so the three call sites cannot drift:
 *
 *   1. `mainImage`       — the picture chosen for the category
 *   2. `icon`            — a Tabler glyph, teal on a teal-light square
 *   3. `firstItemImage`  — the newest item's picture, borrowed
 *   4. nothing           — the monogram, first letter of the name
 *
 * Both image kinds carry a stored *filename*, not a URL: pass the value through
 * thumbUrl() / originalUrl() from @/lib/images at the render site.
 *
 * `image` and `derived` are separate arms even though both render a photo —
 * the caller shows one as the category's own picture and the other as a
 * stand-in, and the distinction is what the fallback rule is about.
 */
export type CategoryVisual =
  | { kind: 'image'; value: string }
  | { kind: 'icon'; value: string }
  | { kind: 'derived'; value: string }
  | { kind: 'monogram'; value: string };

export interface CategoryVisualSource {
  name: string;
  icon: string | null;
  mainImage: string | null;
  /** Absent on a plain `Category` row; only the list query computes it. */
  firstItemImage?: string | null;
}

function present(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function categoryVisual(category: CategoryVisualSource): CategoryVisual {
  const mainImage = present(category.mainImage);
  if (mainImage) {
    return { kind: 'image', value: mainImage };
  }

  const icon = present(category.icon);
  if (icon) {
    return { kind: 'icon', value: icon };
  }

  const firstItemImage = present(category.firstItemImage);
  if (firstItemImage) {
    return { kind: 'derived', value: firstItemImage };
  }

  const name = present(category.name);
  return { kind: 'monogram', value: name ? name[0].toUpperCase() : '?' };
}
