import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from './migrate';
import { loadMigrations } from './load-migrations';

let db: Database.Database | null = null;

const DEFAULT_DB_PATH = './data/a11y-logger.db';
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

export function getDb(dbPath?: string): Database.Database {
  if (db) return db;

  const resolvedPath = dbPath ?? process.env.DATABASE_PATH ?? DEFAULT_DB_PATH;
  db = new Database(resolvedPath);

  if (resolvedPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');

  return db;
}

export function initDb(dbPath?: string): Database.Database {
  const database = getDb(dbPath);
  const migrations = loadMigrations(MIGRATIONS_DIR);
  runMigrations(database, migrations);
  return database;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
