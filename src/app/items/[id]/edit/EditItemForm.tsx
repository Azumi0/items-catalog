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
  Divider,
  rem,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconAlertCircle,
  IconPhoto,
  IconPlus,
  IconX,
  IconDeviceFloppy,
  IconUpload,
} from '@tabler/icons-react';
import { updateItemAction } from '@/app/actions/items';
import type { ItemWithCategory } from '@/lib/services/items';
import type { CategoryWithCount } from '@/lib/services/categories';

const ACCEPTED_IMAGE_TYPES = [
  ...IMAGE_MIME_TYPE,
  'image/heic',
  'image/heif',
];

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

  // Refs for cleanup on unmount
  const mainPreviewRef = useRef<string | null>(null);
  const newAdditionalPreviewsRef = useRef<string[]>([]);

  mainPreviewRef.current = newMainPreview;
  newAdditionalPreviewsRef.current = newAdditionalPreviews;

  useEffect(() => {
    return () => {
      if (mainPreviewRef.current) {
        URL.revokeObjectURL(mainPreviewRef.current);
      }
      newAdditionalPreviewsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleMainImageDrop = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (newMainPreview) {
      URL.revokeObjectURL(newMainPreview);
    }
    const url = URL.createObjectURL(file);
    setNewMainImage(file);
    setNewMainPreview(url);
  };

  const removeNewMainImage = () => {
    if (newMainPreview) {
      URL.revokeObjectURL(newMainPreview);
    }
    setNewMainImage(null);
    setNewMainPreview(null);
  };

  const handleAddNewAdditionalImages = (files: File[]) => {
    if (!files.length) return;
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewAdditionalImages((prev) => [...prev, ...files]);
    setNewAdditionalPreviews((prev) => [...prev, ...previews]);
  };

  const removeKeptImage = (filename: string) => {
    setKeptAdditionalImages((prev) => prev.filter((img) => img !== filename));
  };

  const removeNewAdditionalImage = (index: number) => {
    const targetUrl = newAdditionalPreviews[index];
    if (targetUrl) {
      URL.revokeObjectURL(targetUrl);
    }
    setNewAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    setNewAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
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
            Zdjęcie główne:
          </Text>
          <Group align="flex-start" gap="md">
            <Paper withBorder p="xs" radius="md">
              <Box pos="relative">
                <Image
                  src={
                    newMainPreview || `/api/images/thumbs/${item.mainImage}`
                  }
                  height={130}
                  width={160}
                  radius="sm"
                  alt="Zdjęcie główne"
                  style={{ objectFit: 'cover' }}
                />
                {newMainPreview && (
                  <ActionIcon
                    color="red"
                    variant="filled"
                    size="sm"
                    pos="absolute"
                    top={4}
                    right={4}
                    onClick={removeNewMainImage}
                    title="Cofnij podmianę zdjęcia"
                    disabled={loading}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                )}
              </Box>
            </Paper>

            <Box style={{ flex: 1 }}>
              <Dropzone
                onDrop={handleMainImageDrop}
                maxFiles={1}
                accept={ACCEPTED_IMAGE_TYPES}
                disabled={loading}
              >
                <Group justify="center" gap="sm" mih={80} style={{ pointerEvents: 'none' }}>
                  <Dropzone.Accept>
                    <IconUpload
                      style={{ width: rem(28), height: rem(28), color: 'var(--mantine-color-teal-6)' }}
                      stroke={1.5}
                    />
                  </Dropzone.Accept>
                  <Dropzone.Reject>
                    <IconX
                      style={{ width: rem(28), height: rem(28), color: 'var(--mantine-color-red-6)' }}
                      stroke={1.5}
                    />
                  </Dropzone.Reject>
                  <Dropzone.Idle>
                    <IconPhoto
                      style={{ width: rem(28), height: rem(28), color: 'var(--mantine-color-dimmed)' }}
                      stroke={1.5}
                    />
                  </Dropzone.Idle>

                  <div>
                    <Text size="xs" fw={500} inline>
                      {newMainPreview
                        ? 'Kliknij lub przeciągnij, aby wybrać inne zdjęcie'
                        : 'Podmień zdjęcie główne (przeciągnij lub kliknij)'}
                    </Text>
                    <Text size="xs" c="dimmed" inline mt={4}>
                      Obsługiwane: PNG, JPEG, WebP, GIF, HEIC
                    </Text>
                  </div>
                </Group>
              </Dropzone>

              {newMainPreview && (
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
                      disabled={loading}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  </Paper>
                ))}
              </SimpleGrid>
            </Box>
          )}

          <Dropzone
            onDrop={handleAddNewAdditionalImages}
            accept={ACCEPTED_IMAGE_TYPES}
            disabled={loading}
            mb="xs"
          >
            <Group justify="center" gap="sm" mih={80} style={{ pointerEvents: 'none' }}>
              <Dropzone.Accept>
                <IconUpload
                  style={{ width: rem(28), height: rem(28), color: 'var(--mantine-color-teal-6)' }}
                  stroke={1.5}
                />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX
                  style={{ width: rem(28), height: rem(28), color: 'var(--mantine-color-red-6)' }}
                  stroke={1.5}
                />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconPlus
                  style={{ width: rem(28), height: rem(28), color: 'var(--mantine-color-dimmed)' }}
                  stroke={1.5}
                />
              </Dropzone.Idle>

              <div>
                <Text size="xs" fw={500} inline>
                  Dodaj nowe zdjęcia dodatkowe (przeciągnij lub kliknij)
                </Text>
                <Text size="xs" c="dimmed" inline mt={4}>
                  Możesz wybrać wiele plików jednocześnie
                </Text>
              </div>
            </Group>
          </Dropzone>

          {newAdditionalPreviews.length > 0 && (
            <Box mt="xs">
              <Text size="xs" c="teal" mb={6}>
                Nowo dodane zdjęcia do przesłania:
              </Text>
              <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="xs">
                {newAdditionalPreviews.map((preview, index) => (
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
                      onClick={() => removeNewAdditionalImage(index)}
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
