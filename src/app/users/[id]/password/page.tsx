import { requireAuthPage } from '@/lib/session';
import { getUser } from '@/lib/services/users';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PasswordForm } from '@/components/UserForm';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requireAuthPage();

  const { id } = await params;
  const target = await getUser(id);

  if (!target) {
    notFound();
  }

  return (
    <AppLayout
      user={currentUser}
      title="Zmiana hasła"
      subtitle={target.username}
      backHref="/users"
      tab="users"
      chrome={false}
    >
      <PasswordForm user={target} />
    </AppLayout>
  );
}
