'use server';

import { requireAuth } from '@/lib/session';
import {
  getUsers,
  createUser,
  changePassword,
  deleteUser,
} from '@/lib/services/users';
import { revalidatePath } from 'next/cache';

export async function getUsersAction() {
  await requireAuth();
  return getUsers();
}

export async function createUserAction(prevState: any, formData: FormData) {
  await requireAuth();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Nazwa użytkownika i hasło są wymagane.' };
  }

  if (password.length < 4) {
    return { error: 'Hasło musi mieć co najmniej 4 znaki.' };
  }

  try {
    await createUser(username, password);
    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Błąd podczas tworzenia użytkownika.' };
  }
}

export async function changePasswordAction(prevState: any, formData: FormData) {
  await requireAuth();
  const userId = formData.get('userId') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!userId || !newPassword) {
    return { error: 'Użytkownik i nowe hasło są wymagane.' };
  }

  if (newPassword.length < 4) {
    return { error: 'Hasło musi mieć co najmniej 4 znaki.' };
  }

  try {
    await changePassword(userId, newPassword);
    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Błąd podczas zmiany hasła.' };
  }
}

export async function deleteUserAction(targetUserId: string) {
  const currentUser = await requireAuth();

  try {
    await deleteUser(currentUser.id, targetUserId);
    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Błąd podczas usuwania użytkownika.' };
  }
}
