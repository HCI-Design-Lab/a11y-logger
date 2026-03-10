// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
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

let assessmentId: string;
let assessmentId2: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM report_assessments').run();
  getDb().prepare('DELETE FROM reports').run();
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test Project' });
  const a1 = createAssessment(project.id, { name: 'Assessment 1' });
  const a2 = createAssessment(project.id, { name: 'Assessment 2' });
  assessmentId = a1.id;
  assessmentId2 = a2.id;
});

describe('createReport', () => {
  it('creates a report and links assessments', () => {
    const report = createReport({ title: 'Q1 Report', assessment_ids: [assessmentId] });
    expect(report.id).toBeDefined();
    expect(report.title).toBe('Q1 Report');
    expect(report.status).toBe('draft');
    expect(report.assessment_ids).toEqual([assessmentId]);
  });

  it('links multiple assessments', () => {
    const report = createReport({
      title: 'Multi',
      assessment_ids: [assessmentId, assessmentId2],
    });
    expect(report.assessment_ids).toHaveLength(2);
    expect(report.assessment_ids).toContain(assessmentId);
    expect(report.assessment_ids).toContain(assessmentId2);
  });

  it('generates a unique id for each report', () => {
    const r1 = createReport({ title: 'A', assessment_ids: [assessmentId] });
    const r2 = createReport({ title: 'B', assessment_ids: [assessmentId] });
    expect(r1.id).not.toBe(r2.id);
  });

  it('stores typed content as JSON', () => {
    const content = { executive_summary: { body: 'Hello' } };
    const report = createReport({ title: 'R', assessment_ids: [assessmentId], content });
    const parsed = JSON.parse(report.content);
    expect(parsed).toEqual(content);
  });
});

describe('getReport', () => {
  it('returns null for unknown id', () => {
    expect(getReport('nope')).toBeNull();
  });

  it('includes assessment_ids', () => {
    const created = createReport({ title: 'R', assessment_ids: [assessmentId, assessmentId2] });
    const fetched = getReport(created.id);
    expect(fetched?.assessment_ids).toHaveLength(2);
  });
});

describe('getReports', () => {
  it('returns all reports', () => {
    createReport({ title: 'A', assessment_ids: [assessmentId] });
    createReport({ title: 'B', assessment_ids: [assessmentId] });
    expect(getReports()).toHaveLength(2);
  });
});

describe('updateReport', () => {
  it('updates title and content', () => {
    const report = createReport({ title: 'Old', assessment_ids: [assessmentId] });
    const updated = updateReport(report.id, {
      title: 'New',
      content: { top_risks: { items: ['Risk A'] } },
    });
    expect(updated?.title).toBe('New');
    expect(JSON.parse(updated!.content)).toEqual({ top_risks: { items: ['Risk A'] } });
  });

  it('updates assessment_ids', () => {
    const report = createReport({ title: 'R', assessment_ids: [assessmentId] });
    const updated = updateReport(report.id, { assessment_ids: [assessmentId2] });
    expect(updated?.assessment_ids).toEqual([assessmentId2]);
  });

  it('returns null for unknown id', () => {
    expect(updateReport('nope', { title: 'X' })).toBeNull();
  });

  it('returns null for published report', () => {
    const report = createReport({ title: 'R', assessment_ids: [assessmentId] });
    publishReport(report.id);
    expect(updateReport(report.id, { title: 'X' })).toBeNull();
  });
});

describe('deleteReport', () => {
  it('deletes report and cascade removes report_assessments', () => {
    const report = createReport({ title: 'R', assessment_ids: [assessmentId] });
    expect(deleteReport(report.id)).toBe(true);
    expect(getReport(report.id)).toBeNull();
    const rows = getDb()
      .prepare('SELECT * FROM report_assessments WHERE report_id = ?')
      .all(report.id);
    expect(rows).toHaveLength(0);
  });

  it('returns false for unknown id', () => {
    expect(deleteReport('nope')).toBe(false);
  });
});

describe('publishReport / unpublishReport', () => {
  it('publishes a draft report', () => {
    const report = createReport({ title: 'R', assessment_ids: [assessmentId] });
    const published = publishReport(report.id);
    expect(published?.status).toBe('published');
    expect(published?.published_at).toBeDefined();
  });

  it('unpublishes a published report', () => {
    const report = createReport({ title: 'R', assessment_ids: [assessmentId] });
    publishReport(report.id);
    const draft = unpublishReport(report.id);
    expect(draft?.status).toBe('draft');
  });
});

describe('getReportIssues', () => {
  it('returns issues from linked assessments', () => {
    const report = createReport({ title: 'R', assessment_ids: [assessmentId] });
    // Insert an issue directly
    getDb()
      .prepare(
        `INSERT INTO issues (id, assessment_id, title, severity) VALUES ('i1', ?, 'Issue 1', 'high')`
      )
      .run(assessmentId);
    const issues = getReportIssues(report.id);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.title).toBe('Issue 1');
  });

  it('returns issues from all linked assessments', () => {
    const report = createReport({
      title: 'R',
      assessment_ids: [assessmentId, assessmentId2],
    });
    getDb()
      .prepare(
        `INSERT INTO issues (id, assessment_id, title, severity) VALUES ('i1', ?, 'Issue A', 'high')`
      )
      .run(assessmentId);
    getDb()
      .prepare(
        `INSERT INTO issues (id, assessment_id, title, severity) VALUES ('i2', ?, 'Issue B', 'low')`
      )
      .run(assessmentId2);
    const issues = getReportIssues(report.id);
    expect(issues).toHaveLength(2);
  });

  it('returns empty array for report with no issues', () => {
    const report = createReport({ title: 'R', assessment_ids: [assessmentId] });
    expect(getReportIssues(report.id)).toEqual([]);
  });
});

describe('getReportStats', () => {
  it('returns zero counts when report has no issues', () => {
    const report = createReport({ title: 'Empty', assessment_ids: [assessmentId] });
    const stats = getReportStats(report.id);
    expect(stats.total).toBe(0);
    expect(stats.severityBreakdown).toEqual({ critical: 0, high: 0, medium: 0, low: 0 });
    expect(stats.wcagCriteriaCounts).toEqual([]);
  });

  it('counts severity breakdown correctly', () => {
    const report = createReport({ title: 'R', assessment_ids: [assessmentId] });
    createIssue(assessmentId, { title: 'A', severity: 'critical', wcag_codes: ['1.3.1'] });
    createIssue(assessmentId, { title: 'B', severity: 'high', wcag_codes: ['1.3.1'] });
    createIssue(assessmentId, { title: 'C', severity: 'high', wcag_codes: ['2.4.3'] });
    const stats = getReportStats(report.id);
    expect(stats.total).toBe(3);
    expect(stats.severityBreakdown).toEqual({ critical: 1, high: 2, medium: 0, low: 0 });
  });

  it('counts WCAG criteria sorted by count descending', () => {
    const report = createReport({ title: 'R', assessment_ids: [assessmentId] });
    createIssue(assessmentId, { title: 'A', severity: 'high', wcag_codes: ['1.3.1'] });
    createIssue(assessmentId, { title: 'B', severity: 'high', wcag_codes: ['1.3.1'] });
    createIssue(assessmentId, { title: 'C', severity: 'high', wcag_codes: ['2.4.3'] });
    const stats = getReportStats(report.id);
    expect(stats.wcagCriteriaCounts[0]!.code).toBe('1.3.1');
    expect(stats.wcagCriteriaCounts[0]!.count).toBe(2);
    expect(stats.wcagCriteriaCounts[1]!.code).toBe('2.4.3');
    expect(stats.wcagCriteriaCounts[1]!.count).toBe(1);
  });

  it('includes WCAG criterion name when known', () => {
    const report = createReport({ title: 'R', assessment_ids: [assessmentId] });
    createIssue(assessmentId, { title: 'A', severity: 'high', wcag_codes: ['1.3.1'] });
    const stats = getReportStats(report.id);
    expect(stats.wcagCriteriaCounts[0]!.name).toBe('Info and Relationships');
  });
});
