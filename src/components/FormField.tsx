'use client';

import { Box, Text } from '@mantine/core';

/**
 * Field label typography from the handoff — 13px/600 over a 6px gap.
 *
 * Spread into a Mantine input's `styles` so labelled inputs and the hand-built
 * fields below (icon picker, dropzones, category chips) line up exactly.
 */
export const FIELD_LABEL_STYLES = {
  label: { fontSize: 13, fontWeight: 600, marginBottom: 6 },
} as const;

/**
 * A text field at the size the redesign uses: 48px tall, 16px text — the
 * threshold under which iOS Safari zooms the page when the field takes focus.
 */
export const TALL_INPUT_STYLES = {
  ...FIELD_LABEL_STYLES,
  input: { height: 48, fontSize: 16 },
} as const;

/**
 * The taller variant the auth screens use — 52px rather than 48px, the only
 * two screens with nothing else on them.
 */
export const AUTH_INPUT_STYLES = {
  ...FIELD_LABEL_STYLES,
  input: { height: 52, fontSize: 16 },
} as const;

/**
 * The teal-when-chosen surface shared by the category form's icon grid and
 * the item form's category chips: same border, same fill, same text colour —
 * they differ only in shape and in what they look like when idle.
 */
export function selectableSurface(
  isSelected: boolean,
  idleColor = 'var(--mantine-color-text)'
) {
  return {
    border: `1px solid ${
      isSelected
        ? 'var(--mantine-color-teal-filled)'
        : 'var(--mantine-color-default-border)'
    }`,
    background: isSelected
      ? 'var(--mantine-color-teal-light)'
      : 'var(--mantine-color-body)',
    color: isSelected ? 'var(--mantine-color-teal-filled)' : idleColor,
  };
}

interface FieldBlockProps {
  label: string;
  /** Dimmed 12px line between the label and the control. */
  hint?: string;
  children: React.ReactNode;
}

/** The same label/hint pair for controls that are not Mantine inputs. */
export function FieldBlock({ label, hint, children }: FieldBlockProps) {
  return (
    <Box>
      <Text fz={13} fw={600} mb={hint ? 2 : 6}>
        {label}
      </Text>
      {hint && (
        <Text fz={12} c="dimmed" mb={8}>
          {hint}
        </Text>
      )}
      {children}
    </Box>
  );
}
