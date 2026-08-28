'use client';

import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { Group, Text, rem } from '@mantine/core';
import { IconUpload, IconX, IconPhoto, IconPlus } from '@tabler/icons-react';

/**
 * What the item forms accept. IMAGE_MIME_TYPE covers PNG/JPEG/WebP/GIF; HEIC
 * and HEIF are added for photos straight off an iPhone.
 */
export const ACCEPTED_IMAGE_TYPES = [
  ...IMAGE_MIME_TYPE,
  'image/heic',
  'image/heif',
];

const IDLE_ICONS = {
  photo: IconPhoto,
  plus: IconPlus,
} as const;

export interface ImageDropzoneProps {
  onDrop: (files: File[]) => void;
  /** Bold line inside the dropzone. */
  title: string;
  /** Dimmed line under the title. */
  hint: string;
  disabled?: boolean;
  /** Which glyph to show at rest. `photo` for a first image, `plus` to add more. */
  idleIcon?: keyof typeof IDLE_ICONS;
  /** Glyph edge length in px. */
  iconSize?: number;
  /** Minimum height of the drop target in px. */
  minHeight?: number;
  maxFiles?: number;
  mb?: string;
  /** Tighter spacing and smaller copy, for the denser edit-form layout. */
  compact?: boolean;
}

/**
 * The Accept/Reject/Idle dropzone body shared by the item forms. It appeared
 * four times — main and additional images, in both the new and edit form —
 * differing only in glyph, sizes and copy.
 */
export function ImageDropzone({
  onDrop,
  title,
  hint,
  disabled,
  idleIcon = 'photo',
  iconSize = 42,
  minHeight = 120,
  maxFiles,
  mb,
  compact = false,
}: ImageDropzoneProps) {
  const IdleIcon = IDLE_ICONS[idleIcon];
  const glyph = { width: rem(iconSize), height: rem(iconSize) };

  return (
    <Dropzone
      onDrop={onDrop}
      accept={ACCEPTED_IMAGE_TYPES}
      disabled={disabled}
      maxFiles={maxFiles}
      mb={mb}
    >
      <Group
        justify="center"
        gap={compact ? 'sm' : 'md'}
        mih={minHeight}
        style={{ pointerEvents: 'none' }}
      >
        <Dropzone.Accept>
          <IconUpload
            style={{ ...glyph, color: 'var(--mantine-color-teal-6)' }}
            stroke={1.5}
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX
            style={{ ...glyph, color: 'var(--mantine-color-red-6)' }}
            stroke={1.5}
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IdleIcon
            style={{ ...glyph, color: 'var(--mantine-color-dimmed)' }}
            stroke={1.5}
          />
        </Dropzone.Idle>

        <div>
          <Text size={compact ? 'xs' : 'sm'} inline fw={500}>
            {title}
          </Text>
          <Text size="xs" c="dimmed" inline mt={compact ? 4 : 7}>
            {hint}
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
}
