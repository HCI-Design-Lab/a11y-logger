import { sql } from 'drizzle-orm';
import { isPostgres } from './client';

/**
 * Returns a WHERE-clause expression that checks whether a JSON array column contains a value.
 * SQLite: uses json_each(); PostgreSQL: uses the jsonb @> operator.
 */
export function jsonArrayContains(columnName: string, value: string) {
  if (isPostgres()) {
    return sql`${sql.raw(columnName)}::jsonb @> ${JSON.stringify([value])}::jsonb`;
  }
  return sql`EXISTS (SELECT 1 FROM json_each(${sql.raw(columnName)}) WHERE value = ${value})`;
}

/**
 * Returns the current-timestamp expression for use in UPDATE SET clauses.
 * SQLite: datetime('now'); PostgreSQL: NOW()
 */
export function nowTimestamp() {
  if (isPostgres()) {
    return sql`NOW()`;
  }
  return sql`datetime('now')`;
}
