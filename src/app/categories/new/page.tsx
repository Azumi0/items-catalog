import { requireAuthPage } from '@/lib/session';
import { AppLayout } from '@/components/AppLayout';
import { CategoryForm } from '@/components/CategoryForm';

export const dynamic = 'force-dynamic';

export default async function NewCategoryPage() {
  const user = await requireAuthPage();

  return (
    <AppLayout
      user={user}
      title="Nowa kategoria"
      subtitle="Nazwa, ikona lub zdjęcie"
      backHref="/categories"
      tab="categories"
      chrome={false}
    >
      <CategoryForm />
    </AppLayout>
  );
}
