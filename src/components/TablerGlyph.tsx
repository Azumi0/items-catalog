'use client';

import { createElement } from 'react';
import { tablerIcon } from '@/lib/tablerIcons';

interface TablerGlyphProps {
  name: string | null;
  size: number;
}

/**
 * One icon out of the whole library, by name.
 *
 * Split into its own file for one reason: it is the module boundary
 * @/components/CategoryIcon code-splits on, so the 6250 components behind
 * @/lib/tablerIcons load as a chunk of their own. Do not import it directly.
 *
 * A name this build does not have renders nothing. The service scrubs those on
 * read, so reaching this line means the row was written by a newer build than
 * the one running — an empty glyph beats a crash. `null` is the same answer for
 * the caller that has no icon to draw yet.
 */
export default function TablerGlyph({ name, size }: TablerGlyphProps) {
  const glyph = name ? tablerIcon(name) : null;

  return glyph ? createElement(glyph, { size }) : null;
}
