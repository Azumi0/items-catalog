'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Anchor, Button, Group, Stack, UnstyledButton } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { labelFor } from '@/lib/iconPicker';
import { FieldBlock } from './FormField';
import { CategoryIcon } from './CategoryIcon';

/**
 * The modal is code-split for the same reason the glyphs are: it reaches the
 * ~2.6 MB icon table, and nothing outside this field should pay for that in
 * its initial JavaScript. ssr:false because there is nothing to render on the
 * server — the modal exists only once it has been asked for.
 *
 * The table itself is warmed a little earlier than this, by the preview glyph
 * below, so the first open is already a cache hit.
 */
const IconPickerModal = dynamic(
  () => import('./IconPickerModal').then((mod) => mod.IconPickerModal),
  { ssr: false }
);

interface IconPickerFieldProps {
  /** Tabler export name, or null for "no icon". */
  value: string | null;
  onChange: (icon: string | null) => void;
  disabled?: boolean;
}

/**
 * The category form's icon field: a preview of the choice, a way to change it
 * and a way to take it back.
 *
 * It replaced a grid of eight fixed icons. Eight did not cover a household —
 * bikes, garden, documents, toys — and forty would have turned the field into
 * a wall, so the choice moved behind a search over the whole library.
 */
export function IconPickerField({ value, onChange, disabled }: IconPickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <FieldBlock label="Ikona" hint="Opcjonalna. Wybierz z pełnej biblioteki ikon Tabler.">
      <Group align="center" gap={12} wrap="nowrap">
        <UnstyledButton
          type="button"
          aria-label="Wybierz ikonę"
          onClick={() => setPickerOpen(true)}
          disabled={disabled}
          w={56}
          h={56}
          c="dimmed"
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid var(--mantine-color-default-border)',
            background: 'var(--mantine-color-body)',
          }}
        >
          {/* The glyph is mounted even with nothing to draw. It arrives as its
              own chunk, and React throttles a Suspense reveal by ~300 ms — a
              boundary first suspending at pick time leaves this square empty
              for a third of a second after the modal has already closed.
              Mounted from the start, it resolves while the form is idle. */}
          <CategoryIcon name={value} size={28} />
          {!value && <IconPlus size={24} />}
        </UnstyledButton>

        <Stack gap={6} align="flex-start">
          <Button
            type="button"
            variant="default"
            size="sm"
            h={36}
            px={14}
            radius="md"
            fz={13}
            fw={600}
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
          >
            {value ? 'Zmień ikonę' : 'Wybierz ikonę'}
          </Button>

          {value && (
            <Anchor
              component="button"
              type="button"
              h={20}
              fz={12}
              c="dimmed"
              underline="always"
              ta="left"
              disabled={disabled}
              onClick={() => onChange(null)}
            >
              Usuń ({labelFor(value)})
            </Anchor>
          )}
        </Stack>
      </Group>

      {pickerOpen && (
        <IconPickerModal
          onClose={() => setPickerOpen(false)}
          onPick={(name) => {
            onChange(name);
            setPickerOpen(false);
          }}
        />
      )}
    </FieldBlock>
  );
}
