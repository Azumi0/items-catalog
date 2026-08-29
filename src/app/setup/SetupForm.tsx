'use client';

import { useActionState } from 'react';
import { setupFirstUserAction } from '@/app/actions/auth';
import {
  Alert,
  Box,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { AUTH_INPUT_STYLES } from '@/components/FormField';

export default function SetupForm() {
  const [state, formAction, isPending] = useActionState(
    setupFirstUserAction,
    null
  );

  return (
    <form action={formAction}>
      <Stack gap={16}>
        {state?.error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Błąd"
            color="red"
            variant="light"
          >
            {state.error}
          </Alert>
        )}

        <TextInput
          label="Login"
          name="username"
          placeholder="Nazwa użytkownika"
          autoComplete="username"
          required
          autoFocus
          disabled={isPending}
          styles={AUTH_INPUT_STYLES}
        />

        <PasswordInput
          label="Hasło"
          name="password"
          placeholder="••••••"
          autoComplete="new-password"
          required
          disabled={isPending}
          styles={AUTH_INPUT_STYLES}
        />

        <PasswordInput
          label="Powtórz hasło"
          name="confirmPassword"
          placeholder="••••••"
          autoComplete="new-password"
          required
          disabled={isPending}
          styles={AUTH_INPUT_STYLES}
        />

        <Box
          p={12}
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            background: 'var(--mantine-color-teal-light)',
          }}
        >
          <Text fz={13} lh={1.4} c="var(--mantine-color-teal-filled)">
            To pierwsze uruchomienie — zakładasz konto administratora katalogu.
            Kolejnych domowników dodasz w zakładce Użytkownicy.
          </Text>
        </Box>

        <Button
          type="submit"
          color="teal"
          fullWidth
          mih={52}
          fz={16}
          fw={700}
          loading={isPending}
        >
          Utwórz konto i zacznij
        </Button>

        <Button
          component={Link}
          href="/login"
          variant="subtle"
          color="teal"
          fullWidth
          mih={48}
          fz={14}
          fw={600}
        >
          Mam już konto — zaloguj się
        </Button>
      </Stack>
    </form>
  );
}
