import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import crypto from 'crypto';

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  /**
   * Bumped whenever this account's password changes, and compared against the
   * copy carried in the session cookie (ADR-007).
   *
   * Sessions are self-contained encrypted cookies with no server-side record,
   * so without this there is nothing to revoke: changing a password because it
   * is believed to have leaked would leave whoever holds it signed in for up
   * to a week. One integer turns "change the password" back into an action
   * that actually evicts somebody.
   */
  sessionVersion: integer('session_version').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const categories = sqliteTable('categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  // Tabler icon name (e.g. IconDeviceLaptop), not a URL.
  icon: text('icon'),
  // Stored image filename, same shape as items.main_image — not a URL.
  mainImage: text('main_image'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const items = sqliteTable('items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  description: text('description'),
  mainImage: text('main_image').notNull(),
  additionalImages: text('additional_images', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .$defaultFn(() => []),
  createdById: text('created_by_id')
    .references(() => users.id, { onDelete: 'set null' }),
  createdByName: text('created_by_name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Item = typeof items.$inferSelect;
