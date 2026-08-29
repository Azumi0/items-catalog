'use server';

import { getSession } from '@/lib/session';
import { setupFirstUser, authenticateUser } from '@/lib/services/users';
import {
  loginThrottleVerdict,
  registerFailedLogin,
  registerSuccessfulLogin,
  type LoginIdentity,
} from '@/lib/loginThrottle';
import { getClientIp } from '@/lib/requestIp';
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

/**
 * Rendered as "spróbuj ponownie za …". Seconds below a minute, whole minutes
 * above, which sidesteps Polish numeral agreement entirely — "za 90 s" and
 * "za 2 min" are both correct regardless of the number in front.
 */
function formatWait(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} s`;
  }
  return `${Math.ceil(seconds / 60)} min`;
}

export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Wprowadź login i hasło.' };
  }

  // Both halves are throttled: the username so that guessing one account is
  // slow wherever it is attempted from, the address so that spraying many
  // usernames from one host is slow too.
  const identity: LoginIdentity = { username, ip: await getClientIp() };

  const verdict = loginThrottleVerdict(identity);
  if (verdict.blocked) {
    return {
      error: `Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za ${formatWait(verdict.retryAfterSeconds)}.`,
    };
  }

  const user = await authenticateUser(username, password);
  if (!user) {
    const afterFailure = registerFailedLogin(identity);
    if (afterFailure.blocked) {
      return {
        error: `Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za ${formatWait(afterFailure.retryAfterSeconds)}.`,
      };
    }
    // Deliberately identical for an unknown username and a wrong password:
    // telling the two apart hands an attacker a list of real accounts.
    return { error: 'Nieprawidłowy login lub hasło.' };
  }

  registerSuccessfulLogin(identity);

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
