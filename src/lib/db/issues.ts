import { getDb } from './index';
import type { CreateIssueInput, UpdateIssueInput } from '../validators/issues';

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

export function getAllIssues(): IssueWithContext[] {
  type IssueWithContextRow = Omit<
    IssueWithContext,
    'wcag_codes' | 'ai_suggested_codes' | 'evidence_media' | 'tags'
  > & {
    wcag_codes: string;
    ai_suggested_codes: string;
    evidence_media: string;
    tags: string;
  };
  const rows = getDb()
    .prepare(
      `SELECT i.*, p.id AS project_id, p.name AS project_name, a.name AS assessment_name
       FROM issues i
       JOIN assessments a ON a.id = i.assessment_id
       JOIN projects p ON p.id = a.project_id
       ORDER BY i.created_at DESC`
    )
    .all() as IssueWithContextRow[];
  return rows.map((row) => ({
    ...deserializeIssue(row),
    project_id: row.project_id,
    project_name: row.project_name,
    assessment_name: row.assessment_name,
  }));
}

export function getIssue(id: string): Issue | null {
  const row = getDb().prepare('SELECT * FROM issues WHERE id = ?').get(id) as IssueRow | undefined;
  return row ? deserializeIssue(row) : null;
}

export function getIssues(assessmentId: string, filters?: IssueFilters): Issue[] {
  const conditions: string[] = ['assessment_id = ?'];
  const values: unknown[] = [assessmentId];

  if (filters?.severity) {
    conditions.push('severity = ?');
    values.push(filters.severity);
  }
  if (filters?.status) {
    conditions.push('status = ?');
    values.push(filters.status);
  }
  if (filters?.wcag_code) {
    conditions.push(`EXISTS (SELECT 1 FROM json_each(wcag_codes) WHERE value = ?)`);
    values.push(filters.wcag_code);
  }
  if (filters?.tag) {
    conditions.push(`EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)`);
    values.push(filters.tag);
  }

  const sql = `SELECT * FROM issues WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
  const rows = getDb()
    .prepare(sql)
    .all(...values) as IssueRow[];
  return rows.map(deserializeIssue);
}

export function createIssue(assessmentId: string, input: CreateIssueInput): Issue {
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      `INSERT INTO issues (
        id, assessment_id, title, description, url, severity, status,
        wcag_codes, section_508_codes, eu_codes, device_type, browser, operating_system, assistive_technology,
        user_impact, selector, code_snippet, suggested_fix,
        evidence_media, tags, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      assessmentId,
      input.title,
      input.description ?? null,
      input.url ?? null,
      input.severity ?? 'medium',
      input.status ?? 'open',
      JSON.stringify(input.wcag_codes ?? []),
      JSON.stringify(input.section_508_codes ?? []),
      JSON.stringify(input.eu_codes ?? []),
      input.device_type ?? null,
      input.browser ?? null,
      input.operating_system ?? null,
      input.assistive_technology ?? null,
      input.user_impact ?? null,
      input.selector ?? null,
      input.code_snippet ?? null,
      input.suggested_fix ?? null,
      JSON.stringify(input.evidence_media ?? []),
      JSON.stringify(input.tags ?? []),
      input.created_by ?? null
    );
  return getIssue(id)!;
}

export function updateIssue(id: string, input: UpdateIssueInput): Issue | null {
  const existing = getIssue(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.title !== undefined) {
    fields.push('title = ?');
    values.push(input.title);
  }
  if (input.description !== undefined) {
    fields.push('description = ?');
    values.push(input.description);
  }
  if (input.url !== undefined) {
    fields.push('url = ?');
    values.push(input.url);
  }
  if (input.severity !== undefined) {
    fields.push('severity = ?');
    values.push(input.severity);
  }
  if (input.status !== undefined) {
    fields.push('status = ?');
    values.push(input.status);
  }
  if (input.wcag_codes !== undefined) {
    fields.push('wcag_codes = ?');
    values.push(JSON.stringify(input.wcag_codes));
  }
  if (input.section_508_codes !== undefined) {
    fields.push('section_508_codes = ?');
    values.push(JSON.stringify(input.section_508_codes));
  }
  if (input.eu_codes !== undefined) {
    fields.push('eu_codes = ?');
    values.push(JSON.stringify(input.eu_codes));
  }
  if (input.device_type !== undefined) {
    fields.push('device_type = ?');
    values.push(input.device_type);
  }
  if (input.browser !== undefined) {
    fields.push('browser = ?');
    values.push(input.browser);
  }
  if (input.operating_system !== undefined) {
    fields.push('operating_system = ?');
    values.push(input.operating_system);
  }
  if (input.assistive_technology !== undefined) {
    fields.push('assistive_technology = ?');
    values.push(input.assistive_technology);
  }
  if (input.user_impact !== undefined) {
    fields.push('user_impact = ?');
    values.push(input.user_impact);
  }
  if (input.selector !== undefined) {
    fields.push('selector = ?');
    values.push(input.selector);
  }
  if (input.code_snippet !== undefined) {
    fields.push('code_snippet = ?');
    values.push(input.code_snippet);
  }
  if (input.suggested_fix !== undefined) {
    fields.push('suggested_fix = ?');
    values.push(input.suggested_fix);
  }
  if (input.evidence_media !== undefined) {
    fields.push('evidence_media = ?');
    values.push(JSON.stringify(input.evidence_media));
  }
  if (input.tags !== undefined) {
    fields.push('tags = ?');
    values.push(JSON.stringify(input.tags));
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  getDb()
    .prepare(`UPDATE issues SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);

  return getIssue(id);
}

export function deleteIssue(id: string): boolean {
  const result = getDb().prepare('DELETE FROM issues WHERE id = ?').run(id);
  return result.changes > 0;
}

export function resolveIssue(id: string, resolvedBy: string): Issue | null {
  const existing = getIssue(id);
  if (!existing) return null;

  getDb()
    .prepare(
      `UPDATE issues SET status = 'resolved', resolved_by = ?, resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
    )
    .run(resolvedBy, id);

  return getIssue(id);
}

export function getIssuesByProject(projectId: string): Issue[] {
  const rows = getDb()
    .prepare(
      `SELECT i.* FROM issues i
       JOIN assessments a ON a.id = i.assessment_id
       WHERE a.project_id = ?
       ORDER BY i.created_at DESC`
    )
    .all(projectId) as IssueRow[];
  return rows.map(deserializeIssue);
}

export function getIssuesByProjectAndWcagCode(projectId: string, wcagCode: string): Issue[] {
  const rows = getDb()
    .prepare(
      `SELECT i.* FROM issues i
       JOIN assessments a ON i.assessment_id = a.id
       WHERE a.project_id = ?
         AND EXISTS (
           SELECT 1 FROM json_each(i.wcag_codes) WHERE value = ?
         )
       ORDER BY i.created_at DESC`
    )
    .all(projectId, wcagCode) as IssueRow[];
  return rows.map(deserializeIssue);
}
