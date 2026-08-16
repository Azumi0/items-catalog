import { getCurrentUser } from '@/lib/session';
import { getUsers } from '@/lib/services/users';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { UsersManager } from '@/components/UsersManager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const allUsers = await getUsers();

  return (
    <AppLayout user={user}>
      <UsersManager initialUsers={allUsers} currentUserId={user.id} />
    </AppLayout>
  );
}
