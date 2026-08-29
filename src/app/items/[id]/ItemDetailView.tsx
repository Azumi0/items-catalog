'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  Button,
  Group,
  Image,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { deleteItemAction } from '@/app/actions/items';
import type { ItemWithCategory } from '@/lib/services/items';
import { ImageLightboxModal } from '@/components/ImageLightboxModal';
import { AutoGrid } from '@/components/AutoGrid';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { useActionRunner } from '@/hooks/useActionRunner';
import {
  thumbUrl,
  originalUrl,
  DETAIL_PLACEHOLDER,
  THUMB_PLACEHOLDER,
} from '@/lib/images';
import { formatDate } from '@/lib/formatDate';

interface ItemDetailViewProps {
  item: ItemWithCategory;
}

export function ItemDetailView({ item }: ItemDetailViewProps) {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { run: runDelete, pending: isDeleting } = useActionRunner();

  const additionalImages = item.additionalImages || [];
  const allImages = [item.mainImage, ...additionalImages];


  const handleDelete = async () => {
    await runDelete({
      action: () => deleteItemAction(item.id),
      errorTitle: 'Błąd usuwania',
      successTitle: 'Usunięto przedmiot',
      successMessage: 'Przedmiot oraz powiązane zdjęcia zostały usunięte.',
      onSuccess: () => {
        setConfirmingDelete(false);
        router.push(`/categories/${item.categoryId}/items`);
      },
    });
  };

  return (
    <>
      <Stack gap={16} maw={640} mx="auto">
        <UnstyledButton
          onClick={() => setLightboxIndex(0)}
          aria-label="Powiększ zdjęcie"
          style={{ cursor: 'zoom-in' }}
        >
          <Image
            src={originalUrl(item.mainImage)}
            alt={item.description || item.categoryName}
            fallbackSrc={DETAIL_PLACEHOLDER}
            radius="md"
            style={{ aspectRatio: '4 / 3', objectFit: 'cover' }}
          />
        </UnstyledButton>

        {additionalImages.length > 0 && (
          <AutoGrid min={72} gap={8}>
            {additionalImages.map((filename, index) => (
              <UnstyledButton
                key={filename}
                // Index 0 is the main image, so the thumbnails start at 1.
                onClick={() => setLightboxIndex(index + 1)}
                aria-label={`Powiększ zdjęcie ${index + 2}`}
                style={{ cursor: 'zoom-in' }}
              >
                <Image
                  src={thumbUrl(filename)}
                  alt=""
                  fallbackSrc={THUMB_PLACEHOLDER}
                  radius="sm"
                  style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                />
              </UnstyledButton>
            ))}
          </AutoGrid>
        )}

        <Text
          component="span"
          fz={12}
          fw={600}
          px={12}
          py={4}
          style={{
            alignSelf: 'flex-start',
            borderRadius: 999,
            background: 'var(--mantine-color-teal-light)',
            color: 'var(--mantine-color-teal-filled)',
          }}
        >
          {item.categoryName}
        </Text>

        <Text fz={16} lh={1.5} style={{ textWrap: 'pretty' }}>
          {item.description || (
            <Text component="span" c="dimmed" fs="italic" inherit>
              Bez opisu
            </Text>
          )}
        </Text>

        <Stack
          gap={8}
          p={12}
          style={{
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          <Group justify="space-between" gap={12} wrap="nowrap">
            <Text fz={13} c="dimmed">
              Dodał(a)
            </Text>
            <Text fz={13} fw={600} truncate>
              {item.createdByName}
            </Text>
          </Group>
          <Group justify="space-between" gap={12} wrap="nowrap">
            <Text fz={13} c="dimmed">
              Data dodania
            </Text>
            <Text fz={13} fw={600}>
              {formatDate(item.createdAt)}
            </Text>
          </Group>
        </Stack>

        <Group gap={8} wrap="nowrap">
          <Button
            component={Link}
            href={`/items/${item.id}/edit`}
            color="teal"
            mih={52}
            fz={15}
            fw={700}
            leftSection={<IconEdit size={20} />}
            style={{ flex: 2 }}
          >
            Edytuj
          </Button>
          <ActionIcon
            variant="light"
            color="red"
            radius="md"
            w={52}
            h={52}
            onClick={() => setConfirmingDelete(true)}
            aria-label="Usuń przedmiot"
            title="Usuń przedmiot"
            style={{ flex: 'none' }}
          >
            <IconTrash size={20} />
          </ActionIcon>
        </Group>
      </Stack>

      <ConfirmSheet
        opened={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Usunąć przedmiot?"
        message="Przedmiot zniknie z katalogu razem ze zdjęciami. Tej operacji nie da się cofnąć."
        onConfirm={handleDelete}
        loading={isDeleting}
      />

      <ImageLightboxModal
        opened={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        images={allImages}
        initialIndex={lightboxIndex ?? 0}
        title={item.description ?? ''}
      />
    </>
  );
}
