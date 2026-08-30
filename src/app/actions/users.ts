'use server';

import { getSession, requireAuth } from '@/lib/session';
import {
  createUser,
  changePassword,
  deleteUser,
} from '@/lib/services/users';
import { revalidatePath } from 'next/cache';

export async function createUserAction(prevState: any, formData: FormData) {
  await requireAuth();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Nazwa użytkownika i hasło są wymagane.' };
  }

  try {
    // createUser validates the password itself — see services/users.ts.
    await createUser(username, password);
    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Błąd podczas tworzenia użytkownika.' };
  }
}

export async function changePasswordAction(prevState: any, formData: FormData) {
  const currentUser = await requireAuth();
  const userId = formData.get('userId') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!userId || !newPassword) {
    return { error: 'Użytkownik i nowe hasło są wymagane.' };
  }

  try {
    // changePassword validates the password itself — see services/users.ts.
    const sessionVersion = await changePassword(userId, newPassword);

    // Changing a password signs out every cookie issued under the old one
    // (ADR-007) — including, without this, the one that just asked for the
    // change. Restamping keeps the browser doing the work signed in while
    // still evicting that account's other devices, which is the behaviour
    // anyone changing their own password expects. Changing somebody else's
    // account leaves this session alone and signs *them* out everywhere.
    if (userId === currentUser.id) {
      const session = await getSession();
      if (session.user) {
        session.user.sessionVersion = sessionVersion;
        await session.save();
      }
    }

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
