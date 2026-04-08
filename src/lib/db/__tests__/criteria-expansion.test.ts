// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDbClient } from '../client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '../schema';

function dbc() {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

beforeAll(async () => {
  await initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

describe('Section 508 Chapter 4 criteria', () => {
  it('seeds Chapter 4 hardware criteria', () => {
    const rows = dbc().all(
      "SELECT * FROM criteria WHERE standard = '508' AND chapter_section = 'Chapter4'"
    ) as Array<{ code: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.code)).toContain('402.1');
    expect(rows.map((r) => r.code)).toContain('407.6');
    expect(rows.map((r) => r.code)).toContain('415.1.1');
  });
});

describe('EN 301 549 new clause criteria', () => {
  it('seeds Clause 6 criteria', () => {
    const rows = dbc().all(
      "SELECT code FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause6'"
    ) as Array<{ code: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.code)).toContain('6.1');
  });

  it('seeds Clause 7 criteria', () => {
    const rows = dbc().all(
      "SELECT code FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause7'"
    ) as Array<{ code: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.code)).toContain('7.1.1');
  });

  it('seeds Clause 8 criteria', () => {
    const rows = dbc().all(
      "SELECT code FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause8'"
    ) as Array<{ code: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.code)).toContain('8.1.1');
  });

  it('seeds Clause 10 criteria', () => {
    const rows = dbc().all(
      "SELECT code FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause10'"
    ) as Array<{ code: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.code)).toContain('10.1.1.1');
  });

  it('seeds Clause 11 criteria', () => {
    const rows = dbc().all(
      "SELECT code FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause11'"
    ) as Array<{ code: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.code)).toContain('11.1.1.1.1');
  });

  it('seeds Clause 13 criteria', () => {
    const rows = dbc().all(
      "SELECT code FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause13'"
    ) as Array<{ code: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.code)).toContain('13.1.2');
  });
});
