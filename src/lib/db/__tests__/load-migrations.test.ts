// @vitest-environment node
import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { loadMigrations } from '../load-migrations';

describe('loadMigrations', () => {
  it('loads .sql files from a directory in sorted order', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'));
    fs.writeFileSync(path.join(tmpDir, '002_second.sql'), 'CREATE TABLE second (id TEXT);');
    fs.writeFileSync(path.join(tmpDir, '001_first.sql'), 'CREATE TABLE first (id TEXT);');
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), 'ignore me');

    const migrations = loadMigrations(tmpDir);

    expect(migrations).toHaveLength(2);
    expect(migrations[0]?.name).toBe('001_first.sql');
    expect(migrations[1]?.name).toBe('002_second.sql');
    expect(migrations[0]?.sql).toContain('CREATE TABLE first');

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('returns empty array for empty directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'));

    const migrations = loadMigrations(tmpDir);
    expect(migrations).toEqual([]);

    fs.rmSync(tmpDir, { recursive: true });
  });
});
