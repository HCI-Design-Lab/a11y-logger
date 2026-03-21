// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { initDbClient, getDbClient, closeDbClient, isPostgres, getDb as getRawDb } from '../client';

let testSqliteDb: Database.Database;

beforeAll(() => {
  testSqliteDb = new Database(':memory:');
});

afterAll(() => {
  closeDbClient();
  testSqliteDb?.close();
});

describe('isPostgres', () => {
  it('returns false when DATABASE_URL is not set', () => {
    delete process.env.DATABASE_URL;
    expect(isPostgres()).toBe(false);
  });

  it('returns true when DATABASE_URL starts with postgresql://', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';
    expect(isPostgres()).toBe(true);
    delete process.env.DATABASE_URL;
  });

  it('returns true when DATABASE_URL starts with postgres://', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost/db';
    expect(isPostgres()).toBe(true);
    delete process.env.DATABASE_URL;
  });
});

describe('initDbClient / getDbClient', () => {
  it('throws before init', () => {
    closeDbClient();
    expect(() => getDbClient()).toThrow('Database client not initialized');
  });

  it('returns a drizzle client after init with a sqlite db', () => {
    initDbClient(testSqliteDb);
    const client = getDbClient();
    expect(client).toBeDefined();
    expect(typeof client.select).toBe('function');
  });

  it('getRawDb returns the underlying better-sqlite3 instance', () => {
    initDbClient(testSqliteDb);
    expect(getRawDb()).toBe(testSqliteDb);
  });
});

describe('closeDbClient', () => {
  it('clears the client so getDbClient throws afterwards', () => {
    initDbClient(testSqliteDb);
    closeDbClient();
    expect(() => getDbClient()).toThrow('Database client not initialized');
  });

  it('is safe to call multiple times', () => {
    expect(() => {
      closeDbClient();
      closeDbClient();
    }).not.toThrow();
  });
});
