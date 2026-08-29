'use client';

import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { Stack, Text } from '@mantine/core';
import {
  IconUpload,
  IconX,
  IconPhoto,
  IconPlus,
  IconCamera,
} from '@tabler/icons-react';

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
  camera: IconCamera,
} as const;

export interface ImageDropzoneProps {
  onDrop: (files: File[]) => void;
  /** Bold line inside the dropzone. Omit for a caption-only drop target. */
  title?: string;
  /** Dimmed line under the title. */
  hint?: string;
  disabled?: boolean;
  /** Which glyph to show at rest. */
  idleIcon?: keyof typeof IDLE_ICONS;
  /** Glyph edge length in px. */
  iconSize?: number;
  /** Minimum height of the drop target in px. */
  minHeight?: number;
  maxFiles?: number;
  mb?: string;
  /**
   * Hints the browser to open the rear camera *instead of* the file picker.
   * Mobile only — desktop browsers ignore it.
   *
   * No call site sets this today: on a phone it replaces the picker rather
   * than pre-selecting a tab in it, so the gallery becomes unreachable. Only
   * turn it on for a zone whose copy promises the camera alone. See ADR-004.
   */
  capture?: boolean;
  /**
   * `panel` is the labelled rectangle a form field uses. `tile` is the bare
   * square "+" that sits in a photo grid next to the pictures already added.
   */
  variant?: 'panel' | 'tile';
}

/**
 * The Accept/Reject/Idle dropzone body shared by the item and category forms:
 * a dashed rectangle on `gray-light`, glyph over copy, centred.
 */
export function ImageDropzone({
  onDrop,
  title,
  hint,
  disabled,
  idleIcon = 'photo',
  iconSize = 32,
  minHeight = 180,
  maxFiles,
  mb,
  capture,
  variant = 'panel',
}: ImageDropzoneProps) {
  const IdleIcon = IDLE_ICONS[idleIcon];
  const isTile = variant === 'tile';
  const glyphColor = isTile
    ? 'var(--mantine-color-dimmed)'
    : 'var(--mantine-color-teal-filled)';

  return (
    <Dropzone
      onDrop={onDrop}
      accept={ACCEPTED_IMAGE_TYPES}
      disabled={disabled}
      maxFiles={maxFiles}
      mb={mb}
      radius={isTile ? 'sm' : 'md'}
      inputProps={capture ? { capture: 'environment' } : undefined}
      styles={{
        root: {
          border: '2px dashed var(--mantine-color-default-border)',
          background: isTile ? 'transparent' : 'var(--mantine-color-gray-light)',
          ...(isTile ? { aspectRatio: '1 / 1' } : {}),
        },
      }}
    >
      <Stack
        align="center"
        justify="center"
        gap={6}
        mih={isTile ? '100%' : minHeight}
        p={isTile ? 4 : 20}
        ta="center"
        style={{ pointerEvents: 'none' }}
      >
        <Dropzone.Accept>
          <IconUpload
            size={iconSize}
            stroke={1.5}
            color="var(--mantine-color-teal-filled)"
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX
            size={iconSize}
            stroke={1.5}
            color="var(--mantine-color-red-filled)"
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IdleIcon size={iconSize} stroke={1.5} color={glyphColor} />
        </Dropzone.Idle>

        {title && (
          <Text fz={14} fw={600}>
            {title}
          </Text>
        )}
        {hint && (
          <Text fz={title ? 12 : 13} c="dimmed">
            {hint}
          </Text>
        )}
      </Stack>
    </Dropzone>
  );
}
