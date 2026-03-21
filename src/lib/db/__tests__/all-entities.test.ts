// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '@/lib/db/index';
import { getDbClient } from '@/lib/db/client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '@/lib/db/schema';
import * as schema from '@/lib/db/schema';
import { getAllAssessments } from '@/lib/db/assessments';
import { getAllIssues } from '@/lib/db/issues';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { createIssue } from '@/lib/db/issues';

function db() {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

beforeAll(async () => {
  await initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  await db().delete(schema.issues);
  await db().delete(schema.assessments);
  await db().delete(schema.projects);
});

describe('getAllAssessments', () => {
  it('returns empty array when no assessments exist', async () => {
    expect(await getAllAssessments()).toEqual([]);
  });

  it('returns all assessments across all projects with project name and issue count', async () => {
    const p1 = await createProject({ name: 'Alpha Project' });
    const p2 = await createProject({ name: 'Beta Project' });
    const a1 = await createAssessment(p1.id, { name: 'First Assessment', status: 'ready' });
    const a2 = await createAssessment(p2.id, { name: 'Second Assessment', status: 'completed' });
    await createIssue(a1.id, { title: 'Issue 1', severity: 'high' });

    const result = await getAllAssessments();
    expect(result).toHaveLength(2);
    expect(result[0]!.project_name).toBeDefined();
    const found1 = result.find((a) => a.id === a1.id);
    expect(found1?.project_name).toBe('Alpha Project');
    expect(found1?.issue_count).toBe(1);
    const found2 = result.find((a) => a.id === a2.id);
    expect(found2?.issue_count).toBe(0);
  });
});

describe('getAllIssues', () => {
  it('returns empty array when no issues exist', async () => {
    expect(await getAllIssues()).toEqual([]);
  });

  it('returns all issues with project and assessment names', async () => {
    const p1 = await createProject({ name: 'Alpha Project' });
    const a1 = await createAssessment(p1.id, { name: 'My Assessment' });
    await createIssue(a1.id, { title: 'Missing alt text', severity: 'high' });

    const result = await getAllIssues();
    expect(result).toHaveLength(1);
    expect(result[0]!.project_name).toBe('Alpha Project');
    expect(result[0]!.project_id).toBe(p1.id);
    expect(result[0]!.assessment_name).toBe('My Assessment');
    expect(result[0]!.title).toBe('Missing alt text');
  });
});
