// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { getAllAssessments } from '@/lib/db/assessments';
import { getAllIssues } from '@/lib/db/issues';

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

describe('getAllAssessments', () => {
  it('returns empty array when no assessments exist', () => {
    expect(getAllAssessments()).toEqual([]);
  });

  it('returns all assessments across all projects with project name and issue count', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p1', 'Alpha Project', '2026-01-01', '2026-01-01')`
    ).run();
    db.prepare(
      `INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p2', 'Beta Project', '2026-01-01', '2026-01-01')`
    ).run();
    db.prepare(
      `INSERT INTO assessments (id, project_id, name, status, created_at, updated_at) VALUES ('a1', 'p1', 'First Assessment', 'planning', '2026-01-01', '2026-01-01')`
    ).run();
    db.prepare(
      `INSERT INTO assessments (id, project_id, name, status, created_at, updated_at) VALUES ('a2', 'p2', 'Second Assessment', 'completed', '2026-02-01', '2026-02-01')`
    ).run();
    db.prepare(
      `INSERT INTO issues (id, assessment_id, title, severity, status, created_at, updated_at) VALUES ('i1', 'a1', 'Issue 1', 'high', 'open', '2026-01-01', '2026-01-01')`
    ).run();

    const result = getAllAssessments();
    expect(result).toHaveLength(2);
    expect(result[0]!.project_name).toBeDefined();
    const a1 = result.find((a) => a.id === 'a1');
    expect(a1?.project_name).toBe('Alpha Project');
    expect(a1?.issue_count).toBe(1);
  });
});

describe('getAllIssues', () => {
  it('returns empty array when no issues exist', () => {
    expect(getAllIssues()).toEqual([]);
  });

  it('returns all issues with project and assessment names', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p1', 'Alpha Project', '2026-01-01', '2026-01-01')`
    ).run();
    db.prepare(
      `INSERT INTO assessments (id, project_id, name, status, created_at, updated_at) VALUES ('a1', 'p1', 'My Assessment', 'planning', '2026-01-01', '2026-01-01')`
    ).run();
    db.prepare(
      `INSERT INTO issues (id, assessment_id, title, severity, status, created_at, updated_at) VALUES ('i1', 'a1', 'Missing alt text', 'high', 'open', '2026-01-01', '2026-01-01')`
    ).run();

    const result = getAllIssues();
    expect(result).toHaveLength(1);
    expect(result[0]!.project_name).toBe('Alpha Project');
    expect(result[0]!.project_id).toBe('p1');
    expect(result[0]!.assessment_name).toBe('My Assessment');
    expect(result[0]!.title).toBe('Missing alt text');
  });
});
