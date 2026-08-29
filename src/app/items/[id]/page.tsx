import { requireAuthPage } from '@/lib/session';
import { getItem } from '@/lib/services/items';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { ItemDetailView } from './ItemDetailView';
import { formatDate } from '@/lib/formatDate';

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


  return (
    <AppLayout
      user={user}
      title="Przedmiot"
      subtitle={formatDate(item.createdAt)}
      backHref={`/categories/${item.categoryId}/items`}
      tab="catalog"
      fabHref={`/items/new?categoryId=${item.categoryId}`}
    >
      <ItemDetailView item={item} />
    </AppLayout>
  );
}
