import { createElement } from 'react';
import { categoryIconComponent } from '@/lib/categoryIcons';

interface CategoryIconProps {
  /** The name stored in `categories.icon`. */
  name: string;
  /** Glyph edge length in px. */
  size: number;
}

/**
 * Renders a stored icon name as its glyph.
 *
 * The lookup returns a component, and assigning that to a capitalised local
 * inside a render body reads — to React and to react-hooks/static-components —
 * as defining a fresh component on every render, which would remount the glyph
 * each time. CATEGORY_ICONS is a module-level table, so the component really is
 * stable; createElement keeps the lookup an ordinary value and says so.
 */
export function CategoryIcon({ name, size }: CategoryIconProps) {
  return createElement(categoryIconComponent(name), { size });
}
