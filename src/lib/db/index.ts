import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { runMigrations } from './migrate';
import { loadMigrations } from './load-migrations';
import { seedDefaultSettings } from './settings';
import { seedCriteria } from './criteria-seed';
import { initDbClient, closeDbClient } from './client';

let db: Database.Database | null = null;

const DEFAULT_DB_PATH = './data/a11y-logger.db';
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

export function getDb(dbPath?: string): Database.Database {
  if (db) return db;

  const resolvedPath = dbPath ?? process.env.DATABASE_PATH ?? DEFAULT_DB_PATH;

  if (resolvedPath !== ':memory:') {
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  db = new Database(resolvedPath);

  if (resolvedPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');

  return db;
}

export async function initDb(dbPath?: string): Promise<Database.Database> {
  return initDbSync(dbPath);
}

/**
 * Synchronous initialization — safe because better-sqlite3, migrations, and seeding
 * are all synchronous. Used by getDbClient() for lazy init when instrumentation hasn't run.
 */
export function initDbSync(dbPath?: string): Database.Database {
  const database = getDb(dbPath);
  const migrations = loadMigrations(MIGRATIONS_DIR);
  runMigrations(database, migrations);
  initDbClient(database);
  seedDefaultSettings();
  seedCriteria();
  return database;
}

export function closeDb(): void {
  if (db) {
    closeDbClient();
    db.close();
    db = null;
  }
}
