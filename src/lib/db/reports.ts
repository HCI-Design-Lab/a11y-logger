import { eq, inArray, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { reports, reportAssessments, assessments, issues, projects } from './schema';
import type * as sqliteSchema from './schema';
import type { CreateReportInput, UpdateReportInput, ReportContent } from '../validators/reports';
import type { IssueWithContext } from './issues';
import { deserializeIssue } from './issues';
import type { IssueRow } from './issues';
import { getWcagCriterionName } from '@/lib/wcag-criteria';

// Cast helper: the union type BetterSQLite3Database | PostgresJsDatabase does not
// share callable overloads in TypeScript, so we cast to the SQLite type for query building.
// At runtime the correct driver is used transparently by Drizzle.
function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

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

function getAssessmentIds(reportId: string): string[] {
  const rows = db()
    .select({ assessment_id: reportAssessments.assessment_id })
    .from(reportAssessments)
    .where(eq(reportAssessments.report_id, reportId))
    .all();
  return rows.map((r) => r.assessment_id);
}

type ReportRow = Omit<Report, 'assessment_ids' | 'content'> & { content: string | null };

function rowToReport(row: ReportRow): Report {
  return {
    ...row,
    content: row.content ?? '{}',
    assessment_ids: getAssessmentIds(row.id),
  };
}

export async function getReport(id: string): Promise<Report | null> {
  const rows = db().select().from(reports).where(eq(reports.id, id)).limit(1).all();
  if (!rows[0]) return null;
  return rowToReport(rows[0] as ReportRow);
}

export async function getReports(): Promise<Report[]> {
  const rows = db()
    .select()
    .from(reports)
    .orderBy(sql`${reports.created_at} DESC`)
    .all();
  return (rows as ReportRow[]).map(rowToReport);
}

export async function createReport(input: CreateReportInput): Promise<Report> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db()
    .insert(reports)
    .values({
      id,
      title: input.title,
      type: 'detailed',
      content: input.content ? JSON.stringify(input.content) : '{}',
      template_id: null,
      ai_generated: 0,
      created_at: now,
      updated_at: now,
    })
    .run();
  if (input.assessment_ids.length > 0) {
    db()
      .insert(reportAssessments)
      .values(input.assessment_ids.map((aid) => ({ report_id: id, assessment_id: aid })))
      .run();
  }
  return (await getReport(id))!;
}

export async function updateReport(id: string, input: UpdateReportInput): Promise<Report | null> {
  const existing = await getReport(id);
  if (!existing) return null;
  if (existing.status === 'published') return null;

  type ReportUpdate = Partial<
    Pick<typeof reports.$inferInsert, 'title' | 'content' | 'updated_at'>
  >;
  const values: ReportUpdate = {};
  if (input.title !== undefined) values.title = input.title;
  if (input.content !== undefined) values.content = JSON.stringify(input.content);

  if (Object.keys(values).length > 0) {
    db()
      .update(reports)
      .set({ ...values, updated_at: new Date().toISOString() })
      .where(eq(reports.id, id))
      .run();
  }

  if (input.assessment_ids !== undefined) {
    db().delete(reportAssessments).where(eq(reportAssessments.report_id, id)).run();
    if (input.assessment_ids.length > 0) {
      db()
        .insert(reportAssessments)
        .values(input.assessment_ids.map((aid) => ({ report_id: id, assessment_id: aid })))
        .run();
    }
  }

  return getReport(id);
}

export async function deleteReport(id: string): Promise<boolean> {
  const existing = await getReport(id);
  if (!existing) return false;
  db().delete(reports).where(eq(reports.id, id)).run();
  return true;
}

export async function publishReport(id: string): Promise<Report | null> {
  const existing = await getReport(id);
  if (!existing) return null;
  if (existing.status === 'published') return existing;
  db()
    .update(reports)
    .set({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .where(eq(reports.id, id))
    .run();
  return getReport(id);
}

export async function unpublishReport(id: string): Promise<Report | null> {
  const existing = await getReport(id);
  if (!existing) return null;
  if (existing.status === 'draft') return existing;
  db()
    .update(reports)
    .set({
      status: 'draft',
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .where(eq(reports.id, id))
    .run();
  return getReport(id);
}

export async function getReportIssues(reportId: string): Promise<IssueWithContext[]> {
  // Get the assessment IDs linked to this report
  const assessmentIds = getAssessmentIds(reportId);
  if (assessmentIds.length === 0) return [];

  type IssueWithContextRow = IssueRow & {
    project_id: string;
    project_name: string;
    assessment_name: string;
  };

  const rows = db()
    .select({
      id: issues.id,
      assessment_id: issues.assessment_id,
      title: issues.title,
      description: issues.description,
      url: issues.url,
      severity: issues.severity,
      status: issues.status,
      wcag_codes: issues.wcag_codes,
      section_508_codes: issues.section_508_codes,
      eu_codes: issues.eu_codes,
      ai_suggested_codes: issues.ai_suggested_codes,
      ai_confidence_score: issues.ai_confidence_score,
      device_type: issues.device_type,
      browser: issues.browser,
      operating_system: issues.operating_system,
      assistive_technology: issues.assistive_technology,
      user_impact: issues.user_impact,
      selector: issues.selector,
      code_snippet: issues.code_snippet,
      suggested_fix: issues.suggested_fix,
      evidence_media: issues.evidence_media,
      tags: issues.tags,
      created_by: issues.created_by,
      resolved_by: issues.resolved_by,
      resolved_at: issues.resolved_at,
      created_at: issues.created_at,
      updated_at: issues.updated_at,
      project_id: projects.id,
      project_name: projects.name,
      assessment_name: assessments.name,
    })
    .from(issues)
    .innerJoin(assessments, eq(assessments.id, issues.assessment_id))
    .innerJoin(projects, eq(projects.id, assessments.project_id))
    .where(inArray(issues.assessment_id, assessmentIds))
    .orderBy(sql`${issues.created_at} DESC`)
    .all() as IssueWithContextRow[];

  return rows.map((row) => ({
    ...deserializeIssue(row),
    project_id: row.project_id,
    project_name: row.project_name,
    assessment_name: row.assessment_name,
  }));
}

export interface ReportStats {
  total: number;
  severityBreakdown: { critical: number; high: number; medium: number; low: number };
  wcagCriteriaCounts: Array<{ code: string; name: string | null; count: number }>;
}

export async function getReportStats(reportId: string): Promise<ReportStats> {
  const issueList = await getReportIssues(reportId);
  const severityBreakdown = { critical: 0, high: 0, medium: 0, low: 0 };
  const codeCounts: Record<string, number> = {};

  for (const issue of issueList) {
    severityBreakdown[issue.severity]++;
    for (const code of issue.wcag_codes) {
      codeCounts[code] = (codeCounts[code] ?? 0) + 1;
    }
  }

  const wcagCriteriaCounts = Object.entries(codeCounts)
    .map(([code, count]) => ({ code, name: getWcagCriterionName(code) ?? null, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

  return { total: issueList.length, severityBreakdown, wcagCriteriaCounts };
}
