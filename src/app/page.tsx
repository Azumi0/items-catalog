import { requireAuthPage } from '@/lib/session';
import { getCategories } from '@/lib/services/categories';
import { getItems } from '@/lib/services/items';
import { AppLayout } from '@/components/AppLayout';
import { ItemsCatalog } from '@/components/ItemsCatalog';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await requireAuthPage();

  const [categories, items] = await Promise.all([
    getCategories(),
    getItems({ sortOrder: 'newest' }),
  ]);

  return (
    <AppLayout user={user}>
      <ItemsCatalog initialCategories={categories} initialItems={items} />
    </AppLayout>
  );
}
