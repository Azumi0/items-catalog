'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  Box,
  Group,
  Image,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';
import { createItemAction, updateItemAction } from '@/app/actions/items';
import type { CategoryWithCount } from '@/lib/services/categories';
import type { ItemWithCategory } from '@/lib/services/items';
import { thumbUrl } from '@/lib/images';
import { useActionRunner } from '@/hooks/useActionRunner';
import {
  useMultiImagePreviews,
  useSingleImagePreview,
} from '@/hooks/useImagePreviews';
import { AutoGrid } from './AutoGrid';
import { FieldBlock } from './FormField';
import { FormActionBar } from './FormActionBar';
import { ImageDropzone } from './ImageDropzone';

interface ItemFormProps {
  categories: CategoryWithCount[];
  /** Absent when adding. */
  item?: ItemWithCategory;
  /** Preselected category when adding from inside one. */
  initialCategoryId?: string;
}

/**
 * The add and edit screens are the same form: the only real differences are
 * that editing starts with photos already on disk and may leave the main one
 * untouched. Keeping them as one component keeps the two flows from drifting.
 */
export function ItemForm({
  categories,
  item,
  initialCategoryId,
}: ItemFormProps) {
  const router = useRouter();
  const { run, pending } = useActionRunner();

  const [categoryId, setCategoryId] = useState<string | null>(
    item?.categoryId ?? initialCategoryId ?? categories[0]?.id ?? null
  );
  const [description, setDescription] = useState(item?.description ?? '');

  const newMain = useSingleImagePreview();
  const newAdditional = useMultiImagePreviews();

  /** Stored filenames the user has not removed — they already live on disk. */
  const [keptMain, setKeptMain] = useState<string | null>(
    item?.mainImage ?? null
  );
  const [keptAdditional, setKeptAdditional] = useState<string[]>(
    item?.additionalImages ?? []
  );

  const mainPreview = newMain.preview ?? (keptMain ? thumbUrl(keptMain) : null);

  const cancelHref = item
    ? `/items/${item.id}`
    : initialCategoryId
      ? `/categories/${initialCategoryId}/items`
      : '/';

  const fail = (message: string) =>
    notifications.show({ color: 'red', title: 'Błąd', message });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!categoryId) {
      fail('Wybierz kategorię.');
      return;
    }
    if (!newMain.file && !keptMain) {
      fail('Zdjęcie główne jest wymagane.');
      return;
    }

    const formData = new FormData();
    formData.append('categoryId', categoryId);
    formData.append('description', description);

    if (item) {
      formData.append('id', item.id);
      if (newMain.file) {
        formData.append('mainImage', newMain.file);
      }
      formData.append(
        'keptAdditionalImages',
        JSON.stringify(keptAdditional)
      );
      for (const file of newAdditional.files) {
        formData.append('newAdditionalImages', file);
      }

      await run({
        action: () => updateItemAction(null, formData),
        errorTitle: 'Błąd edycji',
        successTitle: 'Zapisano zmiany',
        successMessage: 'Przedmiot został zaktualizowany.',
        onSuccess: () => router.push(`/items/${item.id}`),
      });
      return;
    }

    formData.append('mainImage', newMain.file as File);
    for (const file of newAdditional.files) {
      formData.append('additionalImages', file);
    }

    let createdId: string | null = null;
    await run({
      action: async () => {
        const result = await createItemAction(null, formData);
        createdId = result?.itemId ?? null;
        return result;
      },
      errorTitle: 'Błąd dodawania',
      successTitle: 'Sukces',
      successMessage: 'Przedmiot został dodany do katalogu.',
      onSuccess: () => router.push(createdId ? `/items/${createdId}` : '/'),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={20} maw={640} mx="auto">
        <FieldBlock label="Zdjęcie główne">
          {mainPreview ? (
            <Box pos="relative">
              <Image
                src={mainPreview}
                alt="Zdjęcie główne"
                radius="md"
                style={{ aspectRatio: '4 / 3', objectFit: 'cover' }}
              />
              <ActionIcon
                color="red"
                variant="filled"
                size="md"
                pos="absolute"
                top={8}
                right={8}
                onClick={() => {
                  newMain.clear();
                  setKeptMain(null);
                }}
                disabled={pending}
                aria-label="Usuń zdjęcie główne"
                title="Usuń zdjęcie główne"
              >
                <IconX size={16} />
              </ActionIcon>
            </Box>
          ) : (
            <ImageDropzone
              onDrop={newMain.select}
              maxFiles={1}
              disabled={pending}
              idleIcon="camera"
              iconSize={32}
              minHeight={180}
              capture
              title="Zrób zdjęcie lub wybierz z galerii"
              hint="JPG, PNG — maks. 10 MB"
            />
          )}
        </FieldBlock>

        <FieldBlock label="Zdjęcia dodatkowe">
          <AutoGrid min={88} gap={8}>
            {keptAdditional.map((filename) => (
              <Box key={filename} pos="relative">
                <Image
                  src={thumbUrl(filename)}
                  alt="Zdjęcie dodatkowe"
                  radius="sm"
                  style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                />
                <ActionIcon
                  color="red"
                  variant="filled"
                  size="xs"
                  pos="absolute"
                  top={4}
                  right={4}
                  onClick={() =>
                    setKeptAdditional((current) =>
                      current.filter((name) => name !== filename)
                    )
                  }
                  disabled={pending}
                  aria-label="Usuń zdjęcie"
                  title="Usuń zdjęcie"
                >
                  <IconX size={12} />
                </ActionIcon>
              </Box>
            ))}

            {newAdditional.previews.map((preview, index) => (
              <Box key={preview} pos="relative">
                <Image
                  src={preview}
                  alt={`Nowe zdjęcie ${index + 1}`}
                  radius="sm"
                  style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                />
                <ActionIcon
                  color="red"
                  variant="filled"
                  size="xs"
                  pos="absolute"
                  top={4}
                  right={4}
                  onClick={() => newAdditional.removeAt(index)}
                  disabled={pending}
                  aria-label="Usuń zdjęcie"
                  title="Usuń zdjęcie"
                >
                  <IconX size={12} />
                </ActionIcon>
              </Box>
            ))}

            <ImageDropzone
              onDrop={newAdditional.add}
              disabled={pending}
              idleIcon="plus"
              iconSize={22}
              variant="tile"
            />
          </AutoGrid>
        </FieldBlock>

        <FieldBlock label="Kategoria">
          <Group gap={8}>
            {categories.map((category) => {
              const isSelected = categoryId === category.id;
              return (
                <UnstyledButton
                  key={category.id}
                  type="button"
                  mih={44}
                  px={16}
                  aria-pressed={isSelected}
                  onClick={() => setCategoryId(category.id)}
                  disabled={pending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 400,
                    border: `1px solid ${
                      isSelected
                        ? 'var(--mantine-color-teal-filled)'
                        : 'var(--mantine-color-default-border)'
                    }`,
                    background: isSelected
                      ? 'var(--mantine-color-teal-light)'
                      : 'var(--mantine-color-body)',
                    color: isSelected
                      ? 'var(--mantine-color-teal-filled)'
                      : 'var(--mantine-color-text)',
                  }}
                >
                  {category.name}
                </UnstyledButton>
              );
            })}
          </Group>
          {categories.length === 0 && (
            <Text fz={13} c="dimmed">
              Najpierw utwórz kategorię w zakładce Kategorie.
            </Text>
          )}
        </FieldBlock>

        <Textarea
          label="Opis"
          placeholder="Co to jest, gdzie leży, stan…"
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          disabled={pending}
          styles={{
            label: { fontSize: 13, fontWeight: 600, marginBottom: 6 },
            input: { minHeight: 120, fontSize: 16, resize: 'vertical' },
          }}
        />
      </Stack>

      <FormActionBar
        cancelHref={cancelHref}
        submitLabel={item ? 'Zapisz zmiany' : 'Dodaj przedmiot'}
        loading={pending}
        disabled={!categoryId}
      />
    </form>
  );
}
