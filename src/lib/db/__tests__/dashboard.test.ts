// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '@/lib/db/index';
import { getDbClient } from '@/lib/db/client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '@/lib/db/schema';
import { issues, assessments, projects } from '@/lib/db/schema';
import {
  getTimeSeriesData,
  getWcagCriteriaCounts,
  getActionableStats,
  getPourTotals,
  getRepeatOffenders,
  getEnvironmentBreakdown,
  getTagFrequency,
  getSeverityBreakdown,
} from '../dashboard';

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

// ---------------------------------------------------------------------------
// Shared insert helper for new describe blocks
// ---------------------------------------------------------------------------
async function ensureProjectAndAssessment(
  projectId = 'p_shared',
  assessmentId = 'a_shared'
): Promise<{ projectId: string; assessmentId: string }> {
  const d = db();
  const now = new Date().toISOString();
  await d
    .insert(projects)
    .values({ id: projectId, name: 'Shared Project', created_at: now, updated_at: now })
    .onConflictDoNothing();
  await d
    .insert(assessments)
    .values({
      id: assessmentId,
      project_id: projectId,
      name: 'Shared Assessment',
      created_at: now,
      updated_at: now,
    })
    .onConflictDoNothing();
  return { projectId, assessmentId };
}

async function insertIssue(opts: {
  id: string;
  assessmentId?: string;
  projectId?: string;
  wcagCodes?: string[];
  status?: string;
  severity?: string;
  deviceType?: string;
  assistiveTechnology?: string;
  tags?: string[];
}): Promise<void> {
  const d = db();
  const now = new Date().toISOString();
  const { assessmentId } = await ensureProjectAndAssessment(
    opts.projectId ?? 'p_shared',
    opts.assessmentId ?? 'a_shared'
  );
  await d.insert(issues).values({
    id: opts.id,
    assessment_id: assessmentId,
    title: `Issue ${opts.id}`,
    status: opts.status ?? 'open',
    severity: opts.severity ?? 'medium',
    wcag_codes: opts.wcagCodes ? JSON.stringify(opts.wcagCodes) : '[]',
    device_type: opts.deviceType ?? null,
    assistive_technology: opts.assistiveTechnology ?? null,
    tags: opts.tags ? JSON.stringify(opts.tags) : '[]',
    created_at: now,
    updated_at: now,
  });
}

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
    await d.insert(assessments).values({
      id: 'a1',
      project_id: 'p1',
      name: 'A',
      status: 'completed',
      created_at: now,
      updated_at: now,
    });
    await d.insert(issues).values({
      id: 'i1',
      assessment_id: 'a1',
      title: 'T',
      severity: 'critical',
      status: 'open',
      created_at: now,
      updated_at: now,
    });
    await d.insert(issues).values({
      id: 'i2',
      assessment_id: 'a1',
      title: 'T',
      severity: 'critical',
      status: 'resolved',
      created_at: now,
      updated_at: now,
    });
    await d.insert(issues).values({
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
    await d.insert(assessments).values({
      id: 'a1',
      project_id: 'p1',
      name: 'A',
      status: 'in_progress',
      created_at: now,
      updated_at: now,
    });
    await d.insert(assessments).values({
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

  it('counts issue resolved in current month', async () => {
    const d = db();
    const now = new Date().toISOString();

    await d
      .insert(projects)
      .values({ id: 'rm_p1', name: 'P', status: 'active', created_at: now, updated_at: now });
    await d.insert(assessments).values({
      id: 'rm_a1',
      project_id: 'rm_p1',
      name: 'A',
      created_at: now,
      updated_at: now,
    });
    await d.insert(issues).values({
      id: 'rm_i1',
      assessment_id: 'rm_a1',
      title: 'Resolved this month',
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      created_at: now,
      updated_at: now,
    });

    const stats = await getActionableStats();
    expect(stats.resolved_this_month).toBe(1);
  });

  it('excludes issue resolved in a past month', async () => {
    const d = db();
    const now = new Date().toISOString();

    await d
      .insert(projects)
      .values({ id: 'rm_p2', name: 'P', status: 'active', created_at: now, updated_at: now });
    await d.insert(assessments).values({
      id: 'rm_a2',
      project_id: 'rm_p2',
      name: 'A',
      created_at: now,
      updated_at: now,
    });
    await d.insert(issues).values({
      id: 'rm_i2',
      assessment_id: 'rm_a2',
      title: 'Resolved in past month',
      status: 'resolved',
      resolved_at: '2025-01-15T00:00:00.000Z',
      created_at: now,
      updated_at: now,
    });

    const stats = await getActionableStats();
    expect(stats.resolved_this_month).toBe(0);
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

// ---------------------------------------------------------------------------
// getPourTotals
// ---------------------------------------------------------------------------
describe('getPourTotals', () => {
  it('returns zero for all principles when no issues', async () => {
    const result = await getPourTotals();
    expect(result).toEqual({ perceivable: 0, operable: 0, understandable: 0, robust: 0 });
  });

  it('counts open issues by WCAG principle, excludes resolved', async () => {
    await insertIssue({ id: 'pt_i1', wcagCodes: ['1.1.1', '1.4.3'], status: 'open' });
    await insertIssue({ id: 'pt_i2', wcagCodes: ['2.1.1'], status: 'open' });
    await insertIssue({ id: 'pt_i3', wcagCodes: ['1.1.1'], status: 'resolved' });

    const result = await getPourTotals();
    expect(result.perceivable).toBe(2);
    expect(result.operable).toBe(1);
    expect(result.understandable).toBe(0);
    expect(result.robust).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getRepeatOffenders
// ---------------------------------------------------------------------------
describe('getRepeatOffenders', () => {
  it('returns empty array when no open issues with wcag codes', async () => {
    const result = await getRepeatOffenders();
    expect(result).toEqual([]);
  });

  it('ranks criteria by distinct project count', async () => {
    const now = new Date().toISOString();
    const d = db();
    // Two projects, two assessments
    await d
      .insert(projects)
      .values({ id: 'ro_p1', name: 'RO Project 1', created_at: now, updated_at: now });
    await d
      .insert(projects)
      .values({ id: 'ro_p2', name: 'RO Project 2', created_at: now, updated_at: now });
    await d
      .insert(assessments)
      .values({ id: 'ro_a1', project_id: 'ro_p1', name: 'A', created_at: now, updated_at: now });
    await d
      .insert(assessments)
      .values({ id: 'ro_a2', project_id: 'ro_p2', name: 'B', created_at: now, updated_at: now });

    await insertIssue({
      id: 'ro_i1',
      assessmentId: 'ro_a1',
      projectId: 'ro_p1',
      wcagCodes: ['1.1.1'],
      status: 'open',
    });
    await insertIssue({
      id: 'ro_i2',
      assessmentId: 'ro_a2',
      projectId: 'ro_p2',
      wcagCodes: ['1.1.1'],
      status: 'open',
    });
    await insertIssue({
      id: 'ro_i3',
      assessmentId: 'ro_a1',
      projectId: 'ro_p1',
      wcagCodes: ['2.1.1'],
      status: 'open',
    });

    const result = await getRepeatOffenders();
    expect(result[0]!.code).toBe('1.1.1');
    expect(result[0]!.project_count).toBe(2);
    expect(result[0]!.issue_count).toBe(2);
    expect(result[1]!.code).toBe('2.1.1');
    expect(result[1]!.project_count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getEnvironmentBreakdown
// ---------------------------------------------------------------------------
describe('getEnvironmentBreakdown', () => {
  it('returns empty array when issues have null device/AT', async () => {
    await insertIssue({ id: 'env_i1', status: 'open' });
    const result = await getEnvironmentBreakdown();
    expect(result).toEqual([]);
  });

  it('groups by device_type and assistive_technology', async () => {
    await insertIssue({
      id: 'env_i2',
      status: 'open',
      deviceType: 'desktop',
      assistiveTechnology: 'NVDA',
    });
    await insertIssue({
      id: 'env_i3',
      status: 'open',
      deviceType: 'desktop',
      assistiveTechnology: 'NVDA',
    });
    await insertIssue({
      id: 'env_i4',
      status: 'open',
      deviceType: 'mobile',
      assistiveTechnology: 'VoiceOver',
    });

    const result = await getEnvironmentBreakdown();
    expect(result.length).toBe(2);
    const desktopEntry = result.find(
      (r) => r.device_type === 'desktop' && r.assistive_technology === 'NVDA'
    );
    expect(desktopEntry).toBeDefined();
    expect(desktopEntry!.count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getPourTotals with statuses filter
// ---------------------------------------------------------------------------
describe('getPourTotals with statuses filter', () => {
  beforeEach(async () => {
    await db().delete(issues);
    await db().delete(assessments);
    await db().delete(projects);
  });

  it('filters by resolved status', async () => {
    await insertIssue({ id: 'i1', status: 'open', wcagCodes: ['1.1.1'] });
    await insertIssue({ id: 'i2', status: 'resolved', wcagCodes: ['1.1.1'] });

    const openResult = await getPourTotals(['open']);
    expect(openResult.perceivable).toBe(1);

    const resolvedResult = await getPourTotals(['resolved']);
    expect(resolvedResult.perceivable).toBe(1);

    const bothResult = await getPourTotals(['open', 'resolved']);
    expect(bothResult.perceivable).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getWcagCriteriaCounts with statuses filter
// ---------------------------------------------------------------------------
describe('getWcagCriteriaCounts with statuses filter', () => {
  beforeEach(async () => {
    await db().delete(issues);
    await db().delete(assessments);
    await db().delete(projects);
  });

  it('filters by statuses', async () => {
    await insertIssue({ id: 'i1', status: 'open', wcagCodes: ['1.1.1'] });
    await insertIssue({ id: 'i2', status: 'resolved', wcagCodes: ['1.1.1'] });
    await insertIssue({ id: 'i3', status: 'wont_fix', wcagCodes: ['1.1.1'] });

    const openOnly = await getWcagCriteriaCounts('perceivable', ['open']);
    expect(openOnly[0]?.count).toBe(1);

    const all = await getWcagCriteriaCounts('perceivable', ['open', 'resolved', 'wont_fix']);
    expect(all[0]?.count).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getSeverityBreakdown
// ---------------------------------------------------------------------------
describe('getSeverityBreakdown', () => {
  beforeEach(async () => {
    await db().delete(issues);
    await db().delete(assessments);
    await db().delete(projects);
  });

  it('returns zeros for empty db', async () => {
    const result = await getSeverityBreakdown(['open']);
    expect(result.total).toBe(0);
    expect(result.breakdown).toEqual({ critical: 0, high: 0, medium: 0, low: 0 });
  });

  it('counts by severity for given statuses', async () => {
    await insertIssue({ id: 'i1', status: 'open', severity: 'critical' });
    await insertIssue({ id: 'i2', status: 'resolved', severity: 'high' });
    await insertIssue({ id: 'i3', status: 'open', severity: 'high' });

    const openOnly = await getSeverityBreakdown(['open']);
    expect(openOnly.total).toBe(2);
    expect(openOnly.breakdown.critical).toBe(1);
    expect(openOnly.breakdown.high).toBe(1);

    const both = await getSeverityBreakdown(['open', 'resolved']);
    expect(both.total).toBe(3);
    expect(both.breakdown.high).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getTagFrequency
// ---------------------------------------------------------------------------
describe('getTagFrequency', () => {
  it('returns empty array when no tags', async () => {
    await insertIssue({ id: 'tag_i1', status: 'open' });
    const result = await getTagFrequency();
    expect(result).toEqual([]);
  });

  it('aggregates tag counts across open issues, sorts by count desc', async () => {
    await insertIssue({ id: 'tag_i2', status: 'open', tags: ['keyboard', 'forms'] });
    await insertIssue({ id: 'tag_i3', status: 'open', tags: ['keyboard'] });
    await insertIssue({ id: 'tag_i4', status: 'open', tags: ['forms'] });

    const result = await getTagFrequency();
    expect(result.length).toBe(2);
    // Both keyboard and forms have count 2; order by count desc, tie-breaking order doesn't matter
    const keyboardEntry = result.find((r) => r.tag === 'keyboard');
    const formsEntry = result.find((r) => r.tag === 'forms');
    expect(keyboardEntry).toBeDefined();
    expect(formsEntry).toBeDefined();
    expect(keyboardEntry!.count).toBe(2);
    expect(formsEntry!.count).toBe(2);
    // Verify sorted desc: all counts should be >= the next
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i]!.count).toBeGreaterThanOrEqual(result[i + 1]!.count);
    }
  });
});
