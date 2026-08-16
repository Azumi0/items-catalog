'use client';

import { useState, useRef, useEffect } from 'react';
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
  rem,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
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

const ACCEPTED_IMAGE_TYPES = [
  ...IMAGE_MIME_TYPE,
  'image/heic',
  'image/heif',
];

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

  // Keep references for cleanup on unmount
  const mainPreviewRef = useRef<string | null>(null);
  const additionalPreviewsRef = useRef<string[]>([]);

  mainPreviewRef.current = mainImagePreview;
  additionalPreviewsRef.current = additionalPreviews;

  useEffect(() => {
    return () => {
      if (mainPreviewRef.current) {
        URL.revokeObjectURL(mainPreviewRef.current);
      }
      additionalPreviewsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleMainImageDrop = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (mainImagePreview) {
      URL.revokeObjectURL(mainImagePreview);
    }
    const url = URL.createObjectURL(file);
    setMainImage(file);
    setMainImagePreview(url);
  };

  const removeMainImage = () => {
    if (mainImagePreview) {
      URL.revokeObjectURL(mainImagePreview);
    }
    setMainImage(null);
    setMainImagePreview(null);
  };

  const handleAdditionalImagesDrop = (files: File[]) => {
    if (!files.length) return;
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setAdditionalImages((prev) => [...prev, ...files]);
    setAdditionalPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeAdditionalImage = (index: number) => {
    const targetUrl = additionalPreviews[index];
    if (targetUrl) {
      URL.revokeObjectURL(targetUrl);
    }
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
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

        {/* Main Image Dropzone & Preview */}
        <Box>
          <Text size="sm" fw={500} mb={4}>
            Zdjęcie główne (wymagane)
          </Text>

          {mainImagePreview ? (
            <Paper withBorder p="xs" radius="md" style={{ display: 'inline-block' }}>
              <Box pos="relative">
                <Image
                  src={mainImagePreview}
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
                  onClick={removeMainImage}
                  title="Usuń zdjęcie"
                  disabled={loading}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Box>
            </Paper>
          ) : (
            <Dropzone
              onDrop={handleMainImageDrop}
              maxFiles={1}
              accept={ACCEPTED_IMAGE_TYPES}
              disabled={loading}
            >
              <Group justify="center" gap="md" mih={120} style={{ pointerEvents: 'none' }}>
                <Dropzone.Accept>
                  <IconUpload
                    style={{ width: rem(42), height: rem(42), color: 'var(--mantine-color-teal-6)' }}
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    style={{ width: rem(42), height: rem(42), color: 'var(--mantine-color-red-6)' }}
                    stroke={1.5}
                  />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconPhoto
                    style={{ width: rem(42), height: rem(42), color: 'var(--mantine-color-dimmed)' }}
                    stroke={1.5}
                  />
                </Dropzone.Idle>

                <div>
                  <Text size="sm" inline fw={500}>
                    Przeciągnij zdjęcie główne lub kliknij, aby wybrać plik
                  </Text>
                  <Text size="xs" c="dimmed" inline mt={7}>
                    Obsługiwane formaty: PNG, JPEG, WebP, GIF, HEIC
                  </Text>
                </div>
              </Group>
            </Dropzone>
          )}
        </Box>

        {/* Additional Images Dropzone & Previews */}
        <Box>
          <Text size="sm" fw={500} mb={4}>
            Zdjęcia dodatkowe (opcjonalne)
          </Text>

          <Dropzone
            onDrop={handleAdditionalImagesDrop}
            accept={ACCEPTED_IMAGE_TYPES}
            disabled={loading}
            mb="xs"
          >
            <Group justify="center" gap="md" mih={100} style={{ pointerEvents: 'none' }}>
              <Dropzone.Accept>
                <IconUpload
                  style={{ width: rem(36), height: rem(36), color: 'var(--mantine-color-teal-6)' }}
                  stroke={1.5}
                />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX
                  style={{ width: rem(36), height: rem(36), color: 'var(--mantine-color-red-6)' }}
                  stroke={1.5}
                />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconPlus
                  style={{ width: rem(36), height: rem(36), color: 'var(--mantine-color-dimmed)' }}
                  stroke={1.5}
                />
              </Dropzone.Idle>

              <div>
                <Text size="sm" inline fw={500}>
                  Dodaj zdjęcia dodatkowe (przeciągnij lub kliknij)
                </Text>
                <Text size="xs" c="dimmed" inline mt={7}>
                  Możesz wybrać wiele plików jednocześnie
                </Text>
              </div>
            </Group>
          </Dropzone>

          {additionalPreviews.length > 0 && (
            <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="xs" mt="xs">
              {additionalPreviews.map((previewUrl, index) => (
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
                    onClick={() => removeAdditionalImage(index)}
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
