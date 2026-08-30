import { getDb } from '@/db';
import { users, User } from '@/db/schema';
import { count, eq } from 'drizzle-orm';
import { getDecoyPasswordHash, hashPassword, verifyPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function getUserCount(): Promise<number> {
  const db = getDb();
  const result = await db.select({ count: count() }).from(users);
  return result[0]?.count ?? 0;
}

/**
 * The state every request needs to decide whether a session cookie is still
 * good: does this account still exist, and has its password changed since the
 * cookie was issued (ADR-007)?
 *
 * Deliberately narrow. It runs on every authenticated request, so it reads one
 * row by primary key and returns nothing that would tempt a caller to use it
 * as a general-purpose user lookup.
 */
export async function getUserAuthState(
  id: string
): Promise<{ id: string; username: string; sessionVersion: number } | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: users.id,
      username: users.username,
      sessionVersion: users.sessionVersion,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return row ?? null;
}

export async function getUsers(): Promise<Array<Omit<User, 'passwordHash'>>> {
  const db = getDb();
  const allUsers = await db.select().from(users).orderBy(users.createdAt);
  return allUsers.map(({ passwordHash: _, ...rest }) => rest);
}

export async function getUser(
  id: string
): Promise<Omit<User, 'passwordHash'> | null> {
  const db = getDb();
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!row) {
    return null;
  }
  const { passwordHash: _, ...userWithoutPassword } = row;
  return userWithoutPassword;
}

/**
 * Twelve, not the four this started with.
 *
 * Four characters is a defensible floor for a service reachable only from the
 * living room; it is indefensible for one published to the internet (ADR-006),
 * where the entire keyspace fits in a wordlist. The login throttle makes online
 * guessing slow, but it cannot help if `app.db` ever leaves the NAS — a backup
 * on a laptop, a snapshot in someone's cloud — because bcrypt at cost 10 will
 * not save a four-character password from an offline attack.
 *
 * Only checked when a password is written. Accounts created under the old
 * floor keep working; changing their password is what brings them up to it.
 */
export const MIN_PASSWORD_LENGTH = 12;

export function validatePassword(password: string): void {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`);
  }
}

export function validateCredentials(username: string, password: string): string {
  const trimmed = username.trim();
  if (!trimmed) {
    throw new Error('Nazwa użytkownika jest wymagana.');
  }
  validatePassword(password);
  return trimmed;
}

export async function setupFirstUser(
  username: string,
  password: string
): Promise<Omit<User, 'passwordHash'>> {
  const trimmedUsername = validateCredentials(username, password);

  const existingCount = await getUserCount();
  if (existingCount > 0) {
    throw new Error('Konfiguracja pierwszego konta jest możliwa tylko wtedy, gdy w systemie nie ma żadnych użytkowników.');
  }

  const passwordHash = await hashPassword(password);
  const db = getDb();
  const [created] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      username: trimmedUsername,
      passwordHash,
      createdAt: new Date(),
    })
    .returning();

  const { passwordHash: _, ...userWithoutPassword } = created;
  return userWithoutPassword;
}

export async function createUser(
  username: string,
  password: string
): Promise<Omit<User, 'passwordHash'>> {
  const trimmedUsername = validateCredentials(username, password);

  const db = getDb();
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, trimmedUsername))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Użytkownik "${trimmedUsername}" już istnieje.`);
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      username: trimmedUsername,
      passwordHash,
      createdAt: new Date(),
    })
    .returning();

  const { passwordHash: _, ...userWithoutPassword } = created;
  return userWithoutPassword;
}

/**
 * Returns the account's new session version, so the caller can decide what to
 * do about the session it is holding right now.
 *
 * Bumping it signs out every device holding a cookie issued under the old
 * password. That is the point: a self-contained encrypted session cookie
 * cannot otherwise be revoked, so before this the standard response to a
 * suspected leak — change the password — evicted nobody for up to a week.
 */
export async function changePassword(
  userId: string,
  newPassword: string
): Promise<number> {
  validatePassword(newPassword);

  const db = getDb();
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing.length === 0) {
    throw new Error('Nie znaleziono użytkownika.');
  }

  const passwordHash = await hashPassword(newPassword);
  const sessionVersion = existing[0].sessionVersion + 1;
  await db
    .update(users)
    .set({ passwordHash, sessionVersion })
    .where(eq(users.id, userId));

  return sessionVersion;
}

export async function deleteUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  if (currentUserId === targetUserId) {
    throw new Error('Nie możesz usunąć samego siebie.');
  }

  const totalUsers = await getUserCount();
  if (totalUsers <= 1) {
    throw new Error('Nie można usunąć jedynego konta w systemie.');
  }

  const db = getDb();
  await db.delete(users).where(eq(users.id, targetUserId));
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<{ id: string; username: string; sessionVersion: number } | null> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username.trim()))
    .limit(1);

  if (!user) {
    // Burn the same ~80 ms a real account would, so response time does not
    // reveal which usernames exist. See getDecoyPasswordHash.
    await verifyPassword(password, await getDecoyPasswordHash());
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    sessionVersion: user.sessionVersion,
  };
}
