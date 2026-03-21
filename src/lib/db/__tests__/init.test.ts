// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDb } from '../client';

describe('initDb', () => {
  afterEach(() => {
    closeDb();
  });

  it('runs migrations and returns the database', async () => {
    await initDb(':memory:');
    // Verify tables were created by the migration using the raw sqlite client
    const rawDb = getDb();
    expect(rawDb).not.toBeNull();
    const tables = rawDb!
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

  it('is idempotent — calling initDb twice does not throw', async () => {
    await initDb(':memory:');
    await expect(initDb(':memory:')).resolves.not.toThrow();
  });
});
