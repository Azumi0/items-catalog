import { getUserCount } from '@/lib/services/users';
import { getCurrentUser } from '@/lib/session';
import { getCategories } from '@/lib/services/categories';
import { getItems } from '@/lib/services/items';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { ItemsCatalog } from '@/components/ItemsCatalog';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const count = await getUserCount();
  if (count === 0) {
    redirect('/setup');
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

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
