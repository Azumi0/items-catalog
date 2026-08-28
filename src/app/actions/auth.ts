'use server';

import { getSession } from '@/lib/session';
import { setupFirstUser, authenticateUser } from '@/lib/services/users';
import { redirect } from 'next/navigation';

export async function setupFirstUserAction(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!username || !password) {
    return { error: 'Nazwa użytkownika i hasło są wymagane.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Hasła nie są identyczne.' };
  }

  try {
    // setupFirstUser validates the password itself — see services/users.ts.
    const user = await setupFirstUser(username, password);
    const session = await getSession();
    session.user = { id: user.id, username: user.username };
    session.isLoggedIn = true;
    await session.save();
  } catch (err: any) {
    return { error: err.message || 'Błąd podczas konfiguracji administratora.' };
  }

  redirect('/');
}

export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Wprowadź login i hasło.' };
  }

  const user = await authenticateUser(username, password);
  if (!user) {
    return { error: 'Nieprawidłowy login lub hasło.' };
  }

  const session = await getSession();
  session.user = { id: user.id, username: user.username };
  session.isLoggedIn = true;
  await session.save();

  redirect('/');
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
