'use client';

import { useState } from 'react';
import { ActionIcon, Box, Group, Paper, Text } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useActionRunner } from '@/hooks/useActionRunner';
import { deleteCategoryAction } from '@/app/actions/categories';
import type { CategoryWithCount } from '@/lib/services/categories';
import { itemCountLabel, itemCountInstrumental } from '@/lib/itemCount';
import { formatDate } from '@/lib/formatDate';
import { AutoGrid } from './AutoGrid';
import { CategoryVisual } from './CategoryVisual';
import { ConfirmSheet } from './ConfirmSheet';
import { EmptyState } from './EmptyState';

interface CategoriesManagerProps {
  initialCategories: CategoryWithCount[];
}

export function CategoriesManager({
  initialCategories,
}: CategoriesManagerProps) {
  const [deleting, setDeleting] = useState<CategoryWithCount | null>(null);
  const { run: runDelete, pending: isDeleting } = useActionRunner();

  const handleDelete = async () => {
    if (!deleting) return;
    const { id, name } = deleting;

    await runDelete({
      action: () => deleteCategoryAction(id),
      errorTitle: 'Błąd usuwania',
      successTitle: 'Usunięto kategorię',
      successMessage: `Kategoria „${name}” oraz jej przedmioty i zdjęcia zostały usunięte.`,
      onSuccess: () => setDeleting(null),
    });
  };

  return (
    <>
      {initialCategories.length === 0 ? (
        <EmptyState
          title="Brak kategorii"
          message="Dodaj pierwszą kategorię przyciskiem „+”."
        />
      ) : (
        <AutoGrid min={320}>
          {initialCategories.map((category) => (
              <Paper
                key={category.id}
                component="article"
                withBorder
                radius="md"
                shadow="xs"
                p={12}
              >
                <Group gap={12} wrap="nowrap">
                  <CategoryVisual category={category} variant="thumb" />

                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text fz={15} fw={600} truncate>
                      {category.name}
                    </Text>
                    <Text fz={12} c="dimmed" mt={2}>
                      {itemCountLabel(category.itemCount)} · utworzono{' '}
                      {formatDate(category.createdAt)}
                    </Text>
                  </Box>

                  <Group gap={4} wrap="nowrap" style={{ flex: 'none' }}>
                    <ActionIcon
                      component={Link}
                      href={`/categories/${category.id}/edit`}
                      variant="light"
                      color="teal"
                      radius="md"
                      w={44}
                      h={44}
                      aria-label={`Edytuj kategorię ${category.name}`}
                      title="Edytuj kategorię"
                    >
                      <IconEdit size={20} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      radius="md"
                      w={44}
                      h={44}
                      onClick={() => setDeleting(category)}
                      aria-label={`Usuń kategorię ${category.name}`}
                      title="Usuń kategorię"
                    >
                      <IconTrash size={20} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
          ))}
        </AutoGrid>
      )}

      <ConfirmSheet
        opened={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Usunąć kategorię?"
        message={
          deleting
            ? `Kategoria „${deleting.name}” zniknie razem z ${itemCountInstrumental(
                deleting.itemCount
              )} i ich zdjęciami. Tej operacji nie da się cofnąć.`
            : ''
        }
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  );
}
