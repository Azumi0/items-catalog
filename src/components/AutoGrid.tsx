import { Box } from '@mantine/core';

interface AutoGridProps {
  /** Narrowest a column may get before the grid drops one, in px. */
  min: number;
  gap?: number;
  children: React.ReactNode;
}

/**
 * `repeat(auto-fill, minmax(min, 1fr))` — the redesign's one layout primitive.
 *
 * Every grid in the app (tiles, item cards, management cards, thumbnails, the
 * icon picker) reflows purely on available width, so none of them needs a
 * breakpoint: two columns on a 390px phone and six on a desktop come out of
 * the same declaration.
 */
export function AutoGrid({ min, gap = 12, children }: AutoGridProps) {
  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`,
        gap,
      }}
    >
      {children}
    </Box>
  );
}
