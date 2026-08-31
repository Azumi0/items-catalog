import { requireAuthPage } from '@/lib/session';
import { getCategories } from '@/lib/services/categories';
import { AppLayout } from '@/components/AppLayout';
import { ItemForm } from '@/components/ItemForm';
import { isAiConfigured } from '@/lib/gemini';

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
      backHref={prefilled ? `/categories/${prefilled.id}/items` : '/'}
      tab="catalog"
      chrome={false}
    >
      <ItemForm
        categories={categories}
        initialCategoryId={prefilled?.id}
        aiEnabled={isAiConfigured()}
      />
    </AppLayout>
  );
}
