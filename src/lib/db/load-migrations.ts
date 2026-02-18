import fs from 'fs';
import path from 'path';
import type { Migration } from './migrate';

export function loadMigrations(migrationsDir: string): Migration[] {
  if (!fs.existsSync(migrationsDir)) return [];

  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((name) => ({
      name,
      sql: fs.readFileSync(path.join(migrationsDir, name), 'utf-8'),
    }));
}
