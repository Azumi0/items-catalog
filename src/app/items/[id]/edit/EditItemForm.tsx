'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  Textarea,
  Button,
  Stack,
  Text,
  Group,
  Image,
  SimpleGrid,
  ActionIcon,
  Box,
  Paper,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconAlertCircle,
  IconX,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { updateItemAction } from '@/app/actions/items';
import type { ItemWithCategory } from '@/lib/services/items';
import type { CategoryWithCount } from '@/lib/services/categories';
import { thumbUrl } from '@/lib/images';
import { toCategoryOptions } from '@/lib/categoryOptions';
import { ImageDropzone } from '@/components/ImageDropzone';
import { useSingleImagePreview, useMultiImagePreviews } from '@/hooks/useImagePreviews';

interface EditItemFormProps {
  item: ItemWithCategory;
  categories: CategoryWithCount[];
}

export function EditItemForm({ item, categories }: EditItemFormProps) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string | null>(item.categoryId);
  const [description, setDescription] = useState(item.description || '');

  const newMain = useSingleImagePreview();
  const newAdditional = useMultiImagePreviews();

  // Existing additional images the user has not removed. Stored filenames, not
  // File objects — they already live on disk.
  const [keptAdditionalImages, setKeptAdditionalImages] = useState<string[]>(
    item.additionalImages || []
  );
  const [loading, setLoading] = useState(false);

  const removeKeptImage = (filename: string) => {
    setKeptAdditionalImages((prev) => prev.filter((img) => img !== filename));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      notifications.show({
        color: 'red',
        title: 'Błąd',
        message: 'Wybierz kategorię.',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('id', item.id);
      formData.append('categoryId', categoryId);
      formData.append('description', description);

      if (newMain.file) {
        formData.append('mainImage', newMain.file);
      }

      formData.append(
        'keptAdditionalImages',
        JSON.stringify(keptAdditionalImages)
      );

      for (const file of newAdditional.files) {
        formData.append('newAdditionalImages', file);
      }

      const result = await updateItemAction(null, formData);

      if (result?.error) {
        notifications.show({
          color: 'red',
          title: 'Błąd edycji',
          message: result.error,
          icon: <IconAlertCircle size={16} />,
        });
        setLoading(false);
        return;
      }

      notifications.show({
        color: 'teal',
        title: 'Zapisano zmiany',
        message: 'Przedmiot został pomyślnie zaktualizowany.',
        icon: <IconCheck size={16} />,
      });

      router.push(`/items/${item.id}`);
      router.refresh();
    } catch (err: any) {
      notifications.show({
        color: 'red',
        title: 'Błąd',
        message: err.message || 'Wystąpił błąd podczas zapisywania zmian.',
        icon: <IconAlertCircle size={16} />,
      });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        <Select
          label="Kategoria"
          placeholder="Wybierz kategorię"
          data={toCategoryOptions(categories)}
          value={categoryId}
          onChange={setCategoryId}
          required
          disabled={loading}
        />

        <Textarea
          label="Opis przedmiotu"
          placeholder="Wprowadź szczegółowy opis..."
          minRows={3}
          autosize
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          disabled={loading}
        />

        <Divider label="Zdjęcie główne" labelPosition="left" />

        <Box>
          <Text size="sm" fw={500} mb="xs">
            Zdjęcie główne:
          </Text>
          <Group align="flex-start" gap="md">
            <Paper withBorder p="xs" radius="md">
              <Box pos="relative">
                <Image
                  src={newMain.preview || thumbUrl(item.mainImage)}
                  height={130}
                  width={160}
                  radius="sm"
                  alt="Zdjęcie główne"
                  style={{ objectFit: 'cover' }}
                />
                {newMain.preview && (
                  <ActionIcon
                    color="red"
                    variant="filled"
                    size="sm"
                    pos="absolute"
                    top={4}
                    right={4}
                    onClick={newMain.clear}
                    title="Cofnij podmianę zdjęcia"
                    disabled={loading}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                )}
              </Box>
            </Paper>

            <Box style={{ flex: 1 }}>
              <ImageDropzone
                onDrop={newMain.select}
                maxFiles={1}
                disabled={loading}
                compact
                idleIcon="photo"
                iconSize={28}
                minHeight={80}
                title={
                  newMain.preview
                    ? 'Kliknij lub przeciągnij, aby wybrać inne zdjęcie'
                    : 'Podmień zdjęcie główne (przeciągnij lub kliknij)'
                }
                hint="Obsługiwane: PNG, JPEG, WebP, GIF, HEIC"
              />

              {newMain.preview && (
                <Text size="xs" c="teal" mt={6}>
                  ✓ Wybrano nowe zdjęcie główne (stare zostanie usunięte po zapisie).
                </Text>
              )}
            </Box>
          </Group>
        </Box>

        <Divider label="Zdjęcia dodatkowe" labelPosition="left" />

        <Box>
          <Text size="sm" fw={500} mb="xs">
            Zarządzaj zdjęciami dodatkowymi:
          </Text>

          {keptAdditionalImages.length > 0 && (
            <Box mb="md">
              <Text size="xs" c="dimmed" mb={6}>
                Istniejące zdjęcia dodatkowe (kliknij krzyżyk, aby usunąć):
              </Text>
              <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="xs">
                {keptAdditionalImages.map((img) => (
                  <Paper key={img} withBorder p="xs" radius="md" pos="relative">
                    <Image
                      src={thumbUrl(img)}
                      height={90}
                      radius="sm"
                      alt="Zdjęcie dodatkowe"
                      style={{ objectFit: 'cover' }}
                    />
                    <ActionIcon
                      color="red"
                      variant="filled"
                      size="xs"
                      pos="absolute"
                      top={8}
                      right={8}
                      onClick={() => removeKeptImage(img)}
                      title="Usuń zdjęcie"
                      disabled={loading}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  </Paper>
                ))}
              </SimpleGrid>
            </Box>
          )}

          <ImageDropzone
            onDrop={newAdditional.add}
            disabled={loading}
            compact
            idleIcon="plus"
            iconSize={28}
            minHeight={80}
            mb="xs"
            title="Dodaj nowe zdjęcia dodatkowe (przeciągnij lub kliknij)"
            hint="Możesz wybrać wiele plików jednocześnie"
          />

          {newAdditional.previews.length > 0 && (
            <Box mt="xs">
              <Text size="xs" c="teal" mb={6}>
                Nowo dodane zdjęcia do przesłania:
              </Text>
              <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="xs">
                {newAdditional.previews.map((preview, index) => (
                  <Paper key={preview} withBorder p="xs" radius="md" pos="relative">
                    <Image
                      src={preview}
                      height={90}
                      radius="sm"
                      alt={`Nowe dodatkowe ${index + 1}`}
                      style={{ objectFit: 'cover' }}
                    />
                    <ActionIcon
                      color="red"
                      variant="filled"
                      size="xs"
                      pos="absolute"
                      top={8}
                      right={8}
                      onClick={() => newAdditional.removeAt(index)}
                      title="Usuń zdjęcie"
                      disabled={loading}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  </Paper>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </Box>

        <Group justify="flex-end" mt="xl">
          <Button
            variant="default"
            onClick={() => router.back()}
            disabled={loading}
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            color="teal"
            loading={loading}
            leftSection={<IconDeviceFloppy size={18} />}
          >
            Zapisz zmiany
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
