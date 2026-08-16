import { getCurrentUser } from '@/lib/session';
import { getCategories } from '@/lib/services/categories';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { CategoriesManager } from '@/components/CategoriesManager';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const categories = await getCategories();

  return (
    <AppLayout user={user}>
      <CategoriesManager initialCategories={categories} />
    </AppLayout>
  );
}
