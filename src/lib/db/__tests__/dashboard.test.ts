// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '@/lib/db/index';
import { getDbClient } from '@/lib/db/client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '@/lib/db/schema';
import { issues, assessments, projects } from '@/lib/db/schema';
import { getTimeSeriesData, getWcagCriteriaCounts, getActionableStats } from '../dashboard';

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
  await db().delete(issues);
  await db().delete(assessments);
  await db().delete(projects);
});

describe('getTimeSeriesData', () => {
  it('returns empty arrays when no data exists', async () => {
    const result = await getTimeSeriesData('1w');
    expect(result).toEqual([]);
  });

  it('returns daily counts for projects/assessments/issues within range', async () => {
    const rawDb = db();
    const today = new Date().toISOString().slice(0, 10);

    // Use raw Drizzle insert for test data setup
    await rawDb.insert(projects).values({
      id: 'p1',
      name: 'Project 1',
      created_at: `${today}T10:00:00`,
      updated_at: `${today}T10:00:00`,
    });

    await rawDb.insert(assessments).values({
      id: 'a1',
      project_id: 'p1',
      name: 'Assessment 1',
      created_at: `${today}T10:00:00`,
      updated_at: `${today}T10:00:00`,
    });

    const result = await getTimeSeriesData('1w');
    const todayEntry = result.find((r) => r.date === today);
    expect(todayEntry).toBeDefined();
    expect(todayEntry!.projects).toBe(1);
    expect(todayEntry!.assessments).toBe(1);
    expect(todayEntry!.issues).toBe(0);
  });

  it('excludes data outside the requested range', async () => {
    await db().insert(projects).values({
      id: 'p_old',
      name: 'Old Project',
      created_at: '2020-01-01T00:00:00',
      updated_at: '2020-01-01T00:00:00',
    });

    const result = await getTimeSeriesData('1w');
    const entry = result.find((r) => r.date === '2020-01-01');
    expect(entry).toBeUndefined();
  });
});

describe('getWcagCriteriaCounts', () => {
  it('returns empty array when no issues exist', async () => {
    const result = await getWcagCriteriaCounts('perceivable');
    expect(result).toEqual([]);
  });

  it('counts occurrences of each WCAG criterion filtered by principle', async () => {
    const d = db();
    const now = new Date().toISOString();

    await d.insert(projects).values({ id: 'p1', name: 'P', created_at: now, updated_at: now });
    await d.insert(assessments).values({
      id: 'a1',
      project_id: 'p1',
      name: 'A',
      created_at: now,
      updated_at: now,
    });
    await d.insert(issues).values({
      id: 'i1',
      assessment_id: 'a1',
      title: 'Issue 1',
      wcag_codes: JSON.stringify(['1.1.1', '1.4.3']),
      created_at: now,
      updated_at: now,
    });
    await d.insert(issues).values({
      id: 'i2',
      assessment_id: 'a1',
      title: 'Issue 2',
      wcag_codes: JSON.stringify(['1.1.1', '2.1.1']),
      created_at: now,
      updated_at: now,
    });

    const perceivable = await getWcagCriteriaCounts('perceivable');
    const code111 = perceivable.find((r) => r.code === '1.1.1');
    const code143 = perceivable.find((r) => r.code === '1.4.3');
    expect(code111!.count).toBe(2);
    expect(code143!.count).toBe(1);

    const operable = await getWcagCriteriaCounts('operable');
    expect(operable.find((r) => r.code === '1.1.1')).toBeUndefined();
    expect(operable.find((r) => r.code === '2.1.1')!.count).toBe(1);
  });

  it('sorts results by count descending', async () => {
    const d = db();
    const now = new Date().toISOString();

    await d.insert(projects).values({ id: 'p2', name: 'P', created_at: now, updated_at: now });
    await d.insert(assessments).values({
      id: 'a2',
      project_id: 'p2',
      name: 'A',
      created_at: now,
      updated_at: now,
    });
    await d.insert(issues).values({
      id: 'j1',
      assessment_id: 'a2',
      title: 'I1',
      wcag_codes: JSON.stringify(['1.4.3', '1.4.3', '1.1.1']),
      created_at: now,
      updated_at: now,
    });
    await d.insert(issues).values({
      id: 'j2',
      assessment_id: 'a2',
      title: 'I2',
      wcag_codes: JSON.stringify(['1.4.3']),
      created_at: now,
      updated_at: now,
    });

    const results = await getWcagCriteriaCounts('perceivable');
    expect(results[0]?.count).toBeGreaterThanOrEqual(results[1]?.count ?? 0);
  });

  it('silently skips rows with malformed wcag_codes JSON', async () => {
    const d = db();
    const now = new Date().toISOString();

    await d.insert(projects).values({ id: 'p3', name: 'P', created_at: now, updated_at: now });
    await d.insert(assessments).values({
      id: 'a3',
      project_id: 'p3',
      name: 'A',
      created_at: now,
      updated_at: now,
    });
    // Insert raw bad JSON via the issues table — wcag_codes has a default so we bypass it with sql
    // Use direct drizzle values with invalid JSON string
    await d.insert(issues).values({
      id: 'k1',
      assessment_id: 'a3',
      title: 'Bad JSON issue',
      wcag_codes: 'not-valid-json',
      created_at: now,
      updated_at: now,
    });

    const results = await getWcagCriteriaCounts('perceivable');
    expect(results).toEqual([]);
  });
});

describe('getActionableStats', () => {
  it('returns zeros when db is empty', async () => {
    const stats = await getActionableStats();
    expect(stats.open_critical_issues).toBe(0);
    expect(stats.in_progress_assessments).toBe(0);
    expect(stats.resolved_this_month).toBe(0);
    expect(stats.active_projects).toBe(0);
    expect(stats.total_projects).toBe(0);
    expect(stats.open_issues_total).toBe(0);
    expect(stats.open_severity_breakdown).toEqual({ critical: 0, high: 0, medium: 0, low: 0 });
  });

  it('counts open critical issues only', async () => {
    const d = db();
    const now = new Date().toISOString();

    await d
      .insert(projects)
      .values({ id: 'p1', name: 'P', status: 'active', created_at: now, updated_at: now });
    await d
      .insert(assessments)
      .values({
        id: 'a1',
        project_id: 'p1',
        name: 'A',
        status: 'completed',
        created_at: now,
        updated_at: now,
      });
    await d
      .insert(issues)
      .values({
        id: 'i1',
        assessment_id: 'a1',
        title: 'T',
        severity: 'critical',
        status: 'open',
        created_at: now,
        updated_at: now,
      });
    await d
      .insert(issues)
      .values({
        id: 'i2',
        assessment_id: 'a1',
        title: 'T',
        severity: 'critical',
        status: 'resolved',
        created_at: now,
        updated_at: now,
      });
    await d
      .insert(issues)
      .values({
        id: 'i3',
        assessment_id: 'a1',
        title: 'T',
        severity: 'high',
        status: 'open',
        created_at: now,
        updated_at: now,
      });

    const stats = await getActionableStats();
    expect(stats.open_critical_issues).toBe(1);
    expect(stats.open_issues_total).toBe(2);
    expect(stats.open_severity_breakdown.critical).toBe(1);
    expect(stats.open_severity_breakdown.high).toBe(1);
  });

  it('counts in_progress assessments only', async () => {
    const d = db();
    const now = new Date().toISOString();

    await d
      .insert(projects)
      .values({ id: 'p1', name: 'P', status: 'active', created_at: now, updated_at: now });
    await d
      .insert(assessments)
      .values({
        id: 'a1',
        project_id: 'p1',
        name: 'A',
        status: 'in_progress',
        created_at: now,
        updated_at: now,
      });
    await d
      .insert(assessments)
      .values({
        id: 'a2',
        project_id: 'p1',
        name: 'B',
        status: 'completed',
        created_at: now,
        updated_at: now,
      });

    const stats = await getActionableStats();
    expect(stats.in_progress_assessments).toBe(1);
  });

  it('counts active vs total projects', async () => {
    const d = db();
    const now = new Date().toISOString();

    await d
      .insert(projects)
      .values({ id: 'p1', name: 'A', status: 'active', created_at: now, updated_at: now });
    await d
      .insert(projects)
      .values({ id: 'p2', name: 'B', status: 'archived', created_at: now, updated_at: now });

    const stats = await getActionableStats();
    expect(stats.active_projects).toBe(1);
    expect(stats.total_projects).toBe(2);
  });
});
