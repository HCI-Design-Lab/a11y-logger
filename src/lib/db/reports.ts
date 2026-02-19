import { getDb } from './index';
import type { CreateReportInput, UpdateReportInput } from '../validators/reports';

export interface Report {
  id: string;
  project_id: string;
  type: 'executive' | 'detailed' | 'custom';
  title: string;
  status: 'draft' | 'published';
  content: string; // JSON string: [{title, body}]
  template_id: string | null;
  ai_generated: number; // 0 | 1
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function getReport(id: string): Report | null {
  return (
    (getDb().prepare('SELECT * FROM reports WHERE id = ?').get(id) as Report | undefined) ?? null
  );
}

export function getReports(projectId?: string): Report[] {
  if (projectId) {
    return getDb()
      .prepare('SELECT * FROM reports WHERE project_id = ? ORDER BY created_at DESC')
      .all(projectId) as Report[];
  }
  return getDb().prepare('SELECT * FROM reports ORDER BY created_at DESC').all() as Report[];
}

export function createReport(input: CreateReportInput): Report {
  const id = crypto.randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO reports (id, project_id, title, type, content, template_id, ai_generated)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.project_id,
    input.title,
    input.type ?? 'detailed',
    input.content ? JSON.stringify(input.content) : '[]',
    input.template_id ?? null,
    input.ai_generated ? 1 : 0
  );
  return getReport(id)!;
}

export function updateReport(id: string, input: UpdateReportInput): Report | null {
  const existing = getReport(id);
  if (!existing) return null;

  // Published reports are immutable
  if (existing.status === 'published') return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.title !== undefined) {
    fields.push('title = ?');
    values.push(input.title);
  }
  if (input.type !== undefined) {
    fields.push('type = ?');
    values.push(input.type);
  }
  if (input.content !== undefined) {
    fields.push('content = ?');
    values.push(JSON.stringify(input.content));
  }
  if (input.template_id !== undefined) {
    fields.push('template_id = ?');
    values.push(input.template_id);
  }
  if (input.ai_generated !== undefined) {
    fields.push('ai_generated = ?');
    values.push(input.ai_generated ? 1 : 0);
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  getDb()
    .prepare(`UPDATE reports SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);

  return getReport(id);
}

export function deleteReport(id: string): boolean {
  const result = getDb().prepare('DELETE FROM reports WHERE id = ?').run(id);
  return result.changes > 0;
}

export function publishReport(id: string): Report | null {
  const existing = getReport(id);
  if (!existing) return null;

  // Already published — return as-is to preserve original published_at
  if (existing.status === 'published') return existing;

  getDb()
    .prepare(
      `UPDATE reports SET status = 'published', published_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
    )
    .run(id);

  return getReport(id);
}
