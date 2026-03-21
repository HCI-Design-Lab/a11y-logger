// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDbClient } from '../client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '../schema';
import * as schema from '../schema';
import { createProject } from '../projects';
import { createAssessment } from '../assessments';
import { createIssue } from '../issues';
import {
  createReport,
  getReport,
  getReports,
  updateReport,
  deleteReport,
  publishReport,
  unpublishReport,
  getReportIssues,
  getReportStats,
} from '../reports';

function dbc() {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

let assessmentId: string;
let assessmentId2: string;

beforeAll(async () => {
  await initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  await dbc().delete(schema.reportAssessments);
  await dbc().delete(schema.reports);
  await dbc().delete(schema.issues);
  await dbc().delete(schema.assessments);
  await dbc().delete(schema.projects);
  const project = await createProject({ name: 'Test Project' });
  const a1 = await createAssessment(project.id, { name: 'Assessment 1' });
  const a2 = await createAssessment(project.id, { name: 'Assessment 2' });
  assessmentId = a1.id;
  assessmentId2 = a2.id;
});

describe('createReport', () => {
  it('creates a report and links assessments', async () => {
    const report = await createReport({ title: 'Q1 Report', assessment_ids: [assessmentId] });
    expect(report.id).toBeDefined();
    expect(report.title).toBe('Q1 Report');
    expect(report.status).toBe('draft');
    expect(report.assessment_ids).toEqual([assessmentId]);
  });

  it('links multiple assessments', async () => {
    const report = await createReport({
      title: 'Multi',
      assessment_ids: [assessmentId, assessmentId2],
    });
    expect(report.assessment_ids).toHaveLength(2);
    expect(report.assessment_ids).toContain(assessmentId);
    expect(report.assessment_ids).toContain(assessmentId2);
  });

  it('generates a unique id for each report', async () => {
    const r1 = await createReport({ title: 'A', assessment_ids: [assessmentId] });
    const r2 = await createReport({ title: 'B', assessment_ids: [assessmentId] });
    expect(r1.id).not.toBe(r2.id);
  });

  it('stores typed content as JSON', async () => {
    const content = { executive_summary: { body: 'Hello' } };
    const report = await createReport({ title: 'R', assessment_ids: [assessmentId], content });
    const parsed = JSON.parse(report.content);
    expect(parsed).toEqual(content);
  });
});

describe('getReport', () => {
  it('returns null for unknown id', async () => {
    expect(await getReport('nope')).toBeNull();
  });

  it('includes assessment_ids', async () => {
    const created = await createReport({
      title: 'R',
      assessment_ids: [assessmentId, assessmentId2],
    });
    const fetched = await getReport(created.id);
    expect(fetched?.assessment_ids).toHaveLength(2);
  });
});

describe('getReports', () => {
  it('returns all reports', async () => {
    await createReport({ title: 'A', assessment_ids: [assessmentId] });
    await createReport({ title: 'B', assessment_ids: [assessmentId] });
    expect(await getReports()).toHaveLength(2);
  });
});

describe('updateReport', () => {
  it('updates title and content', async () => {
    const report = await createReport({ title: 'Old', assessment_ids: [assessmentId] });
    const updated = await updateReport(report.id, {
      title: 'New',
      content: { top_risks: { items: ['Risk A'] } },
    });
    expect(updated?.title).toBe('New');
    expect(JSON.parse(updated!.content)).toEqual({ top_risks: { items: ['Risk A'] } });
  });

  it('updates assessment_ids', async () => {
    const report = await createReport({ title: 'R', assessment_ids: [assessmentId] });
    const updated = await updateReport(report.id, { assessment_ids: [assessmentId2] });
    expect(updated?.assessment_ids).toEqual([assessmentId2]);
  });

  it('returns null for unknown id', async () => {
    expect(await updateReport('nope', { title: 'X' })).toBeNull();
  });

  it('returns null for published report', async () => {
    const report = await createReport({ title: 'R', assessment_ids: [assessmentId] });
    await publishReport(report.id);
    expect(await updateReport(report.id, { title: 'X' })).toBeNull();
  });
});

describe('deleteReport', () => {
  it('deletes report and cascade removes report_assessments', async () => {
    const report = await createReport({ title: 'R', assessment_ids: [assessmentId] });
    expect(await deleteReport(report.id)).toBe(true);
    expect(await getReport(report.id)).toBeNull();
    const rows = await dbc()
      .select()
      .from(schema.reportAssessments)
      .where((await import('drizzle-orm')).eq(schema.reportAssessments.report_id, report.id));
    expect(rows).toHaveLength(0);
  });

  it('returns false for unknown id', async () => {
    expect(await deleteReport('nope')).toBe(false);
  });
});

describe('publishReport / unpublishReport', () => {
  it('publishes a draft report', async () => {
    const report = await createReport({ title: 'R', assessment_ids: [assessmentId] });
    const published = await publishReport(report.id);
    expect(published?.status).toBe('published');
    expect(published?.published_at).toBeDefined();
  });

  it('unpublishes a published report', async () => {
    const report = await createReport({ title: 'R', assessment_ids: [assessmentId] });
    await publishReport(report.id);
    const draft = await unpublishReport(report.id);
    expect(draft?.status).toBe('draft');
  });
});

describe('getReportIssues', () => {
  it('returns issues from linked assessments', async () => {
    const report = await createReport({ title: 'R', assessment_ids: [assessmentId] });
    await createIssue(assessmentId, { title: 'Issue 1', severity: 'high' });
    const issues = await getReportIssues(report.id);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.title).toBe('Issue 1');
  });

  it('returns issues from all linked assessments', async () => {
    const report = await createReport({
      title: 'R',
      assessment_ids: [assessmentId, assessmentId2],
    });
    await createIssue(assessmentId, { title: 'Issue A', severity: 'high' });
    await createIssue(assessmentId2, { title: 'Issue B', severity: 'low' });
    const issues = await getReportIssues(report.id);
    expect(issues).toHaveLength(2);
  });

  it('returns empty array for report with no issues', async () => {
    const report = await createReport({ title: 'R', assessment_ids: [assessmentId] });
    expect(await getReportIssues(report.id)).toEqual([]);
  });
});

describe('getReportStats', () => {
  it('returns zero counts when report has no issues', async () => {
    const report = await createReport({ title: 'Empty', assessment_ids: [assessmentId] });
    const stats = await getReportStats(report.id);
    expect(stats.total).toBe(0);
    expect(stats.severityBreakdown).toEqual({ critical: 0, high: 0, medium: 0, low: 0 });
    expect(stats.wcagCriteriaCounts).toEqual([]);
  });

  it('counts severity breakdown correctly', async () => {
    const report = await createReport({ title: 'R', assessment_ids: [assessmentId] });
    await createIssue(assessmentId, { title: 'A', severity: 'critical', wcag_codes: ['1.3.1'] });
    await createIssue(assessmentId, { title: 'B', severity: 'high', wcag_codes: ['1.3.1'] });
    await createIssue(assessmentId, { title: 'C', severity: 'high', wcag_codes: ['2.4.3'] });
    const stats = await getReportStats(report.id);
    expect(stats.total).toBe(3);
    expect(stats.severityBreakdown).toEqual({ critical: 1, high: 2, medium: 0, low: 0 });
  });

  it('counts WCAG criteria sorted by count descending', async () => {
    const report = await createReport({ title: 'R', assessment_ids: [assessmentId] });
    await createIssue(assessmentId, { title: 'A', severity: 'high', wcag_codes: ['1.3.1'] });
    await createIssue(assessmentId, { title: 'B', severity: 'high', wcag_codes: ['1.3.1'] });
    await createIssue(assessmentId, { title: 'C', severity: 'high', wcag_codes: ['2.4.3'] });
    const stats = await getReportStats(report.id);
    expect(stats.wcagCriteriaCounts[0]!.code).toBe('1.3.1');
    expect(stats.wcagCriteriaCounts[0]!.count).toBe(2);
    expect(stats.wcagCriteriaCounts[1]!.code).toBe('2.4.3');
    expect(stats.wcagCriteriaCounts[1]!.count).toBe(1);
  });

  it('includes WCAG criterion name when known', async () => {
    const report = await createReport({ title: 'R', assessment_ids: [assessmentId] });
    await createIssue(assessmentId, { title: 'A', severity: 'high', wcag_codes: ['1.3.1'] });
    const stats = await getReportStats(report.id);
    expect(stats.wcagCriteriaCounts[0]!.name).toBe('Info and Relationships');
  });
});
