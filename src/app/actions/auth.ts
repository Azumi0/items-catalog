'use server';

import { getSession, getCurrentUser } from '@/lib/session';
import { getUserCount, setupFirstUser, authenticateUser, validatePassword } from '@/lib/services/users';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function getAuthStatusAction() {
  const count = await getUserCount();
  const user = await getCurrentUser();
  return {
    userCount: count,
    user,
    needsSetup: count === 0,
    isAuthenticated: !!user,
  };
}

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
    validatePassword(password);
  } catch (err: any) {
    return { error: err.message || 'Hasło musi mieć co najmniej 4 znaki.' };
  }

  try {
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
