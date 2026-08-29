'use client';

import { useState } from 'react';
import { ActionIcon, Box, Group, Paper, Text } from '@mantine/core';
import { IconKey, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useActionRunner } from '@/hooks/useActionRunner';
import { deleteUserAction } from '@/app/actions/users';
import type { User } from '@/db/schema';
import { formatDate, monogram } from '@/lib/formatDate';
import { AutoGrid } from './AutoGrid';
import { ConfirmSheet } from './ConfirmSheet';

type ListedUser = Omit<User, 'passwordHash'>;

interface UsersManagerProps {
  initialUsers: ListedUser[];
  currentUserId: string;
}

export function UsersManager({
  initialUsers,
  currentUserId,
}: UsersManagerProps) {
  const [deleting, setDeleting] = useState<ListedUser | null>(null);
  const { run: runDelete, pending: isDeleting } = useActionRunner();

  const isOnlyUser = initialUsers.length <= 1;

  const handleDelete = async () => {
    if (!deleting) return;
    const { id, username } = deleting;

    await runDelete({
      action: () => deleteUserAction(id),
      errorTitle: 'Błąd usuwania',
      successTitle: 'Usunięto użytkownika',
      successMessage: `Użytkownik „${username}” został usunięty z systemu.`,
      onSuccess: () => setDeleting(null),
    });
  };

  return (
    <>
      <AutoGrid min={320}>
        {initialUsers.map((user) => {
          const isCurrent = user.id === currentUserId;
          // The service refuses both of these; the disabled button says so
          // before the notification has to.
          const blockedReason = isCurrent
            ? 'Nie możesz usunąć samego siebie'
            : isOnlyUser
              ? 'Nie można usunąć jedynego konta w systemie'
              : null;

          return (
            <Paper
              key={user.id}
              component="article"
              withBorder
              radius="md"
              shadow="xs"
              p={12}
            >
              <Group gap={12} wrap="nowrap">
                <Box
                  w={52}
                  h={52}
                  style={{
                    flex: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'var(--mantine-color-gray-light)',
                  }}
                >
                  <Text fz={18} fw={700} c="dimmed">
                    {monogram(user.username)}
                  </Text>
                </Box>

                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={8} wrap="nowrap">
                    <Text fz={15} fw={600} truncate>
                      {user.username}
                    </Text>
                    {isCurrent && (
                      <Text
                        component="span"
                        fz={11}
                        fw={600}
                        px={8}
                        py={2}
                        style={{
                          flex: 'none',
                          borderRadius: 999,
                          background: 'var(--mantine-color-teal-light)',
                          color: 'var(--mantine-color-teal-filled)',
                        }}
                      >
                        To Ty
                      </Text>
                    )}
                  </Group>
                  <Text fz={12} c="dimmed" mt={2}>
                    dołączył(a) {formatDate(user.createdAt)}
                  </Text>
                </Box>

                <Group gap={4} wrap="nowrap" style={{ flex: 'none' }}>
                  <ActionIcon
                    component={Link}
                    href={`/users/${user.id}/password`}
                    variant="light"
                    color="teal"
                    radius="md"
                    w={44}
                    h={44}
                    aria-label={`Zmień hasło użytkownika ${user.username}`}
                    title="Zmień hasło"
                  >
                    <IconKey size={20} />
                  </ActionIcon>

                  {blockedReason ? (
                    <ActionIcon
                      variant="light"
                      color="gray"
                      radius="md"
                      w={44}
                      h={44}
                      disabled
                      aria-label={blockedReason}
                      title={blockedReason}
                      style={{ cursor: 'not-allowed' }}
                    >
                      <IconTrash size={20} />
                    </ActionIcon>
                  ) : (
                    <ActionIcon
                      variant="light"
                      color="red"
                      radius="md"
                      w={44}
                      h={44}
                      onClick={() => setDeleting(user)}
                      aria-label={`Usuń konto ${user.username}`}
                      title="Usuń konto"
                    >
                      <IconTrash size={20} />
                    </ActionIcon>
                  )}
                </Group>
              </Group>
            </Paper>
          );
        })}
      </AutoGrid>

      <ConfirmSheet
        opened={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Usunąć konto?"
        message={
          deleting
            ? `Konto „${deleting.username}” straci dostęp do katalogu. Dodane przez nie przedmioty zostaną w katalogu.`
            : ''
        }
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  );
}
