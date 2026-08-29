import { requireAuthPage } from '@/lib/session';
import { getCategories } from '@/lib/services/categories';
import { AppLayout } from '@/components/AppLayout';
import { CategoryTiles } from '@/components/CategoryTiles';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await requireAuthPage();

  const categories = await getCategories();

  return (
    <AppLayout
      user={user}
      title="Katalog"
      subtitle="Wybierz kategorię"
      tab="catalog"
    >
      <CategoryTiles categories={categories} />
    </AppLayout>
  );
}
