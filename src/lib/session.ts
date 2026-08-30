import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData, defaultSession } from './auth';
import { getUserAuthState, getUserCount } from '@/lib/services/users';

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
  }
  return session;
}

/**
 * Best-effort removal of a cookie we have just decided is worthless.
 *
 * Cookies can only be written from a Server Action or a Route Handler; the
 * same check runs during page rendering, where `set` throws. That failure is
 * not worth propagating — the caller is already treating the request as signed
 * out, and the page it redirects to is public, so nothing loops. The cookie
 * gets cleared on the next request that is allowed to write one.
 */
async function discardRevokedSession(
  session: Awaited<ReturnType<typeof getSession>>
): Promise<void> {
  try {
    session.destroy();
  } catch {
    // Rendering a Server Component. Nothing to do here.
  }
}

/**
 * The signed-in account, or null.
 *
 * This reads the database rather than trusting the cookie alone, and that is
 * the whole point (ADR-007). An iron-session cookie is self-contained: once
 * issued it is valid for a week and no server-side act can take it back. Two
 * consequences followed, and both are closed here.
 *
 * A deleted account kept working. `deleteUser` removes the row, but nothing
 * looked at rows — so the deleted user carried on browsing, and since every
 * signed-in user may manage accounts, could simply create themselves a new one.
 *
 * A changed password evicted nobody. That is the response anyone reaches for
 * on suspecting a leak, and for a service published to the internet it has to
 * mean something. Now it does: `changePassword` bumps `session_version`, and
 * every cookie stamped with the old one stops being honoured on its next
 * request.
 *
 * The cost is one primary-key read per authenticated request against a local
 * SQLite file — the same order as the `getUserCount` that `requireAuthPage`
 * already performs on every page.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user) {
    return null;
  }

  let account: Awaited<ReturnType<typeof getUserAuthState>>;
  try {
    account = await getUserAuthState(session.user.id);
  } catch (err) {
    // Fail closed. Silence from the database is not evidence that a session is
    // still valid, and this is the only door in.
    console.error('Could not verify the session against the database:', err);
    return null;
  }

  // No row: the account was deleted. Version mismatch: its password changed
  // after this cookie was issued.
  if (!account || account.sessionVersion !== (session.user.sessionVersion ?? 0)) {
    await discardRevokedSession(session);
    return null;
  }

  return { id: account.id, username: account.username };
}

export async function requireAuthPage() {
  const count = await getUserCount();
  if (count === 0) {
    redirect('/setup');
  }
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
