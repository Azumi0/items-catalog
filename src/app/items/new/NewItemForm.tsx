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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconX, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { createItemAction } from '@/app/actions/items';
import type { CategoryWithCount } from '@/lib/services/categories';
import { toCategoryOptions } from '@/lib/categoryOptions';
import { ImageDropzone } from '@/components/ImageDropzone';
import { useSingleImagePreview, useMultiImagePreviews } from '@/hooks/useImagePreviews';

interface NewItemFormProps {
  categories: CategoryWithCount[];
  /** Preselected when the catalog FAB was pressed inside a category. */
  initialCategoryId?: string;
}

export function NewItemForm({
  categories,
  initialCategoryId,
}: NewItemFormProps) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string | null>(
    initialCategoryId || categories[0]?.id || null
  );
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const mainImage = useSingleImagePreview();
  const additionalImages = useMultiImagePreviews();

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

    if (!mainImage.file) {
      notifications.show({
        color: 'red',
        title: 'Błąd',
        message: 'Wybierz zdjęcie główne przedmiotu.',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('categoryId', categoryId);
      formData.append('description', description);
      formData.append('mainImage', mainImage.file);

      for (const file of additionalImages.files) {
        formData.append('additionalImages', file);
      }

      const result = await createItemAction(null, formData);

      if (result?.error) {
        notifications.show({
          color: 'red',
          title: 'Błąd dodawania',
          message: result.error,
          icon: <IconAlertCircle size={16} />,
        });
        setLoading(false);
        return;
      }

      notifications.show({
        color: 'teal',
        title: 'Sukces',
        message: 'Przedmiot został pomyślnie dodany do katalogu.',
        icon: <IconCheck size={16} />,
      });

      router.push(`/items/${result.itemId}`);
      router.refresh();
    } catch (err: any) {
      notifications.show({
        color: 'red',
        title: 'Błąd',
        message: err.message || 'Wystąpił nieoczekiwany błąd.',
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
          placeholder="Wprowadź szczegółowy opis, numer seryjny, lokalizację w domu, itp."
          minRows={3}
          autosize
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          disabled={loading}
        />

        {/* Main Image Dropzone & Preview */}
        <Box>
          <Text size="sm" fw={500} mb={4}>
            Zdjęcie główne (wymagane)
          </Text>

          {mainImage.preview ? (
            <Paper withBorder p="xs" radius="md" style={{ display: 'inline-block' }}>
              <Box pos="relative">
                <Image
                  src={mainImage.preview}
                  height={180}
                  width={240}
                  radius="sm"
                  alt="Podgląd zdjęcia głównego"
                  style={{ objectFit: 'cover' }}
                />
                <ActionIcon
                  color="red"
                  variant="filled"
                  size="sm"
                  pos="absolute"
                  top={4}
                  right={4}
                  onClick={mainImage.clear}
                  title="Usuń zdjęcie"
                  disabled={loading}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Box>
            </Paper>
          ) : (
            <ImageDropzone
              onDrop={mainImage.select}
              maxFiles={1}
              disabled={loading}
              idleIcon="photo"
              iconSize={42}
              minHeight={120}
              title="Przeciągnij zdjęcie główne lub kliknij, aby wybrać plik"
              hint="Obsługiwane formaty: PNG, JPEG, WebP, GIF, HEIC"
            />
          )}
        </Box>

        {/* Additional Images Dropzone & Previews */}
        <Box>
          <Text size="sm" fw={500} mb={4}>
            Zdjęcia dodatkowe (opcjonalne)
          </Text>

          <ImageDropzone
            onDrop={additionalImages.add}
            disabled={loading}
            idleIcon="plus"
            iconSize={36}
            minHeight={100}
            mb="xs"
            title="Dodaj zdjęcia dodatkowe (przeciągnij lub kliknij)"
            hint="Możesz wybrać wiele plików jednocześnie"
          />

          {additionalImages.previews.length > 0 && (
            <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="xs" mt="xs">
              {additionalImages.previews.map((previewUrl, index) => (
                <Paper key={previewUrl} withBorder p="xs" radius="md" pos="relative">
                  <Image
                    src={previewUrl}
                    height={100}
                    radius="sm"
                    alt={`Dodatkowe zdjęcie ${index + 1}`}
                    style={{ objectFit: 'cover' }}
                  />
                  <ActionIcon
                    color="red"
                    variant="filled"
                    size="xs"
                    pos="absolute"
                    top={8}
                    right={8}
                    onClick={() => additionalImages.removeAt(index)}
                    title="Usuń zdjęcie"
                    disabled={loading}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Paper>
              ))}
            </SimpleGrid>
          )}
        </Box>

        <Group justify="flex-end" mt="md">
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
            leftSection={<IconUpload size={18} />}
          >
            Zapisz przedmiot
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
