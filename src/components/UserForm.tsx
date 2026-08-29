'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useActionRunner } from '@/hooks/useActionRunner';
import {
  changePasswordAction,
  createUserAction,
} from '@/app/actions/users';
import { TALL_INPUT_STYLES } from './FormField';
import { FormActionBar } from './FormActionBar';

const CANCEL_HREF = '/users';

/** New account: login plus the password it starts with. */
export function UserForm() {
  const router = useRouter();
  const { run, pending } = useActionRunner();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) return;

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    await run({
      action: () => createUserAction(null, formData),
      errorTitle: 'Błąd dodawania użytkownika',
      successTitle: 'Sukces',
      successMessage: `Użytkownik „${username.trim()}” został utworzony.`,
      onSuccess: () => router.push(CANCEL_HREF),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={20} maw={640} mx="auto">
        <TextInput
          label="Login"
          placeholder="np. mama, tata, piotr"
          required
          autoFocus
          value={username}
          onChange={(event) => setUsername(event.currentTarget.value)}
          disabled={pending}
          styles={TALL_INPUT_STYLES}
        />
        <PasswordInput
          label="Hasło początkowe"
          placeholder="Minimum 4 znaki"
          required
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          disabled={pending}
          styles={TALL_INPUT_STYLES}
        />
      </Stack>

      <FormActionBar
        cancelHref={CANCEL_HREF}
        submitLabel="Utwórz konto"
        loading={pending}
        disabled={!username.trim() || !password}
      />
    </form>
  );
}

interface PasswordFormProps {
  user: { id: string; username: string };
}

/** Same screen, one field: a new password for an existing account. */
export function PasswordForm({ user }: PasswordFormProps) {
  const router = useRouter();
  const { run, pending } = useActionRunner();
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password) return;

    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('newPassword', password);

    await run({
      action: () => changePasswordAction(null, formData),
      errorTitle: 'Błąd zmiany hasła',
      successTitle: 'Zmieniono hasło',
      successMessage: `Hasło użytkownika „${user.username}” zostało zaktualizowane.`,
      onSuccess: () => router.push(CANCEL_HREF),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={20} maw={640} mx="auto">
        <Box
          p={12}
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            background: 'var(--mantine-color-teal-light)',
          }}
        >
          <Text fz={13} fw={600} c="var(--mantine-color-teal-filled)">
            Zmiana hasła dla: {user.username}
          </Text>
        </Box>

        <PasswordInput
          label="Nowe hasło"
          placeholder="Minimum 4 znaki"
          required
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          disabled={pending}
          styles={TALL_INPUT_STYLES}
        />
      </Stack>

      <FormActionBar
        cancelHref={CANCEL_HREF}
        submitLabel="Zmień hasło"
        loading={pending}
        disabled={!password}
      />
    </form>
  );
}
