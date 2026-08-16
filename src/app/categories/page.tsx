import { requireAuthPage } from '@/lib/session';
import { getCategories } from '@/lib/services/categories';
import { AppLayout } from '@/components/AppLayout';
import { CategoriesManager } from '@/components/CategoriesManager';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const user = await requireAuthPage();

  const categories = await getCategories();

  return (
    <AppLayout user={user}>
      <CategoriesManager initialCategories={categories} />
    </AppLayout>
  );
}
