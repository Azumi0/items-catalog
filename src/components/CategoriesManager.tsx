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
  Stack,
  Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCategory,
  IconAlertTriangle,
  IconCheck,
} from '@tabler/icons-react';
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/app/actions/categories';
import type { CategoryWithCount } from '@/lib/services/categories';

interface CategoriesManagerProps {
  initialCategories: CategoryWithCount[];
}

export function CategoriesManager({
  initialCategories,
}: CategoriesManagerProps) {
  const router = useRouter();

  // Create Modal
  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal
  const [editOpened, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(
    null
  );
  const [editCategoryName, setEditCategoryName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Delete Modal
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [deletingCategory, setDeletingCategory] =
    useState<CategoryWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    const formData = new FormData();
    formData.append('name', newCategoryName);

    const result = await createCategoryAction(null, formData);
    setIsCreating(false);

    if (result?.error) {
      notifications.show({
        color: 'red',
        title: 'Błąd tworzenia',
        message: result.error,
      });
      return;
    }

    notifications.show({
      color: 'teal',
      title: 'Sukces',
      message: `Utworzono kategorię "${newCategoryName}".`,
      icon: <IconCheck size={16} />,
    });

    setNewCategoryName('');
    closeCreate();
    router.refresh();
  };

  const handleOpenEdit = (category: CategoryWithCount) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    openEdit();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;

    setIsEditing(true);
    const formData = new FormData();
    formData.append('id', editingCategory.id);
    formData.append('name', editCategoryName);

    const result = await updateCategoryAction(null, formData);
    setIsEditing(false);

    if (result?.error) {
      notifications.show({
        color: 'red',
        title: 'Błąd edycji',
        message: result.error,
      });
      return;
    }

    notifications.show({
      color: 'teal',
      title: 'Zaktualizowano kategorię',
      message: `Nazwa kategorii została zmieniona na "${editCategoryName}".`,
      icon: <IconCheck size={16} />,
    });

    closeEdit();
    router.refresh();
  };

  const handleOpenDelete = (category: CategoryWithCount) => {
    setDeletingCategory(category);
    openDelete();
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    setIsDeleting(true);
    const result = await deleteCategoryAction(deletingCategory.id);
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
      title: 'Usunięto kategorię',
      message: `Kategoria "${deletingCategory.name}" oraz jej przedmioty i zdjęcia zostały usunięte.`,
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
            <IconCategory size={28} color="var(--mantine-color-teal-filled)" />
            <div>
              <Title order={2} size="h3">
                Zarządzanie Kategoriami
              </Title>
              <Text c="dimmed" size="sm">
                Organizuj przedmioty w przejrzyste kategorie tematyczne.
              </Text>
            </div>
          </Group>
          <Button
            color="teal"
            leftSection={<IconPlus size={18} />}
            onClick={openCreate}
          >
            Nowa kategoria
          </Button>
        </Group>
      </Paper>

      <Paper radius="md" withBorder shadow="xs" style={{ overflow: 'hidden' }}>
        {initialCategories.length === 0 ? (
          <Stack align="center" py={50}>
            <Text c="dimmed">Brak zdefiniowanych kategorii w systemie.</Text>
            <Button
              color="teal"
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={openCreate}
            >
              Dodaj pierwszą kategorię
            </Button>
          </Stack>
        ) : (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nazwa kategorii</Table.Th>
                <Table.Th>Liczba przedmiotów</Table.Th>
                <Table.Th>Data utworzenia</Table.Th>
                <Table.Th ta="right">Akcje</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {initialCategories.map((category) => {
                const dateStr = new Date(category.createdAt).toLocaleDateString(
                  'pl-PL',
                  {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  }
                );

                return (
                  <Table.Tr key={category.id}>
                    <Table.Td fw={600}>{category.name}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={category.itemCount > 0 ? 'teal' : 'gray'}
                        variant="light"
                      >
                        {category.itemCount}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {dateStr}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Group gap="xs" justify="flex-end">
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          onClick={() => handleOpenEdit(category)}
                          title="Edytuj kategorię"
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleOpenDelete(category)}
                          title="Usuń kategorię"
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Create Category Modal */}
      <Modal
        opened={createOpened}
        onClose={closeCreate}
        title={<Text fw={700}>Dodaj nową kategorię</Text>}
        centered
      >
        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <TextInput
              label="Nazwa kategorii"
              placeholder="np. Elektronika, Narzędzia, Książki"
              required
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.currentTarget.value)}
              disabled={isCreating}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeCreate} disabled={isCreating}>
                Anuluj
              </Button>
              <Button type="submit" color="teal" loading={isCreating}>
                Utwórz
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        opened={editOpened}
        onClose={closeEdit}
        title={<Text fw={700}>Edytuj nazwę kategorii</Text>}
        centered
      >
        <form onSubmit={handleEdit}>
          <Stack gap="md">
            <TextInput
              label="Nazwa kategorii"
              required
              autoFocus
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.currentTarget.value)}
              disabled={isEditing}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeEdit} disabled={isEditing}>
                Anuluj
              </Button>
              <Button type="submit" color="teal" loading={isEditing}>
                Zapisz
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete Category Warning Modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title={
          <Group gap="xs">
            <IconAlertTriangle color="red" size={20} />
            <Text fw={700}>Potwierdź usunięcie kategorii</Text>
          </Group>
        }
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Czy na pewno usunąć kategorię{' '}
            <strong>&quot;{deletingCategory?.name}&quot;</strong> wraz ze wszystkimi
            przypisanymi do niej przedmiotami?
          </Text>

          {deletingCategory && deletingCategory.itemCount > 0 && (
            <Alert color="red" variant="light" icon={<IconAlertTriangle size={16} />}>
              Uwaga: Wraz z kategorią zostanie trwale usuniętych{' '}
              <strong>{deletingCategory.itemCount}</strong> przedmiotów oraz wszystkie
              powiązane z nimi pliki zdjęć z dysku serwera.
            </Alert>
          )}

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
              Usuń kaskadowo
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
