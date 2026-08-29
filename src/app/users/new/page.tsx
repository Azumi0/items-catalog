import { requireAuthPage } from '@/lib/session';
import { AppLayout } from '@/components/AppLayout';
import { UserForm } from '@/components/UserForm';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  const user = await requireAuthPage();

  return (
    <AppLayout
      user={user}
      title="Nowy użytkownik"
      subtitle="Login i hasło początkowe"
      backHref="/users"
      tab="users"
      chrome={false}
    >
      <UserForm />
    </AppLayout>
  );
}
