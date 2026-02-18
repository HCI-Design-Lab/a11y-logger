// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../migrate';

describe('migration runner', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
  });

  afterEach(() => {
    db.close();
  });

  it('creates the _migrations tracking table', () => {
    runMigrations(db, []);
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'")
      .get() as { name: string } | undefined;
    expect(table?.name).toBe('_migrations');
  });

  it('runs migrations in order', () => {
    const migrations = [
      { name: '001_create_foo.sql', sql: 'CREATE TABLE foo (id TEXT PRIMARY KEY);' },
      { name: '002_create_bar.sql', sql: 'CREATE TABLE bar (id TEXT PRIMARY KEY);' },
    ];

    runMigrations(db, migrations);

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('foo', 'bar') ORDER BY name"
      )
      .all() as Array<{ name: string }>;
    expect(tables.map((t) => t.name)).toEqual(['bar', 'foo']);
  });

  it('skips already-applied migrations', () => {
    const migrations = [
      { name: '001_create_foo.sql', sql: 'CREATE TABLE foo (id TEXT PRIMARY KEY);' },
    ];

    runMigrations(db, migrations);
    // Run again — should not throw "table already exists"
    runMigrations(db, migrations);

    const applied = db.prepare('SELECT name FROM _migrations ORDER BY name').all() as Array<{
      name: string;
    }>;
    expect(applied).toHaveLength(1);
    expect(applied[0]?.name).toBe('001_create_foo.sql');
  });

  it('records applied migrations with timestamp', () => {
    const migrations = [
      { name: '001_create_foo.sql', sql: 'CREATE TABLE foo (id TEXT PRIMARY KEY);' },
    ];

    runMigrations(db, migrations);

    const record = db
      .prepare('SELECT * FROM _migrations WHERE name = ?')
      .get('001_create_foo.sql') as {
      name: string;
      applied_at: string;
    };
    expect(record.name).toBe('001_create_foo.sql');
    expect(record.applied_at).toBeDefined();
  });

  it('only runs new migrations when some are already applied', () => {
    const first = [{ name: '001_create_foo.sql', sql: 'CREATE TABLE foo (id TEXT PRIMARY KEY);' }];
    runMigrations(db, first);

    const all = [
      ...first,
      { name: '002_create_bar.sql', sql: 'CREATE TABLE bar (id TEXT PRIMARY KEY);' },
    ];
    runMigrations(db, all);

    const applied = db.prepare('SELECT name FROM _migrations ORDER BY name').all() as Array<{
      name: string;
    }>;
    expect(applied).toHaveLength(2);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('foo', 'bar')")
      .all();
    expect(tables).toHaveLength(2);
  });
});
