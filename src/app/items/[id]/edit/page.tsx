import { requireAuthPage } from '@/lib/session';
import { getItem } from '@/lib/services/items';
import { getCategories } from '@/lib/services/categories';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { EditItemForm } from './EditItemForm';
import { Container, Paper, Title, Text, Breadcrumbs, Anchor } from '@mantine/core';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthPage();

  const { id } = await params;
  const [item, categories] = await Promise.all([
    getItem(id),
    getCategories(),
  ]);

  if (!item) {
    notFound();
  }

  return (
    <AppLayout user={user}>
      <Container size="md">
        <Breadcrumbs mb="md">
          <Anchor component={Link} href="/" size="sm">
            Katalog
          </Anchor>
          <Anchor component={Link} href={`/items/${item.id}`} size="sm">
            {item.categoryName}
          </Anchor>
          <Text size="sm" c="dimmed">
            Edycja
          </Text>
        </Breadcrumbs>

        <Title order={2} mb="xs">
          Edytuj Przedmiot
        </Title>
        <Text c="dimmed" size="sm" mb="lg">
          Zaktualizuj opis, zmień kategorię lub zmodyfikuj przypisane zdjęcia.
        </Text>

        <Paper withBorder p="xl" radius="md" shadow="xs">
          <EditItemForm item={item} categories={categories} />
        </Paper>
      </Container>
    </AppLayout>
  );
}
