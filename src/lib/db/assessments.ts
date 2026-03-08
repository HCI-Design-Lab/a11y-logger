import { getDb } from './index';
import type { CreateAssessmentInput, UpdateAssessmentInput } from '../validators/assessments';

export interface Assessment {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  test_date_start: string | null;
  test_date_end: string | null;
  status: 'planning' | 'in_progress' | 'completed';
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentWithCounts extends Assessment {
  issue_count: number;
}

export interface AssessmentWithProject extends AssessmentWithCounts {
  project_name: string;
}

export function getAllAssessments(): AssessmentWithProject[] {
  return getDb()
    .prepare(
      `SELECT a.*, p.name AS project_name, COUNT(DISTINCT i.id) AS issue_count
       FROM assessments a
       JOIN projects p ON p.id = a.project_id
       LEFT JOIN issues i ON i.assessment_id = a.id
       GROUP BY a.id
       ORDER BY a.created_at DESC`
    )
    .all() as AssessmentWithProject[];
}

export function getAssessment(id: string): Assessment | null {
  return (
    (getDb().prepare('SELECT * FROM assessments WHERE id = ?').get(id) as Assessment | undefined) ??
    null
  );
}

export function getAssessments(projectId: string): AssessmentWithCounts[] {
  return getDb()
    .prepare(
      `SELECT a.*, COUNT(DISTINCT i.id) AS issue_count
       FROM assessments a
       LEFT JOIN issues i ON i.assessment_id = a.id
       WHERE a.project_id = ?
       GROUP BY a.id
       ORDER BY a.created_at DESC`
    )
    .all(projectId) as AssessmentWithCounts[];
}

export function createAssessment(projectId: string, input: CreateAssessmentInput): Assessment {
  const id = crypto.randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO assessments (id, project_id, name, description, test_date_start, test_date_end, status, assigned_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    projectId,
    input.name,
    input.description ?? null,
    input.test_date_start ?? null,
    input.test_date_end ?? null,
    input.status ?? 'planning',
    input.assigned_to ?? null
  );
  return getAssessment(id)!;
}

export function updateAssessment(id: string, input: UpdateAssessmentInput): Assessment | null {
  const existing = getAssessment(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.description !== undefined) {
    fields.push('description = ?');
    values.push(input.description);
  }
  if (input.test_date_start !== undefined) {
    fields.push('test_date_start = ?');
    values.push(input.test_date_start);
  }
  if (input.test_date_end !== undefined) {
    fields.push('test_date_end = ?');
    values.push(input.test_date_end);
  }
  if (input.status !== undefined) {
    fields.push('status = ?');
    values.push(input.status);
  }
  if (input.assigned_to !== undefined) {
    fields.push('assigned_to = ?');
    values.push(input.assigned_to);
  }
  if (input.project_id !== undefined) {
    fields.push('project_id = ?');
    values.push(input.project_id);
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  getDb()
    .prepare(`UPDATE assessments SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);

  return getAssessment(id);
}

export function deleteAssessment(id: string): boolean {
  const result = getDb().prepare('DELETE FROM assessments WHERE id = ?').run(id);
  return result.changes > 0;
}
