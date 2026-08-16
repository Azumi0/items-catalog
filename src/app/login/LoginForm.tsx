'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
} from '@mantine/core';
import { IconAlertCircle, IconLogin } from '@tabler/icons-react';

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction}>
      <Stack gap="md">
        {state?.error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Błąd logowania"
            color="red"
            variant="light"
          >
            {state.error}
          </Alert>
        )}

        <TextInput
          label="Login"
          name="username"
          placeholder="Wprowadź swój login"
          required
          autoFocus
          disabled={isPending}
        />

        <PasswordInput
          label="Hasło"
          name="password"
          placeholder="Wprowadź hasło"
          required
          disabled={isPending}
        />

        <Button
          type="submit"
          fullWidth
          mt="md"
          color="teal"
          loading={isPending}
          leftSection={<IconLogin size={18} />}
        >
          Zaloguj się
        </Button>
      </Stack>
    </form>
  );
}
