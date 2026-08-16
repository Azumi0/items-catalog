'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Grid,
  Paper,
  Title,
  Text,
  Badge,
  Group,
  Button,
  Image,
  Stack,
  Breadcrumbs,
  Anchor,
  Modal,
  SimpleGrid,
  Box,
  Divider,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconEdit,
  IconTrash,
  IconCalendar,
  IconUser,
  IconClock,
  IconAlertTriangle,
  IconCheck,
  IconArrowsMaximize,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import Link from 'next/link';
import { deleteItemAction } from '@/app/actions/items';
import type { ItemWithCategory } from '@/lib/services/items';

interface ItemDetailViewProps {
  item: ItemWithCategory;
}

export function ItemDetailView({ item }: ItemDetailViewProps) {
  const router = useRouter();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [lightboxOpened, { open: openLightbox, close: closeLightbox }] =
    useDisclosure(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const allImages = [item.mainImage, ...(item.additionalImages || [])];

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    openLightbox();
  };

  const handleNextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteItemAction(item.id);
      if (result?.error) {
        notifications.show({
          color: 'red',
          title: 'Błąd usuwania',
          message: result.error,
        });
        setIsDeleting(false);
        return;
      }

      notifications.show({
        color: 'teal',
        title: 'Usunięto przedmiot',
        message: 'Przedmiot oraz powiązane zdjęcia zostały usunięte.',
        icon: <IconCheck size={16} />,
      });

      router.push('/');
      router.refresh();
    } catch (err: any) {
      notifications.show({
        color: 'red',
        title: 'Błąd',
        message: err.message || 'Wystąpił błąd podczas usuwania.',
      });
      setIsDeleting(false);
    }
  };

  const createdDate = new Date(item.createdAt).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedDate = new Date(item.updatedAt).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Container size="lg">
      <Breadcrumbs mb="md">
        <Anchor component={Link} href="/" size="sm">
          Katalog
        </Anchor>
        <Text size="sm" c="dimmed">
          {item.categoryName}
        </Text>
        <Text size="sm" c="dimmed">
          Szczegóły przedmiotu
        </Text>
      </Breadcrumbs>

      <Grid gutter="xl">
        {/* Left Column: Photos & Gallery */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md">
            {/* Main Image with Zoom click */}
            <Paper
              withBorder
              radius="md"
              shadow="sm"
              pos="relative"
              style={{ cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => handleOpenLightbox(0)}
            >
              <Image
                src={`/api/images/originals/${item.mainImage}`}
                alt={item.description || item.categoryName}
                fallbackSrc="https://placehold.co/600x400?text=Brak+zdjęcia"
                style={{ width: '100%', maxHeight: 450, objectFit: 'contain', background: '#00000010' }}
              />
              <ActionIcon
                variant="filled"
                color="dark"
                pos="absolute"
                bottom={12}
                right={12}
                size="lg"
                title="Powiększ zdjęcie"
                style={{ opacity: 0.8 }}
              >
                <IconArrowsMaximize size={20} />
              </ActionIcon>
            </Paper>

            {/* Additional Images Grid */}
            {item.additionalImages && item.additionalImages.length > 0 && (
              <Box>
                <Text size="sm" fw={600} mb="xs">
                  Wszystkie zdjęcia ({allImages.length})
                </Text>
                <SimpleGrid cols={{ base: 3, sm: 4 }} spacing="xs">
                  {allImages.map((img, index) => (
                    <Paper
                      key={index}
                      withBorder
                      radius="md"
                      style={{
                        cursor: 'pointer',
                        overflow: 'hidden',
                        borderColor: index === 0 ? 'var(--mantine-color-teal-filled)' : undefined,
                        borderWidth: index === 0 ? 2 : 1,
                      }}
                      onClick={() => handleOpenLightbox(index)}
                    >
                      <Image
                        src={`/api/images/thumbs/${img}`}
                        height={90}
                        alt={`Zdjęcie ${index + 1}`}
                        style={{ objectFit: 'cover' }}
                      />
                    </Paper>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </Stack>
        </Grid.Col>

        {/* Right Column: Metadata and Actions */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder p="xl" radius="md" shadow="sm">
            <Stack gap="lg">
              <div>
                <Group justify="space-between" align="center" mb="xs">
                  <Badge color="teal" size="lg">
                    {item.categoryName}
                  </Badge>
                </Group>
                <Title order={2} size="h3">
                  {item.description ? (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{item.description}</span>
                  ) : (
                    <Text c="dimmed" fs="italic">
                      Przedmiot bez opisu
                    </Text>
                  )}
                </Title>
              </div>

              <Divider />

              <Stack gap="sm">
                <Group gap="xs">
                  <IconUser size={18} color="var(--mantine-color-teal-filled)" />
                  <div>
                    <Text size="xs" c="dimmed">
                      Dodał(a)
                    </Text>
                    <Text size="sm" fw={500}>
                      {item.createdByName}
                    </Text>
                  </div>
                </Group>

                <Group gap="xs">
                  <IconCalendar size={18} color="var(--mantine-color-teal-filled)" />
                  <div>
                    <Text size="xs" c="dimmed">
                      Data utworzenia
                    </Text>
                    <Text size="sm" fw={500}>
                      {createdDate}
                    </Text>
                  </div>
                </Group>

                <Group gap="xs">
                  <IconClock size={18} color="var(--mantine-color-teal-filled)" />
                  <div>
                    <Text size="xs" c="dimmed">
                      Ostatnia modyfikacja
                    </Text>
                    <Text size="sm" fw={500}>
                      {updatedDate}
                    </Text>
                  </div>
                </Group>
              </Stack>

              <Divider />

              <Group grow>
                <Button
                  component={Link}
                  href={`/items/${item.id}/edit`}
                  variant="light"
                  color="teal"
                  leftSection={<IconEdit size={18} />}
                >
                  Edytuj
                </Button>
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={18} />}
                  onClick={openDeleteModal}
                >
                  Usuń
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title={
          <Group gap="xs">
            <IconAlertTriangle color="red" size={20} />
            <Text fw={700}>Potwierdź usunięcie przedmiotu</Text>
          </Group>
        }
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Czy na pewno chcesz trwale usunąć ten przedmiot? Wszystkie powiązane pliki zdjęć zostaną fizycznie skasowane z dysku serwera.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeDeleteModal} disabled={isDeleting}>
              Anuluj
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={isDeleting}
              leftSection={<IconTrash size={16} />}
            >
              Usuń trwale
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Lightbox Modal */}
      <Modal
        opened={lightboxOpened}
        onClose={closeLightbox}
        size="xl"
        centered
        withCloseButton
        title={`Zdjęcie ${lightboxIndex + 1} z ${allImages.length}`}
      >
        <Stack align="center" gap="md">
          <Box pos="relative" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Image
              src={`/api/images/originals/${allImages[lightboxIndex]}`}
              alt={`Powiększenie ${lightboxIndex + 1}`}
              style={{ maxHeight: '75vh', width: 'auto', objectFit: 'contain' }}
            />
          </Box>

          {allImages.length > 1 && (
            <Group justify="space-between" w="100%">
              <Button
                variant="light"
                color="teal"
                leftSection={<IconChevronLeft size={18} />}
                onClick={handlePrevImage}
              >
                Poprzednie
              </Button>
              <Text size="sm" c="dimmed">
                {lightboxIndex + 1} / {allImages.length}
              </Text>
              <Button
                variant="light"
                color="teal"
                rightSection={<IconChevronRight size={18} />}
                onClick={handleNextImage}
              >
                Następne
              </Button>
            </Group>
          )}
        </Stack>
      </Modal>
    </Container>
  );
}
