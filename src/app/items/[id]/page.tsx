import { requireAuthPage } from '@/lib/session';
import { getItem } from '@/lib/services/items';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { ItemDetailView } from './ItemDetailView';

export const dynamic = 'force-dynamic';

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthPage();

  const { id } = await params;
  const item = await getItem(id);

  if (!item) {
    notFound();
  }

  const addedOn = new Date(item.createdAt).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <AppLayout
      user={user}
      title="Przedmiot"
      subtitle={addedOn}
      backHref={`/categories/${item.categoryId}/items`}
      tab="catalog"
    >
      <ItemDetailView item={item} />
    </AppLayout>
  );
}
