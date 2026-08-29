import { requireAuthPage } from '@/lib/session';
import { getCategories } from '@/lib/services/categories';
import { AppLayout } from '@/components/AppLayout';
import { NewItemForm } from './NewItemForm';
import { Container, Paper, Title, Text, Breadcrumbs, Anchor, Group, Button, Alert } from '@mantine/core';
import Link from 'next/link';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const user = await requireAuthPage();

  const [categories, { categoryId }] = await Promise.all([
    getCategories(),
    searchParams,
  ]);

  // The catalog FAB carries the open category over; anything else falls back
  // to the first category, as the form did before.
  const prefilled = categories.find((category) => category.id === categoryId);

  return (
    <AppLayout
      user={user}
      title="Nowy przedmiot"
      subtitle={prefilled?.name ?? 'Wybierz kategorię'}
      backHref="/"
      tab="catalog"
      chrome={false}
    >
      <Container size="md">
        <Breadcrumbs mb="md">
          <Anchor component={Link} href="/" size="sm">
            Katalog
          </Anchor>
          <Text size="sm" c="dimmed">
            Nowy przedmiot
          </Text>
        </Breadcrumbs>

        <Group justify="space-between" mb="lg">
          <div>
            <Title order={2}>Dodaj Nowy Przedmiot</Title>
            <Text c="dimmed" size="sm">
              Wypełnij formularz i dodaj zdjęcia przedmiotu.
            </Text>
          </div>
        </Group>

        {categories.length === 0 ? (
          <Alert
            icon={<IconAlertCircle size={20} />}
            title="Brak kategorii"
            color="yellow"
            variant="light"
          >
            <Text size="sm" mb="md">
              Przed dodaniem przedmiotu musisz utworzyć co najmniej jedną kategorię.
            </Text>
            <Button
              component={Link}
              href="/categories"
              color="yellow"
              leftSection={<IconPlus size={16} />}
            >
              Zarządzaj kategoriami
            </Button>
          </Alert>
        ) : (
          <Paper withBorder p="xl" radius="md" shadow="xs">
            <NewItemForm categories={categories} initialCategoryId={prefilled?.id} />
          </Paper>
        )}
      </Container>
    </AppLayout>
  );
}
