'use client';

import { ActionIcon, Box, Image } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { THUMB_PLACEHOLDER } from '@/lib/images';

interface RemovableImageProps {
  /** A stored image URL or a local object URL — both render the same. */
  src: string;
  alt: string;
  onRemove: () => void;
  /** aria-label and title of the remove button. */
  removeLabel: string;
  disabled?: boolean;
  /**
   * `hero` is a form's main 4:3 photo; `square` is one cell of a photo grid.
   * The two differ in ratio, radius and how big the remove button can be
   * before it covers the picture.
   */
  variant?: 'hero' | 'square';
  /** Fixed edge length, for a square that is not sized by a grid cell. */
  w?: number;
}

/**
 * A chosen photo with a remove button in its corner — the item form's main
 * and additional photos, and the category form's picture. Every one of them
 * was the same Box/Image/ActionIcon sandwich at a different scale.
 */
export function RemovableImage({
  src,
  alt,
  onRemove,
  removeLabel,
  disabled,
  variant = 'square',
  w,
}: RemovableImageProps) {
  const isHero = variant === 'hero';

  return (
    <Box pos="relative" w={w}>
      <Image
        src={src}
        alt={alt}
        fallbackSrc={THUMB_PLACEHOLDER}
        radius={isHero ? 'md' : 'sm'}
        style={{
          aspectRatio: isHero ? '4 / 3' : '1 / 1',
          objectFit: 'cover',
        }}
      />
      <ActionIcon
        color="red"
        variant="filled"
        size={isHero ? 'md' : 'xs'}
        pos="absolute"
        top={isHero ? 8 : 4}
        right={isHero ? 8 : 4}
        onClick={onRemove}
        disabled={disabled}
        aria-label={removeLabel}
        title={removeLabel}
      >
        <IconX size={isHero ? 16 : 12} />
      </ActionIcon>
    </Box>
  );
}
