import { requireAuthPage } from '@/lib/session';
import { getUsers } from '@/lib/services/users';
import { AppLayout } from '@/components/AppLayout';
import { UsersManager } from '@/components/UsersManager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await requireAuthPage();

  const allUsers = await getUsers();

  return (
    <AppLayout user={user}>
      <UsersManager initialUsers={allUsers} currentUserId={user.id} />
    </AppLayout>
  );
}
