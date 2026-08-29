import { getUserCount } from '@/lib/services/users';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import SetupForm from './SetupForm';
import { AuthScreen } from '@/components/AuthScreen';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const count = await getUserCount();
  if (count > 0) {
    const user = await getCurrentUser();
    if (user) {
      redirect('/');
    } else {
      redirect('/login');
    }
  }

  return (
    <AuthScreen
      title="Konfiguracja katalogu"
      subtitle="Utwórz pierwsze konto, żeby zacząć spisywać rzeczy w domu."
    >
      <SetupForm />
    </AuthScreen>
  );
}
