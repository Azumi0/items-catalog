import { getCurrentUser } from '@/lib/session';
import { getItem } from '@/lib/services/items';
import { redirect, notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { ItemDetailView } from './ItemDetailView';

export const dynamic = 'force-dynamic';

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const item = await getItem(id);

  if (!item) {
    notFound();
  }

  return (
    <AppLayout user={user}>
      <ItemDetailView item={item} />
    </AppLayout>
  );
}
