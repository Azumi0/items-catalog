'use client';

import { Box, Button, Drawer, Group, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ConfirmSheetProps {
  opened: boolean;
  onClose: () => void;
  /** "Usunąć kategorię?", "Usunąć konto?", … */
  title: string;
  /** What disappears and whether it comes back. */
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * Destructive confirmations, as a bottom sheet rather than a centred modal:
 * on a phone the buttons land under the thumb instead of halfway up the screen.
 */
export function ConfirmSheet({
  opened,
  onClose,
  title,
  message,
  confirmLabel = 'Usuń',
  onConfirm,
  loading,
}: ConfirmSheetProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.45, color: '#000' }}
      styles={{
        inner: { justifyContent: 'center' },
        content: {
          height: 'auto',
          maxWidth: 520,
          margin: 12,
          borderRadius: 20,
          boxShadow: 'var(--mantine-shadow-md)',
        },
        body: { padding: '20px 20px 24px' },
      }}
      aria-label={title}
    >
      <Group gap={10} wrap="nowrap" mb={10}>
        <Box
          w={40}
          h={40}
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'var(--mantine-color-red-light)',
            color: 'var(--mantine-color-red-filled)',
          }}
        >
          <IconAlertTriangle size={22} />
        </Box>
        <Text fz={17} fw={700}>
          {title}
        </Text>
      </Group>

      <Text fz={14} c="dimmed" lh={1.45} style={{ textWrap: 'pretty' }}>
        {message}
      </Text>

      <Group gap={8} wrap="nowrap" mt={20}>
        <Button
          variant="default"
          mih={52}
          fz={15}
          fw={600}
          onClick={onClose}
          disabled={loading}
          style={{ flex: 1 }}
        >
          Anuluj
        </Button>
        <Button
          color="red"
          mih={52}
          fz={15}
          fw={700}
          onClick={onConfirm}
          loading={loading}
          style={{ flex: 1 }}
        >
          {confirmLabel}
        </Button>
      </Group>
    </Drawer>
  );
}
