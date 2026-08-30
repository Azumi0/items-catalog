'use client';

import { ActionIcon, Box, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconDeviceMobileDown, IconShare, IconX } from '@tabler/icons-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const COPY = {
  native: {
    title: 'Zainstaluj Katalog na urządzeniu',
    body: 'Aplikacja otworzy się na pełnym ekranie, bez paska przeglądarki.',
  },
  ios: {
    title: 'Dodaj Katalog do ekranu początkowego',
    body: 'Otwórz menu Udostępnij na dole ekranu i wybierz „Dodaj do ekranu początkowego”.',
  },
} as const;

/**
 * Offers to install the app, to people not already running it installed who
 * can actually act on the offer.
 *
 * Rendered by AppLayout, and only where `chrome` is on: /login and /setup
 * carry AuthScreen instead and so never reach this, and the form screens are
 * left out because a half-filled item is a bad moment to be interrupted.
 * @/hooks/useInstallPrompt decides which of the two forms, or neither.
 */
export function InstallPrompt() {
  const { state, install, dismiss } = useInstallPrompt();

  if (state.kind === 'hidden') return null;

  const copy = COPY[state.kind];

  return (
    <Paper withBorder radius={16} p={14} mb={16} data-testid="install-prompt">
      <Group gap={12} wrap="nowrap" align="flex-start">
        <Box
          w={40}
          h={40}
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            background: 'var(--mantine-color-teal-light)',
            color: 'var(--mantine-color-teal-filled)',
          }}
        >
          {state.kind === 'native' ? <IconDeviceMobileDown size={22} /> : <IconShare size={22} />}
        </Box>

        <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
          <Text fz={15} fw={700} lh={1.25}>
            {copy.title}
          </Text>
          <Text fz={13} c="dimmed" style={{ textWrap: 'pretty' }}>
            {copy.body}
          </Text>
          {/* No action button on iOS: the whole instruction is "use the
              browser's own menu", and a button that merely collapsed the text
              would imply an install this engine cannot perform. */}
          {state.kind === 'native' && (
            <Button
              onClick={install}
              color="teal"
              size="sm"
              radius="md"
              mt={2}
              style={{ alignSelf: 'flex-start' }}
            >
              Zainstaluj
            </Button>
          )}
        </Stack>

        <ActionIcon
          onClick={dismiss}
          variant="subtle"
          color="gray"
          w={44}
          h={44}
          radius="md"
          aria-label="Nie pokazuj więcej"
          title="Nie pokazuj więcej"
          style={{ flex: 'none' }}
        >
          <IconX size={20} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
