import { eq, sql, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { issues, assessments, projects } from './schema';
import type * as sqliteSchema from './schema';
import { jsonArrayContains } from './sql-helpers';
import type { CreateIssueInput, UpdateIssueInput } from '../validators/issues';

// Cast helper: the union type BetterSQLite3Database | PostgresJsDatabase does not
// share callable overloads in TypeScript, so we cast to the SQLite type for query building.
// At runtime the correct driver is used transparently by Drizzle.
function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

export interface Issue {
  id: string;
  assessment_id: string;
  title: string;
  description: string | null;
  url: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'resolved' | 'wont_fix';
  wcag_codes: string[];
  section_508_codes: string[];
  eu_codes: string[];
  ai_suggested_codes: string[];
  ai_confidence_score: number | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | null;
  browser: string | null;
  operating_system: string | null;
  assistive_technology: string | null;
  user_impact: string | null;
  selector: string | null;
  code_snippet: string | null;
  suggested_fix: string | null;
  evidence_media: string[];
  tags: string[];
  created_by: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueWithContext extends Issue {
  project_id: string;
  project_name: string;
  assessment_name: string;
}

// Raw row from SQLite — JSON fields are strings
export interface IssueRow extends Omit<
  Issue,
  'wcag_codes' | 'ai_suggested_codes' | 'evidence_media' | 'tags' | 'section_508_codes' | 'eu_codes'
> {
  wcag_codes: string;
  section_508_codes: string;
  eu_codes: string;
  ai_suggested_codes: string;
  evidence_media: string;
  tags: string;
}

/**
 * Converts a raw SQLite row (with JSON string fields) into a typed Issue record.
 *
 * @param row - Raw database row where array fields are stored as JSON strings.
 * @returns Fully deserialized Issue with parsed array fields.
 */
export function deserializeIssue(row: IssueRow): Issue {
  return {
    ...row,
    wcag_codes: JSON.parse(row.wcag_codes || '[]'),
    section_508_codes: JSON.parse(row.section_508_codes || '[]'),
    eu_codes: JSON.parse(row.eu_codes || '[]'),
    ai_suggested_codes: JSON.parse(row.ai_suggested_codes || '[]'),
    evidence_media: JSON.parse(row.evidence_media || '[]'),
    tags: JSON.parse(row.tags || '[]'),
  };
}

export interface IssueFilters {
  severity?: 'critical' | 'high' | 'medium' | 'low';
  status?: 'open' | 'resolved' | 'wont_fix';
  wcag_code?: string;
  tag?: string;
}

/**
 * Retrieves all issues across every project and assessment, ordered by creation date descending.
 *
 * @returns Array of issues each enriched with project_id, project_name, and assessment_name.
 */
export async function getAllIssues(): Promise<IssueWithContext[]> {
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
    .orderBy(sql`${issues.created_at} DESC`)
    .all() as IssueWithContextRow[];

  return rows.map((row) => ({
    ...deserializeIssue(row),
    project_id: row.project_id,
    project_name: row.project_name,
    assessment_name: row.assessment_name,
  }));
}

/**
 * Retrieves a single issue by its ID.
 *
 * @param id - The UUID of the issue to retrieve.
 * @returns The deserialized issue record, or null if not found.
 */
export async function getIssue(id: string): Promise<Issue | null> {
  const rows = db().select().from(issues).where(eq(issues.id, id)).limit(1).all();
  return rows[0] ? deserializeIssue(rows[0] as IssueRow) : null;
}

/**
 * Retrieves issues for a given assessment, with optional filtering.
 *
 * @param assessmentId - The UUID of the parent assessment.
 * @param filters - Optional filters for severity, status, a WCAG code, or a tag.
 * @returns Array of matching issues ordered by creation date descending.
 */
export async function getIssues(assessmentId: string, filters?: IssueFilters): Promise<Issue[]> {
  const conditions = [eq(issues.assessment_id, assessmentId)];

  if (filters?.severity) conditions.push(eq(issues.severity, filters.severity));
  if (filters?.status) conditions.push(eq(issues.status, filters.status));
  if (filters?.wcag_code) conditions.push(jsonArrayContains('wcag_codes', filters.wcag_code));
  if (filters?.tag) conditions.push(jsonArrayContains('tags', filters.tag));

  const rows = db()
    .select()
    .from(issues)
    .where(and(...conditions))
    .orderBy(sql`${issues.created_at} DESC`)
    .all();

  return rows.map((row) => deserializeIssue(row as IssueRow));
}

/**
 * Creates a new issue within the specified assessment.
 *
 * @param assessmentId - The UUID of the parent assessment.
 * @param input - Validated issue creation payload including title, severity, WCAG codes, and media.
 * @returns The newly created and deserialized issue record.
 */
export async function createIssue(assessmentId: string, input: CreateIssueInput): Promise<Issue> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db()
    .insert(issues)
    .values({
      id,
      assessment_id: assessmentId,
      title: input.title,
      description: input.description ?? null,
      url: input.url ?? null,
      severity: (input.severity ?? 'medium') as 'critical' | 'high' | 'medium' | 'low',
      status: (input.status ?? 'open') as 'open' | 'resolved' | 'wont_fix',
      wcag_codes: JSON.stringify(input.wcag_codes ?? []),
      section_508_codes: JSON.stringify(input.section_508_codes ?? []),
      eu_codes: JSON.stringify(input.eu_codes ?? []),
      ai_suggested_codes: JSON.stringify(input.ai_suggested_codes ?? []),
      ai_confidence_score: input.ai_confidence_score ?? null,
      device_type: (input.device_type ?? null) as 'desktop' | 'mobile' | 'tablet' | null,
      browser: input.browser ?? null,
      operating_system: input.operating_system ?? null,
      assistive_technology: input.assistive_technology ?? null,
      user_impact: input.user_impact ?? null,
      selector: input.selector ?? null,
      code_snippet: input.code_snippet ?? null,
      suggested_fix: input.suggested_fix ?? null,
      evidence_media: JSON.stringify(input.evidence_media ?? []),
      tags: JSON.stringify(input.tags ?? []),
      created_by: input.created_by ?? null,
      created_at: now,
      updated_at: now,
    });
  return (await getIssue(id))!;
}

/**
 * Updates an existing issue with the provided fields.
 * Automatically manages resolved_at and resolved_by when status transitions to/from 'resolved'.
 *
 * @param id - The UUID of the issue to update.
 * @param input - Partial update payload; only provided fields are written.
 * @param resolvedBy - Optional identifier recorded when the issue is first marked resolved.
 * @returns The updated and deserialized issue record, or null if not found.
 */
export async function updateIssue(
  id: string,
  input: UpdateIssueInput,
  resolvedBy?: string | null
): Promise<Issue | null> {
  const existing = await getIssue(id);
  if (!existing) return null;

  type IssueUpdate = Partial<typeof issues.$inferInsert>;
  const values: IssueUpdate = {};

  if (input.title !== undefined) values.title = input.title;
  if (input.description !== undefined) values.description = input.description;
  if (input.url !== undefined) values.url = input.url;
  if (input.severity !== undefined) values.severity = input.severity;
  if (input.status !== undefined) values.status = input.status;
  if (input.wcag_codes !== undefined) values.wcag_codes = JSON.stringify(input.wcag_codes);
  if (input.section_508_codes !== undefined)
    values.section_508_codes = JSON.stringify(input.section_508_codes);
  if (input.eu_codes !== undefined) values.eu_codes = JSON.stringify(input.eu_codes);
  if (input.device_type !== undefined) values.device_type = input.device_type;
  if (input.browser !== undefined) values.browser = input.browser;
  if (input.operating_system !== undefined) values.operating_system = input.operating_system;
  if (input.assistive_technology !== undefined)
    values.assistive_technology = input.assistive_technology;
  if (input.user_impact !== undefined) values.user_impact = input.user_impact;
  if (input.selector !== undefined) values.selector = input.selector;
  if (input.code_snippet !== undefined) values.code_snippet = input.code_snippet;
  if (input.suggested_fix !== undefined) values.suggested_fix = input.suggested_fix;
  if (input.evidence_media !== undefined)
    values.evidence_media = JSON.stringify(input.evidence_media);
  if (input.tags !== undefined) values.tags = JSON.stringify(input.tags);

  // Status transition audit fields
  if (input.status !== undefined) {
    const toResolved = input.status === 'resolved' && existing.status !== 'resolved';
    const fromResolved = input.status !== 'resolved' && existing.status === 'resolved';
    if (toResolved) {
      values.resolved_at = new Date().toISOString();
      values.resolved_by = resolvedBy ?? null;
    } else if (fromResolved) {
      values.resolved_at = null;
      values.resolved_by = null;
    }
    // staying resolved: leave existing resolved_at / resolved_by untouched
  }

  if (Object.keys(values).length === 0) return existing;

  db()
    .update(issues)
    .set({ ...values, updated_at: new Date().toISOString() })
    .where(eq(issues.id, id))
    .run();

  return getIssue(id);
}

/**
 * Permanently deletes an issue.
 *
 * @param id - The UUID of the issue to delete.
 * @returns True if the issue was deleted, false if it was not found.
 */
export async function deleteIssue(id: string): Promise<boolean> {
  const existing = await getIssue(id);
  if (!existing) return false;
  await db().delete(issues).where(eq(issues.id, id));
  return true;
}

/**
 * Marks an issue as resolved and records who resolved it.
 *
 * @param id - The UUID of the issue to resolve.
 * @param resolvedBy - Identifier (e.g. username) of the person resolving the issue.
 * @returns The updated issue record, or null if not found.
 */
export async function resolveIssue(id: string, resolvedBy: string): Promise<Issue | null> {
  return updateIssue(id, { status: 'resolved' }, resolvedBy);
}

/**
 * Retrieves all issues belonging to a project, across all of its assessments.
 *
 * @param projectId - The UUID of the project to filter by.
 * @returns Array of issues ordered by creation date descending.
 */
export async function getIssuesByProject(projectId: string): Promise<Issue[]> {
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
    })
    .from(issues)
    .innerJoin(assessments, eq(assessments.id, issues.assessment_id))
    .where(eq(assessments.project_id, projectId))
    .orderBy(sql`${issues.created_at} DESC`)
    .all();

  return rows.map((row) => deserializeIssue(row as IssueRow));
}

/**
 * Retrieves all issues in a project that reference a specific WCAG criterion code.
 *
 * @param projectId - The UUID of the project to filter by.
 * @param wcagCode - The WCAG success criterion code to match (e.g. '1.4.3').
 * @returns Array of matching issues ordered by creation date descending.
 */
export async function getIssuesByProjectAndWcagCode(
  projectId: string,
  wcagCode: string
): Promise<Issue[]> {
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
    })
    .from(issues)
    .innerJoin(assessments, eq(assessments.id, issues.assessment_id))
    .where(and(eq(assessments.project_id, projectId), jsonArrayContains('wcag_codes', wcagCode)))
    .orderBy(sql`${issues.created_at} DESC`)
    .all();

  return rows.map((row) => deserializeIssue(row as IssueRow));
}
