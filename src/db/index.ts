import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

export function getDatabasePath(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const dataDir = process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : path.resolve(process.cwd(), 'data'));
  return path.join(dataDir, 'app.db');
}

function initDb(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const instance = {
    sqlite,
    db: drizzle(sqlite, { schema }),
  };

  // Run migrations if needed
  try {
    const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
    if (fs.existsSync(migrationsFolder)) {
      const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
      migrate(instance.db, { migrationsFolder });
    }
  } catch (err) {
    // ignore if already migrated
  }

  return instance;
}

let dbInstance: { path: string; sqlite: Database.Database; db: ReturnType<typeof drizzle<typeof schema>> } | null = null;

function getOrCreateInstance() {
  const currentPath = getDatabasePath();
  if (!dbInstance || dbInstance.path !== currentPath) {
    if (dbInstance) {
      try {
        dbInstance.sqlite.close();
      } catch {
        // ignore
      }
    }
    const initialized = initDb(currentPath);
    dbInstance = {
      path: currentPath,
      sqlite: initialized.sqlite,
      db: initialized.db,
    };
  }
  return dbInstance;
}

export function getDb() {
  return getOrCreateInstance().db;
}

export function getSqlite() {
  return getOrCreateInstance().sqlite;
}

export function closeDb() {
  if (dbInstance) {
    try {
      dbInstance.sqlite.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
}

