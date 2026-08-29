'use client';

import { Component, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

interface CategoryIconProps {
  /** The name stored in `categories.icon`, or null to draw nothing. Already
   *  known to be renderable — the category service drops names this build of
   *  Tabler no longer has. */
  name: string | null;
  /** Glyph edge length in px. */
  size: number;
}

/**
 * The glyph table is loaded as its own chunk (see below), and a chunk fetch can
 * fail: a phone that loses signal mid-download, or a cached page asking for a
 * hashed filename that a redeploy has since replaced. React surfaces that as an
 * error thrown during render, and with no boundary in `src/app` it reaches
 * Next's root one — which would replace the whole catalog screen with an error
 * page because one 24px icon did not arrive.
 *
 * Drawing nothing is the right failure here: the tile behind the glyph is a
 * teal square either way, and every category still shows its name and count.
 */
class GlyphBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn('Icon chunk failed to load; rendering without the glyph:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Renders a stored icon name as its glyph.
 *
 * Since the picker opened onto the whole library, the name can be any of 6250
 * and the lookup table that resolves it weighs ~2.6 MB. A static import here
 * would put all of it on the catalog's first screen — measured, it took the
 * entry chunks from 1.5 MB to 4.2 MB — so the table loads as its own chunk,
 * served from `/_next/static` and so cached by the browser for a year. (Not by
 * the service worker: `public/sw.js` deliberately caches nothing, ADR-001 §2.1.)
 * The square it sits in is drawn either way, so a first paint before the chunk
 * lands is a blank tile, not a jump.
 */
const TablerGlyph = dynamic(() => import('./TablerGlyph'), { ssr: false });

export function CategoryIcon({ name, size }: CategoryIconProps) {
  return (
    <GlyphBoundary>
      <TablerGlyph name={name} size={size} />
    </GlyphBoundary>
  );
}
