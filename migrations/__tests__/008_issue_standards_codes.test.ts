// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('migration 008: issue standards codes', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE issues (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        wcag_codes TEXT DEFAULT '[]'
      );
      INSERT INTO issues (id, title) VALUES ('test-1', 'Test Issue');
    `);
    const sql = readFileSync(
      join(process.cwd(), 'migrations/008_issue_standards_codes.sql'),
      'utf8'
    );
    db.exec(sql);
  });

  afterEach(() => db.close());

  it('adds section_508_codes column with default empty array', () => {
    const row = db.prepare('SELECT section_508_codes FROM issues WHERE id = ?').get('test-1') as {
      section_508_codes: string;
    };
    expect(row.section_508_codes).toBe('[]');
  });

  it('adds eu_codes column with default empty array', () => {
    const row = db.prepare('SELECT eu_codes FROM issues WHERE id = ?').get('test-1') as {
      eu_codes: string;
    };
    expect(row.eu_codes).toBe('[]');
  });

  it('allows inserting issues with the new columns', () => {
    db.prepare(
      `INSERT INTO issues (id, title, section_508_codes, eu_codes) VALUES (?, ?, ?, ?)`
    ).run('test-2', 'New Issue', JSON.stringify(['302.1']), JSON.stringify(['4.2.1']));
    const row = db
      .prepare('SELECT section_508_codes, eu_codes FROM issues WHERE id = ?')
      .get('test-2') as { section_508_codes: string; eu_codes: string };
    expect(JSON.parse(row.section_508_codes)).toEqual(['302.1']);
    expect(JSON.parse(row.eu_codes)).toEqual(['4.2.1']);
  });
});
