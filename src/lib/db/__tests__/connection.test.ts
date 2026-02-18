// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getDb, closeDb } from '../index';

describe('database connection', () => {
  afterEach(() => {
    closeDb();
  });

  it('returns a database instance', () => {
    const db = getDb(':memory:');
    expect(db).toBeDefined();
    expect(db.open).toBe(true);
  });

  it('returns the same instance on subsequent calls (singleton)', () => {
    const db1 = getDb(':memory:');
    const db2 = getDb(':memory:');
    expect(db1).toBe(db2);
  });

  it('enables WAL mode for file-based databases', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-wal-'));
    const dbPath = path.join(tmpDir, 'test.db');
    const fileDb = getDb(dbPath);
    const result = fileDb.pragma('journal_mode') as Array<{ journal_mode: string }>;
    expect(result[0]?.journal_mode).toBe('wal');
    closeDb();
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('enables foreign keys', () => {
    const db = getDb(':memory:');
    const result = db.pragma('foreign_keys') as Array<{ foreign_keys: number }>;
    expect(result[0]?.foreign_keys).toBe(1);
  });

  it('closes the database connection', () => {
    const db = getDb(':memory:');
    closeDb();
    expect(db.open).toBe(false);
  });

  it('creates the parent directory if it does not exist', () => {
    const tmpDir = path.join(os.tmpdir(), `a11y-test-${Date.now()}`);
    const dbPath = path.join(tmpDir, 'test.db');

    const testDb = getDb(dbPath);
    expect(testDb.open).toBe(true);
    expect(fs.existsSync(tmpDir)).toBe(true);

    closeDb();
    fs.rmSync(tmpDir, { recursive: true });
  });
});
