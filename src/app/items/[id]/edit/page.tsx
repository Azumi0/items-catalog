import { requireAuthPage } from '@/lib/session';
import { getItem } from '@/lib/services/items';
import { getCategories } from '@/lib/services/categories';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { ItemForm } from '@/components/ItemForm';
import { isAiConfigured } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthPage();

  const { id } = await params;
  const [item, categories] = await Promise.all([getItem(id), getCategories()]);

  if (!item) {
    notFound();
  }

  return (
    <AppLayout
      user={user}
      title="Edytuj przedmiot"
      subtitle={item.categoryName}
      backHref={`/items/${item.id}`}
      tab="catalog"
      chrome={false}
    >
      <ItemForm
        categories={categories}
        item={item}
        aiEnabled={isAiConfigured()}
      />
    </AppLayout>
  );
}
