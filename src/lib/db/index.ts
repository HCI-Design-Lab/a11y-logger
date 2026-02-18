import Database from 'better-sqlite3';

let db: Database.Database | null = null;

export function getDb(dbPath?: string): Database.Database {
  if (db) return db;

  const path = dbPath ?? process.env.DATABASE_PATH ?? './data/a11y-logger.db';
  db = new Database(path);

  if (path !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
