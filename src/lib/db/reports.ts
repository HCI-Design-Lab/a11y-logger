import { getDb } from './index';
import type { CreateReportInput, UpdateReportInput, ReportContent } from '../validators/reports';
import type { Issue, IssueRow } from './issues';
import { deserializeIssue } from './issues';
import { getWcagCriterionName } from '@/lib/wcag-criteria';

export interface Report {
  id: string;
  type: 'executive' | 'detailed' | 'custom';
  title: string;
  status: 'draft' | 'published';
  content: string; // serialized ReportContent
  template_id: string | null;
  ai_generated: number;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  assessment_ids: string[]; // derived from report_assessments
}

export function parseReportContent(content: string): ReportContent {
  try {
    return JSON.parse(content) as ReportContent;
  } catch {
    return {} as ReportContent;
  }
}

export function getReport(id: string): Report | null {
  const row = getDb().prepare('SELECT * FROM reports WHERE id = ?').get(id) as
    | Omit<Report, 'assessment_ids'>
    | undefined;
  if (!row) return null;
  return { ...row, assessment_ids: getAssessmentIds(id) };
}

export function getReports(): Report[] {
  const rows = getDb().prepare('SELECT * FROM reports ORDER BY created_at DESC').all() as Omit<
    Report,
    'assessment_ids'
  >[];
  return rows.map((r) => ({ ...r, assessment_ids: getAssessmentIds(r.id) }));
}

function getAssessmentIds(reportId: string): string[] {
  const rows = getDb()
    .prepare('SELECT assessment_id FROM report_assessments WHERE report_id = ?')
    .all(reportId) as { assessment_id: string }[];
  return rows.map((r) => r.assessment_id);
}

export function createReport(input: CreateReportInput): Report {
  const id = crypto.randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO reports (id, title, type, content, template_id, ai_generated)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, input.title, 'detailed', input.content ? JSON.stringify(input.content) : '{}', null, 0);
  const insert = db.prepare(
    'INSERT INTO report_assessments (report_id, assessment_id) VALUES (?, ?)'
  );
  for (const aId of input.assessment_ids) {
    insert.run(id, aId);
  }
  return getReport(id)!;
}

export function updateReport(id: string, input: UpdateReportInput): Report | null {
  const existing = getReport(id);
  if (!existing) return null;
  if (existing.status === 'published') return null;

  const db = getDb();

  db.transaction(() => {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.title !== undefined) {
      fields.push('title = ?');
      values.push(input.title);
    }
    if (input.content !== undefined) {
      fields.push('content = ?');
      values.push(JSON.stringify(input.content));
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE reports SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    if (input.assessment_ids !== undefined) {
      db.prepare('DELETE FROM report_assessments WHERE report_id = ?').run(id);
      const insert = db.prepare(
        'INSERT INTO report_assessments (report_id, assessment_id) VALUES (?, ?)'
      );
      for (const aId of input.assessment_ids) {
        insert.run(id, aId);
      }
    }
  })();

  return getReport(id);
}

export function deleteReport(id: string): boolean {
  const result = getDb().prepare('DELETE FROM reports WHERE id = ?').run(id);
  return result.changes > 0;
}

export function publishReport(id: string): Report | null {
  const existing = getReport(id);
  if (!existing) return null;
  if (existing.status === 'published') return existing;
  getDb()
    .prepare(
      `UPDATE reports SET status = 'published', published_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
    )
    .run(id);
  return getReport(id);
}

export function unpublishReport(id: string): Report | null {
  const existing = getReport(id);
  if (!existing) return null;
  if (existing.status === 'draft') return existing;
  getDb()
    .prepare(
      `UPDATE reports SET status = 'draft', published_at = NULL, updated_at = datetime('now') WHERE id = ?`
    )
    .run(id);
  return getReport(id);
}

export function getReportIssues(reportId: string): Issue[] {
  const rows = getDb()
    .prepare(
      `SELECT i.* FROM issues i
       JOIN report_assessments ra ON ra.assessment_id = i.assessment_id
       WHERE ra.report_id = ?
       ORDER BY i.created_at DESC`
    )
    .all(reportId) as IssueRow[];
  return rows.map(deserializeIssue);
}

export interface ReportStats {
  total: number;
  severityBreakdown: { critical: number; high: number; medium: number; low: number };
  wcagCriteriaCounts: Array<{ code: string; name: string | null; count: number }>;
}

export function getReportStats(reportId: string): ReportStats {
  const issues = getReportIssues(reportId);
  const severityBreakdown = { critical: 0, high: 0, medium: 0, low: 0 };
  const codeCounts: Record<string, number> = {};

  for (const issue of issues) {
    severityBreakdown[issue.severity]++;
    for (const code of issue.wcag_codes) {
      codeCounts[code] = (codeCounts[code] ?? 0) + 1;
    }
  }

  const wcagCriteriaCounts = Object.entries(codeCounts)
    .map(([code, count]) => ({ code, name: getWcagCriterionName(code) ?? null, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

  return { total: issues.length, severityBreakdown, wcagCriteriaCounts };
}
