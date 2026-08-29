import { requireAuthPage } from '@/lib/session';
import { getCategory } from '@/lib/services/categories';
import { getItems } from '@/lib/services/items';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { CategoryItemsList } from '@/components/CategoryItemsList';
import { itemCountLabel } from '@/lib/itemCount';

export const dynamic = 'force-dynamic';

export default async function CategoryItemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthPage();

  const { id } = await params;
  const [category, items] = await Promise.all([
    getCategory(id),
    getItems({ categoryId: id, sortOrder: 'newest' }),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <AppLayout
      user={user}
      title={category.name}
      subtitle={itemCountLabel(items.length)}
      backHref="/"
      tab="catalog"
      // Adding from inside a category prefills it in the form.
      fabHref={`/items/new?categoryId=${category.id}`}
    >
      <CategoryItemsList items={items} />
    </AppLayout>
  );
}
