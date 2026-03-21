import Database from 'better-sqlite3';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as sqliteSchema from './schema';
import * as pgSchema from './schema.pg';

type SQLiteClient = BetterSQLite3Database<typeof sqliteSchema>;
type PgClient = PostgresJsDatabase<typeof pgSchema>;

type DbState =
  | { type: 'sqlite'; db: SQLiteClient; raw: Database.Database }
  | { type: 'pg'; db: PgClient };

let state: DbState | null = null;

export function isPostgres(): boolean {
  const url = process.env.DATABASE_URL ?? '';
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

/**
 * Initialize the Drizzle client using an existing better-sqlite3 connection.
 * Call this AFTER running migrations (initDb in index.ts passes its connection here).
 * For PostgreSQL, the sqliteDb parameter is ignored and DATABASE_URL is used instead.
 */
export function initDbClient(sqliteDb?: Database.Database): void {
  closeDbClient();

  if (isPostgres()) {
    // Lazy import to avoid loading postgres module when using SQLite
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle: drizzlePg } = require('drizzle-orm/postgres-js');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const postgres = require('postgres');
    const pgClient = postgres(process.env.DATABASE_URL!);
    state = { type: 'pg', db: drizzlePg(pgClient, { schema: pgSchema }) };
  } else {
    if (!sqliteDb) throw new Error('initDbClient requires a Database instance for SQLite mode');
    const db = drizzleSQLite(sqliteDb, { schema: sqliteSchema });
    state = { type: 'sqlite', db, raw: sqliteDb };
  }
}

/**
 * Returns the Drizzle client. Throws if initDbClient() has not been called.
 */
export function getDbClient(): SQLiteClient | PgClient {
  if (!state) throw new Error('Database client not initialized. Call initDbClient() first.');
  return state.db;
}

/**
 * Returns the raw better-sqlite3 Database instance (SQLite mode only).
 * Used by settings and criteria-seed which run during initDb() before Drizzle is available.
 */
export function getDb(): Database.Database | null {
  if (!state || state.type !== 'sqlite') return null;
  return state.raw;
}

/**
 * Tears down the Drizzle client. Safe to call multiple times.
 */
export function closeDbClient(): void {
  state = null;
}

// Re-export schema for use in data access files
export { sqliteSchema as schema };
export { pgSchema };
