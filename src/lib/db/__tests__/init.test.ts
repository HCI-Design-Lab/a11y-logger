// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { initDb, closeDb } from '../index';

describe('initDb', () => {
  afterEach(() => {
    closeDb();
  });

  it('runs migrations and returns the database', () => {
    const db = initDb(':memory:');
    // Verify tables were created by the migration
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND substr(name,1,1) != '_' ORDER BY name"
      )
      .all() as Array<{ name: string }>;
    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('projects');
    expect(tableNames).toContain('assessments');
    expect(tableNames).toContain('issues');
    expect(tableNames).toContain('reports');
    expect(tableNames).toContain('vpats');
    expect(tableNames).toContain('settings');
    expect(tableNames).toContain('users');
  });

  it('is idempotent — calling initDb twice does not throw', () => {
    initDb(':memory:');
    expect(() => initDb(':memory:')).not.toThrow();
  });
});
