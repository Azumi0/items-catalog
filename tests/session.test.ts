import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { testTmpDir } from './helpers/tmpdir';

/**
 * A cookie jar standing in for `next/headers`, shared by the session module
 * and by this test's own bookkeeping.
 *
 * iron-session is left real: the tests seal and unseal actual cookies, so what
 * is under test is the decision getCurrentUser makes about a genuine session,
 * not a stubbed one.
 */
const jar = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set: (nameOrOptions: string | { name: string; value: string }, value?: string) => {
      if (typeof nameOrOptions === 'string') {
        jar.set(nameOrOptions, value ?? '');
      } else {
        jar.set(nameOrOptions.name, nameOrOptions.value);
      }
    },
    delete: (name: string) => jar.delete(name),
  }),
}));

/** Flipped by the fail-closed test to make the database read blow up. */
let databaseIsBroken = false;

vi.mock('@/lib/services/users', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/users')>();
  return {
    ...actual,
    getUserAuthState: async (id: string) => {
      if (databaseIsBroken) {
        throw new Error('SQLITE_IOERR: disk I/O error');
      }
      return actual.getUserAuthState(id);
    },
  };
});

const { closeDb } = await import('@/db');
const { runMigrations } = await import('@/db/migrate');
const { setupFirstUser, createUser, changePassword, deleteUser } = await import(
  '@/lib/services/users'
);
const { getSession, getCurrentUser, requireAuth } = await import('@/lib/session');

const TEST_DB_DIR = testTmpDir('test-session-db');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'app.db');

/** Sign in as this account by hand, the way loginAction would. */
async function signIn(user: { id: string; username: string; sessionVersion?: number }) {
  const session = await getSession();
  session.user = {
    id: user.id,
    username: user.username,
    sessionVersion: user.sessionVersion,
  };
  session.isLoggedIn = true;
  await session.save();
}

describe('Session revocation', () => {
  beforeEach(() => {
    jar.clear();
    databaseIsBroken = false;
    closeDb();
    process.env.DATABASE_URL = TEST_DB_PATH;
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    runMigrations();
  });

  afterEach(() => {
    closeDb();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    delete process.env.DATABASE_URL;
  });

  it('honours a session whose account is unchanged', async () => {
    const user = await setupFirstUser('domownik', 'poprawneHaslo123');
    await signIn(user);

    const current = await getCurrentUser();
    expect(current).toEqual({ id: user.id, username: 'domownik' });
  });

  it('stops honouring the session of a deleted account', async () => {
    const owner = await setupFirstUser('domownik', 'poprawneHaslo123');
    const guest = await createUser('gosc', 'inneHaslo12345');
    await signIn(guest);

    expect(await getCurrentUser()).not.toBeNull();

    await deleteUser(owner.id, guest.id);

    // Before ADR-007 the row was gone but the cookie carried on working for up
    // to a week — and since every signed-in user may manage accounts, the
    // deleted user could simply create themselves a new one.
    expect(await getCurrentUser()).toBeNull();
  });

  it('stops honouring sessions issued before a password change', async () => {
    const user = await setupFirstUser('domownik', 'poprawneHaslo123');
    await signIn(user);
    expect(await getCurrentUser()).not.toBeNull();

    await changePassword(user.id, 'zupelnieNoweHaslo123');

    // This is what makes "change the password" a real response to a suspected
    // leak rather than a gesture.
    expect(await getCurrentUser()).toBeNull();
  });

  it('honours a session restamped with the new version', async () => {
    const user = await setupFirstUser('domownik', 'poprawneHaslo123');
    await signIn(user);

    const sessionVersion = await changePassword(user.id, 'zupelnieNoweHaslo123');
    await signIn({ ...user, sessionVersion });

    // Changing your own password must not sign you out of the browser you did
    // it from — only of every other device.
    expect(await getCurrentUser()).not.toBeNull();
  });

  it('reads a cookie predating the version field as version zero', async () => {
    const user = await setupFirstUser('domownik', 'poprawneHaslo123');

    // Cookies issued before ADR-007 carry no version. Every existing account
    // starts at 0, so deploying this must not sign the household out.
    await signIn({ id: user.id, username: user.username, sessionVersion: undefined });

    expect(await getCurrentUser()).not.toBeNull();
  });

  it('fails closed when the database cannot be read', async () => {
    const user = await setupFirstUser('domownik', 'poprawneHaslo123');
    await signIn(user);

    databaseIsBroken = true;

    // Silence from the database is not evidence that a session is still valid,
    // and this is the only door in.
    expect(await getCurrentUser()).toBeNull();
  });

  it('refuses a revoked session at requireAuth, not just at page level', async () => {
    const owner = await setupFirstUser('domownik', 'poprawneHaslo123');
    const guest = await createUser('gosc', 'inneHaslo12345');
    await signIn(guest);
    await deleteUser(owner.id, guest.id);

    // Server Actions are the write path; they must reject the same cookie the
    // pages reject.
    await expect(requireAuth()).rejects.toThrow('Unauthorized');
  });
});
