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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUpload,
  IconX,
  IconPhoto,
  IconCheck,
  IconAlertCircle,
  IconPlus,
} from '@tabler/icons-react';
import { createItemAction } from '@/app/actions/items';
import type { CategoryWithCount } from '@/lib/services/categories';

interface NewItemFormProps {
  categories: CategoryWithCount[];
}

export function NewItemForm({ categories }: NewItemFormProps) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string | null>(
    categories[0]?.id || null
  );
  const [description, setDescription] = useState('');
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMainImageChange = (file: File | null) => {
    setMainImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setMainImagePreview(url);
    } else {
      setMainImagePreview(null);
    }
  };

  const handleAdditionalImagesChange = (files: File[]) => {
    const combined = [...additionalImages, ...files];
    setAdditionalImages(combined);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setAdditionalPreviews([...additionalPreviews, ...newPreviews]);
  };

  const removeAdditionalImage = (index: number) => {
    const nextFiles = additionalImages.filter((_, i) => i !== index);
    const nextPreviews = additionalPreviews.filter((_, i) => i !== index);
    setAdditionalImages(nextFiles);
    setAdditionalPreviews(nextPreviews);
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

    if (!mainImage) {
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
      formData.append('mainImage', mainImage);

      for (const file of additionalImages) {
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
          placeholder="Wprowadź szczegółowy opis, numer seryjny, lokalizację w domu, itp."
          minRows={3}
          autosize
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          disabled={loading}
        />

        {/* Main Image Input & Preview */}
        <Box>
          <Text size="sm" fw={500} mb={4}>
            Zdjęcie główne (wymagane)
          </Text>
          <FileInput
            placeholder="Wybierz plik ze zdjęciem"
            accept="image/png,image/jpeg,image/webp,image/gif"
            leftSection={<IconPhoto size={18} />}
            onChange={handleMainImageChange}
            disabled={loading}
            clearable
          />

          {mainImagePreview && (
            <Paper withBorder p="xs" mt="xs" radius="md" style={{ display: 'inline-block' }}>
              <Box pos="relative">
                <Image
                  src={mainImagePreview}
                  height={160}
                  width={200}
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
                  onClick={() => handleMainImageChange(null)}
                  title="Usuń zdjęcie"
                >
                  <IconX size={14} />
                </ActionIcon>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Additional Images Input & Previews */}
        <Box>
          <Text size="sm" fw={500} mb={4}>
            Zdjęcia dodatkowe (opcjonalne)
          </Text>
          <FileInput
            placeholder="Dodaj więcej zdjęć..."
            accept="image/png,image/jpeg,image/webp,image/gif"
            leftSection={<IconPlus size={18} />}
            multiple
            onChange={handleAdditionalImagesChange}
            disabled={loading}
          />

          {additionalPreviews.length > 0 && (
            <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="xs" mt="xs">
              {additionalPreviews.map((previewUrl, index) => (
                <Paper key={index} withBorder p="xs" radius="md" pos="relative">
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
                    onClick={() => removeAdditionalImage(index)}
                    title="Usuń zdjęcie"
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
