import { requireAuthPage } from '@/lib/session';
import { getCategory } from '@/lib/services/categories';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { CategoryForm } from '@/components/CategoryForm';

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthPage();

  const { id } = await params;
  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

  return (
    <AppLayout
      user={user}
      title="Edytuj kategorię"
      subtitle={category.name}
      backHref="/categories"
      tab="categories"
      chrome={false}
    >
      <CategoryForm category={category} />
    </AppLayout>
  );
}
