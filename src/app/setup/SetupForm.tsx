'use client';

import { useActionState } from 'react';
import { setupFirstUserAction } from '@/app/actions/auth';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
} from '@mantine/core';
import { IconAlertCircle, IconUserPlus } from '@tabler/icons-react';

export default function SetupForm() {
  const [state, formAction, isPending] = useActionState(
    setupFirstUserAction,
    null
  );

  return (
    <form action={formAction}>
      <Stack gap="md">
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
          label="Nazwa administratora"
          name="username"
          placeholder="admin"
          required
          autoFocus
          disabled={isPending}
        />

        <PasswordInput
          label="Hasło"
          name="password"
          placeholder="Minimum 4 znaki"
          required
          disabled={isPending}
        />

        <PasswordInput
          label="Powtórz hasło"
          name="confirmPassword"
          placeholder="Wpisz ponownie hasło"
          required
          disabled={isPending}
        />

        <Button
          type="submit"
          fullWidth
          mt="md"
          color="teal"
          loading={isPending}
          leftSection={<IconUserPlus size={18} />}
        >
          Utwórz konto i zaloguj
        </Button>
      </Stack>
    </form>
  );
}
