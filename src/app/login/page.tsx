import { getUserCount } from '@/lib/services/users';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';
import { AuthScreen } from '@/components/AuthScreen';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const count = await getUserCount();
  if (count === 0) {
    redirect('/setup');
  }

  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }

  return (
    <AuthScreen
      title="Katalog Domowy"
      subtitle="Zaloguj się, żeby przeglądać i dodawać przedmioty."
    >
      <LoginForm />
    </AuthScreen>
  );
}
