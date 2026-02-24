// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { getTimeSeriesData, getWcagCriteriaCounts } from '../dashboard';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  const db = getDb();
  db.prepare('DELETE FROM issues').run();
  db.prepare('DELETE FROM assessments').run();
  db.prepare('DELETE FROM projects').run();
});

describe('getTimeSeriesData', () => {
  it('returns empty arrays when no data exists', () => {
    const result = getTimeSeriesData('1w');
    expect(result).toEqual([]);
  });

  it('returns daily counts for projects/assessments/issues within range', () => {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);

    db.prepare(
      `INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p1', 'Project 1', ?, ?)`
    ).run(`${today}T10:00:00`, `${today}T10:00:00`);

    db.prepare(
      `INSERT INTO assessments (id, project_id, name, created_at, updated_at) VALUES ('a1', 'p1', 'Assessment 1', ?, ?)`
    ).run(`${today}T10:00:00`, `${today}T10:00:00`);

    const result = getTimeSeriesData('1w');
    const todayEntry = result.find((r) => r.date === today);
    expect(todayEntry).toBeDefined();
    expect(todayEntry!.projects).toBe(1);
    expect(todayEntry!.assessments).toBe(1);
    expect(todayEntry!.issues).toBe(0);
  });

  it('excludes data outside the requested range', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p_old', 'Old Project', '2020-01-01T00:00:00', '2020-01-01T00:00:00')`
    ).run();

    const result = getTimeSeriesData('1w');
    const entry = result.find((r) => r.date === '2020-01-01');
    expect(entry).toBeUndefined();
  });
});

describe('getWcagCriteriaCounts', () => {
  it('returns empty array when no issues exist', () => {
    const result = getWcagCriteriaCounts('perceivable');
    expect(result).toEqual([]);
  });

  it('counts occurrences of each WCAG criterion filtered by principle', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p1', 'P', datetime('now'), datetime('now'))`
    ).run();
    db.prepare(
      `INSERT INTO assessments (id, project_id, name, created_at, updated_at) VALUES ('a1', 'p1', 'A', datetime('now'), datetime('now'))`
    ).run();

    db.prepare(
      `INSERT INTO issues (id, assessment_id, title, wcag_codes, created_at, updated_at) VALUES ('i1', 'a1', 'Issue 1', ?, datetime('now'), datetime('now'))`
    ).run(JSON.stringify(['1.1.1', '1.4.3']));
    db.prepare(
      `INSERT INTO issues (id, assessment_id, title, wcag_codes, created_at, updated_at) VALUES ('i2', 'a1', 'Issue 2', ?, datetime('now'), datetime('now'))`
    ).run(JSON.stringify(['1.1.1', '2.1.1']));

    const perceivable = getWcagCriteriaCounts('perceivable');
    const code111 = perceivable.find((r) => r.code === '1.1.1');
    const code143 = perceivable.find((r) => r.code === '1.4.3');
    expect(code111!.count).toBe(2);
    expect(code143!.count).toBe(1);

    const operable = getWcagCriteriaCounts('operable');
    expect(operable.find((r) => r.code === '1.1.1')).toBeUndefined();
    expect(operable.find((r) => r.code === '2.1.1')!.count).toBe(1);
  });

  it('sorts results by count descending', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p2', 'P', datetime('now'), datetime('now'))`
    ).run();
    db.prepare(
      `INSERT INTO assessments (id, project_id, name, created_at, updated_at) VALUES ('a2', 'p2', 'A', datetime('now'), datetime('now'))`
    ).run();

    db.prepare(
      `INSERT INTO issues (id, assessment_id, title, wcag_codes, created_at, updated_at) VALUES ('j1', 'a2', 'I1', ?, datetime('now'), datetime('now'))`
    ).run(JSON.stringify(['1.4.3', '1.4.3', '1.1.1']));
    db.prepare(
      `INSERT INTO issues (id, assessment_id, title, wcag_codes, created_at, updated_at) VALUES ('j2', 'a2', 'I2', ?, datetime('now'), datetime('now'))`
    ).run(JSON.stringify(['1.4.3']));

    const results = getWcagCriteriaCounts('perceivable');
    expect(results[0]?.count).toBeGreaterThanOrEqual(results[1]?.count ?? 0);
  });

  it('silently skips rows with malformed wcag_codes JSON', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p3', 'P', datetime('now'), datetime('now'))`
    ).run();
    db.prepare(
      `INSERT INTO assessments (id, project_id, name, created_at, updated_at) VALUES ('a3', 'p3', 'A', datetime('now'), datetime('now'))`
    ).run();
    db.prepare(
      `INSERT INTO issues (id, assessment_id, title, wcag_codes, created_at, updated_at) VALUES ('k1', 'a3', 'Bad JSON issue', 'not-valid-json', datetime('now'), datetime('now'))`
    ).run();

    const results = getWcagCriteriaCounts('perceivable');
    expect(results).toEqual([]);
  });
});
