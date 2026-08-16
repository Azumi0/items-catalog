'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Table,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  PasswordInput,
  Stack,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconUserPlus,
  IconKey,
  IconTrash,
  IconUsers,
  IconAlertTriangle,
  IconCheck,
  IconUser,
} from '@tabler/icons-react';
import {
  createUserAction,
  changePasswordAction,
  deleteUserAction,
} from '@/app/actions/users';
import type { User } from '@/db/schema';

interface UsersManagerProps {
  initialUsers: Array<Omit<User, 'passwordHash'>>;
  currentUserId: string;
}

export function UsersManager({
  initialUsers,
  currentUserId,
}: UsersManagerProps) {
  const router = useRouter();

  // Create Modal
  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Password Modal
  const [passwordOpened, { open: openPassword, close: closePassword }] =
    useDisclosure(false);
  const [targetUser, setTargetUser] =
    useState<Omit<User, 'passwordHash'> | null>(null);
  const [updatedPassword, setUpdatedPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete Modal
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [deletingUser, setDeletingUser] =
    useState<Omit<User, 'passwordHash'> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;

    setIsCreating(true);
    const formData = new FormData();
    formData.append('username', newUsername);
    formData.append('password', newPassword);

    const result = await createUserAction(null, formData);
    setIsCreating(false);

    if (result?.error) {
      notifications.show({
        color: 'red',
        title: 'Błąd dodawania użytkownika',
        message: result.error,
      });
      return;
    }

    notifications.show({
      color: 'teal',
      title: 'Sukces',
      message: `Użytkownik "${newUsername}" został utworzony.`,
      icon: <IconCheck size={16} />,
    });

    setNewUsername('');
    setNewPassword('');
    closeCreate();
    router.refresh();
  };

  const handleOpenPasswordModal = (user: Omit<User, 'passwordHash'>) => {
    setTargetUser(user);
    setUpdatedPassword('');
    openPassword();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !updatedPassword) return;

    setIsChangingPassword(true);
    const formData = new FormData();
    formData.append('userId', targetUser.id);
    formData.append('newPassword', updatedPassword);

    const result = await changePasswordAction(null, formData);
    setIsChangingPassword(false);

    if (result?.error) {
      notifications.show({
        color: 'red',
        title: 'Błąd zmiany hasła',
        message: result.error,
      });
      return;
    }

    notifications.show({
      color: 'teal',
      title: 'Zmieniono hasło',
      message: `Hasło dla użytkownika "${targetUser.username}" zostało pomyślnie zaktualizowane.`,
      icon: <IconCheck size={16} />,
    });

    closePassword();
    router.refresh();
  };

  const handleOpenDeleteModal = (user: Omit<User, 'passwordHash'>) => {
    setDeletingUser(user);
    openDelete();
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);
    const result = await deleteUserAction(deletingUser.id);
    setIsDeleting(false);

    if (result?.error) {
      notifications.show({
        color: 'red',
        title: 'Błąd usuwania',
        message: result.error,
      });
      return;
    }

    notifications.show({
      color: 'teal',
      title: 'Usunięto użytkownika',
      message: `Użytkownik "${deletingUser.username}" został usunięty z systemu.`,
      icon: <IconCheck size={16} />,
    });

    closeDelete();
    router.refresh();
  };

  return (
    <Container size="lg">
      <Paper p="lg" radius="md" withBorder shadow="xs" mb="lg">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconUsers size={28} color="var(--mantine-color-teal-filled)" />
            <div>
              <Title order={2} size="h3">
                Zarządzanie Użytkownikami
              </Title>
              <Text c="dimmed" size="sm">
                Dodawaj nowych domowników i zarządzaj dostępem do katalogu.
              </Text>
            </div>
          </Group>
          <Button
            color="teal"
            leftSection={<IconUserPlus size={18} />}
            onClick={openCreate}
          >
            Dodaj użytkownika
          </Button>
        </Group>
      </Paper>

      <Paper radius="md" withBorder shadow="xs" style={{ overflow: 'hidden' }}>
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Użytkownik</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Data utworzenia</Table.Th>
              <Table.Th ta="right">Akcje</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {initialUsers.map((u) => {
              const isCurrent = u.id === currentUserId;
              const isOnlyUser = initialUsers.length <= 1;
              const dateStr = new Date(u.createdAt).toLocaleDateString(
                'pl-PL',
                {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }
              );

              return (
                <Table.Tr key={u.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <IconUser size={18} />
                      <Text fw={600}>{u.username}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {isCurrent && (
                      <Badge color="teal" variant="light">
                        To Ty
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {dateStr}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Zmień hasło" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          onClick={() => handleOpenPasswordModal(u)}
                        >
                          <IconKey size={18} />
                        </ActionIcon>
                      </Tooltip>

                      {isCurrent ? (
                        <Tooltip label="Nie możesz usunąć samego siebie" withArrow>
                          <span>
                            <ActionIcon variant="subtle" color="gray" disabled>
                              <IconTrash size={18} />
                            </ActionIcon>
                          </span>
                        </Tooltip>
                      ) : isOnlyUser ? (
                        <Tooltip
                          label="Nie można usunąć jedynego konta w systemie"
                          withArrow
                        >
                          <span>
                            <ActionIcon variant="subtle" color="gray" disabled>
                              <IconTrash size={18} />
                            </ActionIcon>
                          </span>
                        </Tooltip>
                      ) : (
                        <Tooltip label="Usuń konto" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleOpenDeleteModal(u)}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Create User Modal */}
      <Modal
        opened={createOpened}
        onClose={closeCreate}
        title={<Text fw={700}>Dodaj nowego użytkownika</Text>}
        centered
      >
        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <TextInput
              label="Login / Nazwa użytkownika"
              placeholder="np. mama, tata, piotr"
              required
              autoFocus
              value={newUsername}
              onChange={(e) => setNewUsername(e.currentTarget.value)}
              disabled={isCreating}
            />
            <PasswordInput
              label="Hasło początkowe"
              placeholder="Minimum 4 znaki"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.currentTarget.value)}
              disabled={isCreating}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeCreate} disabled={isCreating}>
                Anuluj
              </Button>
              <Button type="submit" color="teal" loading={isCreating}>
                Utwórz konto
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        opened={passwordOpened}
        onClose={closePassword}
        title={
          <Text fw={700}>
            Zmień hasło dla &quot;{targetUser?.username}&quot;
          </Text>
        }
        centered
      >
        <form onSubmit={handleChangePassword}>
          <Stack gap="md">
            <PasswordInput
              label="Nowe hasło"
              placeholder="Minimum 4 znaki"
              required
              autoFocus
              value={updatedPassword}
              onChange={(e) => setUpdatedPassword(e.currentTarget.value)}
              disabled={isChangingPassword}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closePassword} disabled={isChangingPassword}>
                Anuluj
              </Button>
              <Button type="submit" color="teal" loading={isChangingPassword}>
                Zmień hasło
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete User Warning Modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title={
          <Group gap="xs">
            <IconAlertTriangle color="red" size={20} />
            <Text fw={700}>Potwierdź usunięcie użytkownika</Text>
          </Group>
        }
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Czy na pewno chcesz usunąć konto użytkownika{' '}
            <strong>&quot;{deletingUser?.username}&quot;</strong>?
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeDelete} disabled={isDeleting}>
              Anuluj
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={isDeleting}
              leftSection={<IconTrash size={16} />}
            >
              Usuń konto
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
