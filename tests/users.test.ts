import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as schema from '@/db/schema';
import { runMigrations } from '@/db/migrate';
import {
  getUserCount,
  getUsers,
  setupFirstUser,
  createUser,
  changePassword,
  deleteUser,
  authenticateUser,
} from '@/lib/services/users';
import fs from 'fs';
import path from 'path';
import { testTmpDir } from './helpers/tmpdir';

import { closeDb, getDb } from '@/db';
import { eq } from 'drizzle-orm';

const TEST_DB_DIR = testTmpDir('test-users-db');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'app.db');

describe('Users Management Seam', () => {
  beforeEach(() => {
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

  it('allows setup of first user only when 0 users exist', async () => {
    expect(await getUserCount()).toBe(0);

    const firstUser = await setupFirstUser('admin', 'adminPassword123');
    expect(firstUser.id).toBeDefined();
    expect(firstUser.username).toBe('admin');
    expect(await getUserCount()).toBe(1);

    // Second attempt to setupFirstUser should fail
    await expect(setupFirstUser('anotherAdmin', 'pass123')).rejects.toThrow(
      /tylko wtedy, gdy w systemie nie ma żadnych użytkowników/i
    );
  });

  it('authenticates user with correct credentials', async () => {
    await setupFirstUser('alice', 'alicePass123');

    const authResult = await authenticateUser('alice', 'alicePass123');
    expect(authResult).not.toBeNull();
    expect(authResult?.username).toBe('alice');

    const invalidAuth = await authenticateUser('alice', 'wrongPassword');
    expect(invalidAuth).toBeNull();

    const nonExistent = await authenticateUser('bob', 'alicePass123');
    expect(nonExistent).toBeNull();
  });

  it('creates additional users and lists all users', async () => {
    await setupFirstUser('admin', 'admin123');
    const newUser = await createUser('bob', 'bobSecret123');

    expect(newUser.username).toBe('bob');
    expect(await getUserCount()).toBe(2);

    const allUsers = await getUsers();
    expect(allUsers.length).toBe(2);
    expect(allUsers.some((u) => u.username === 'admin')).toBe(true);
    expect(allUsers.some((u) => u.username === 'bob')).toBe(true);
  });

  it('changes user password', async () => {
    const user = await setupFirstUser('admin', 'oldPass123');
    await changePassword(user.id, 'newPass456');

    expect(await authenticateUser('admin', 'oldPass123')).toBeNull();
    expect(await authenticateUser('admin', 'newPass456')).not.toBeNull();
  });

  it('enforces deletion rules: cannot delete self and cannot delete last user', async () => {
    const admin = await setupFirstUser('admin', 'admin123');

    // Rule 1: Cannot delete self
    await expect(deleteUser(admin.id, admin.id)).rejects.toThrow(
      /nie możesz usunąć samego siebie/i
    );

    const bob = await createUser('bob', 'bob123');

    // Rule 2: Bob can be deleted by admin
    await deleteUser(admin.id, bob.id);
    expect(await getUserCount()).toBe(1);

    // Rule 3: Cannot delete the last user even if somehow attempting
    await expect(deleteUser('some-other-id', admin.id)).rejects.toThrow(
      /nie można usunąć jedynego konta/i
    );
  });

  it('allows deleting a user who authored items without breaking foreign keys', async () => {
    const admin = await setupFirstUser('admin', 'admin123');
    const bob = await createUser('bob', 'bob123');

    const db = getDb();
    const catId = crypto.randomUUID();
    await db.insert(schema.categories).values({
      id: catId,
      name: 'General',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const itemId = crypto.randomUUID();
    await db.insert(schema.items).values({
      id: itemId,
      categoryId: catId,
      description: 'Bob item',
      mainImage: 'item.jpg',
      additionalImages: [],
      createdById: bob.id,
      createdByName: bob.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Delete Bob
    await deleteUser(admin.id, bob.id);
    expect(await getUserCount()).toBe(1);

    // Item still exists with preserved author name snapshot and null createdById
    const [item] = await db.select().from(schema.items).where(eq(schema.items.id, itemId));
    expect(item).toBeDefined();
    expect(item.createdByName).toBe('bob');
    expect(item.createdById).toBeNull();
  });
});
