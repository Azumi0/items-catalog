'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { AUTH_INPUT_STYLES } from '@/components/FormField';

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction}>
      <Stack gap={16}>
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
          autoComplete="current-password"
          required
          disabled={isPending}
          styles={AUTH_INPUT_STYLES}
        />

        <Button
          type="submit"
          color="teal"
          fullWidth
          mih={52}
          fz={16}
          fw={700}
          loading={isPending}
        >
          Zaloguj się
        </Button>
      </Stack>
    </form>
  );
}
