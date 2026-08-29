'use client';

import { Box, Button, Group } from '@mantine/core';
import Link from 'next/link';

interface FormActionBarProps {
  /** Where "Anuluj" goes — the same screen the back chevron returns to. */
  cancelHref: string;
  /** Copy of the primary action: "Utwórz kategorię", "Zapisz zmiany", … */
  submitLabel: string;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * The sticky bar every full-screen form ends with. Render it inside the
 * <form> so the primary button stays a real submit button; it is fixed to the
 * viewport, and AppLayout's `chrome={false}` clears the space under it.
 */
export function FormActionBar({
  cancelHref,
  submitLabel,
  loading,
  disabled,
}: FormActionBarProps) {
  return (
    <Box
      pos="fixed"
      left={0}
      right={0}
      bottom={0}
      px={16}
      pt={12}
      pb={20}
      style={{
        zIndex: 25,
        background: 'var(--mantine-color-body)',
        borderTop: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Group gap={8} wrap="nowrap" maw={640} mx="auto">
        <Button
          component={Link}
          href={cancelHref}
          variant="default"
          mih={52}
          fz={15}
          fw={600}
          style={{ flex: 1 }}
        >
          Anuluj
        </Button>
        <Button
          type="submit"
          color="teal"
          mih={52}
          fz={15}
          fw={700}
          loading={loading}
          disabled={disabled}
          style={{ flex: 2 }}
        >
          {submitLabel}
        </Button>
      </Group>
    </Box>
  );
}
