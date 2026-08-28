import { getDb } from '@/db';
import { users, User } from '@/db/schema';
import { count, eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function getUserCount(): Promise<number> {
  const db = getDb();
  const result = await db.select({ count: count() }).from(users);
  return result[0]?.count ?? 0;
}

export async function getUsers(): Promise<Array<Omit<User, 'passwordHash'>>> {
  const db = getDb();
  const allUsers = await db.select().from(users).orderBy(users.createdAt);
  return allUsers.map(({ passwordHash: _, ...rest }) => rest);
}

export const MIN_PASSWORD_LENGTH = 4;

export function validatePassword(password: string): void {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaki.`);
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

export async function changePassword(
  userId: string,
  newPassword: string
): Promise<void> {
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
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));
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
): Promise<{ id: string; username: string } | null> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username.trim()))
    .limit(1);

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
  };
}
