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
  FileInput,
  Paper,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconAlertCircle,
  IconPhoto,
  IconPlus,
  IconX,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { updateItemAction } from '@/app/actions/items';
import type { ItemWithCategory } from '@/lib/services/items';
import type { CategoryWithCount } from '@/lib/services/categories';

interface EditItemFormProps {
  item: ItemWithCategory;
  categories: CategoryWithCount[];
}

export function EditItemForm({ item, categories }: EditItemFormProps) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string | null>(item.categoryId);
  const [description, setDescription] = useState(item.description || '');

  // Main image state
  const [newMainImage, setNewMainImage] = useState<File | null>(null);
  const [newMainPreview, setNewMainPreview] = useState<string | null>(null);

  // Additional images state
  const [keptAdditionalImages, setKeptAdditionalImages] = useState<string[]>(
    item.additionalImages || []
  );
  const [newAdditionalImages, setNewAdditionalImages] = useState<File[]>([]);
  const [newAdditionalPreviews, setNewAdditionalPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMainImageChange = (file: File | null) => {
    setNewMainImage(file);
    if (file) {
      setNewMainPreview(URL.createObjectURL(file));
    } else {
      setNewMainPreview(null);
    }
  };

  const handleAddNewAdditionalImages = (files: File[]) => {
    setNewAdditionalImages([...newAdditionalImages, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewAdditionalPreviews([...newAdditionalPreviews, ...previews]);
  };

  const removeKeptImage = (filename: string) => {
    setKeptAdditionalImages(keptAdditionalImages.filter((img) => img !== filename));
  };

  const removeNewAdditionalImage = (index: number) => {
    setNewAdditionalImages(newAdditionalImages.filter((_, i) => i !== index));
    setNewAdditionalPreviews(newAdditionalPreviews.filter((_, i) => i !== index));
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

      if (newMainImage) {
        formData.append('mainImage', newMainImage);
      }

      formData.append(
        'keptAdditionalImages',
        JSON.stringify(keptAdditionalImages)
      );

      for (const file of newAdditionalImages) {
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

  const categoryData = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        <Select
          label="Kategoria"
          placeholder="Wybierz kategorię"
          data={categoryData}
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
            Aktualne zdjęcie główne:
          </Text>
          <Group align="flex-start" gap="md">
            <Paper withBorder p="xs" radius="md">
              <Image
                src={
                  newMainPreview || `/api/images/thumbs/${item.mainImage}`
                }
                height={120}
                width={150}
                radius="sm"
                alt="Zdjęcie główne"
                style={{ objectFit: 'cover' }}
              />
            </Paper>

            <Stack gap="xs" style={{ flex: 1 }}>
              <FileInput
                label="Podmień zdjęcie główne (opcjonalnie)"
                placeholder="Wybierz nowy plik..."
                accept="image/png,image/jpeg,image/webp,image/gif"
                leftSection={<IconPhoto size={18} />}
                onChange={handleMainImageChange}
                disabled={loading}
                clearable
              />
              {newMainPreview && (
                <Text size="xs" c="teal">
                  Wybrano nowy plik - stare zdjęcie główne zostanie zastąpione.
                </Text>
              )}
            </Stack>
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
                      src={`/api/images/thumbs/${img}`}
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
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  </Paper>
                ))}
              </SimpleGrid>
            </Box>
          )}

          <FileInput
            label="Dodaj nowe zdjęcia dodatkowe"
            placeholder="Wybierz pliki..."
            accept="image/png,image/jpeg,image/webp,image/gif"
            leftSection={<IconPlus size={18} />}
            multiple
            onChange={handleAddNewAdditionalImages}
            disabled={loading}
          />

          {newAdditionalPreviews.length > 0 && (
            <Box mt="xs">
              <Text size="xs" c="teal" mb={6}>
                Nowo dodane zdjęcia do przesłania:
              </Text>
              <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="xs">
                {newAdditionalPreviews.map((preview, index) => (
                  <Paper key={index} withBorder p="xs" radius="md" pos="relative">
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
                      onClick={() => removeNewAdditionalImage(index)}
                      title="Usuń zdjęcie"
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
