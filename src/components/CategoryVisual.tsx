'use client';

import { Box, Image, Text } from '@mantine/core';
import { categoryVisual, type CategoryVisualSource } from '@/lib/categoryVisual';
import { CategoryIcon } from './CategoryIcon';
import { thumbUrl, THUMB_PLACEHOLDER } from '@/lib/images';

interface CategoryVisualProps {
  category: CategoryVisualSource;
  /**
   * `tile` is the square media area of a catalog tile — it fills its column.
   * `thumb` is the fixed 52px square in a management card.
   */
  variant?: 'tile' | 'thumb';
}

/**
 * The one place the four-way fallback from @/lib/categoryVisual turns into
 * pixels. Photos render at their stored filename through thumbUrl(); the icon
 * and monogram arms are drawn from theme variables only.
 */
export function CategoryVisual({
  category,
  variant = 'tile',
}: CategoryVisualProps) {
  const visual = categoryVisual(category);
  const isTile = variant === 'tile';

  const frame = isTile
    ? { w: '100%', style: { aspectRatio: '1 / 1' } }
    : { w: 52, h: 52, style: { flex: 'none', borderRadius: 'var(--mantine-radius-md)' } };

  if (visual.kind === 'image' || visual.kind === 'derived') {
    return (
      <Box {...frame} style={{ ...frame.style, overflow: 'hidden' }}>
        <Image
          src={thumbUrl(visual.value)}
          alt=""
          fallbackSrc={THUMB_PLACEHOLDER}
          h="100%"
          w="100%"
          style={{ objectFit: 'cover' }}
        />
      </Box>
    );
  }

  if (visual.kind === 'icon') {
    return (
      <Box
        {...frame}
        style={{
          ...frame.style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--mantine-color-teal-light)',
          color: 'var(--mantine-color-teal-filled)',
        }}
      >
        {isTile ? (
          <Box
            w={64}
            h={64}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'var(--mantine-color-body)',
            }}
          >
            <CategoryIcon name={visual.value} size={32} />
          </Box>
        ) : (
          <CategoryIcon name={visual.value} size={24} />
        )}
      </Box>
    );
  }

  return (
    <Box
      {...frame}
      style={{
        ...frame.style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isTile
          ? 'var(--mantine-color-gray-light)'
          : 'var(--mantine-color-teal-light)',
      }}
    >
      <Text
        fz={isTile ? 34 : 18}
        fw={700}
        c={isTile ? 'dimmed' : 'var(--mantine-color-teal-filled)'}
      >
        {visual.value}
      </Text>
    </Box>
  );
}
