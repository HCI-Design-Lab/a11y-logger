import { getDb } from './index';
import type { CreateProjectInput, UpdateProjectInput } from '../validators/projects';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  product_url: string | null;
  status: 'active' | 'archived';
  settings: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithCounts extends Project {
  assessment_count: number;
  issue_count: number;
}

export function getProject(id: string): Project | null {
  return (
    (getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined) ?? null
  );
}

export function createProject(input: CreateProjectInput): Project {
  const id = crypto.randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO projects (id, name, description, product_url, status)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name,
    input.description ?? null,
    input.product_url ?? null,
    input.status ?? 'active'
  );
  return getProject(id)!;
}

export function getProjects(): ProjectWithCounts[] {
  return getDb()
    .prepare(
      `SELECT
         p.*,
         COUNT(DISTINCT a.id) AS assessment_count,
         COUNT(DISTINCT i.id) AS issue_count
       FROM projects p
       LEFT JOIN assessments a ON a.project_id = p.id
       LEFT JOIN issues i ON i.assessment_id = a.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    )
    .all() as ProjectWithCounts[];
}

export function updateProject(id: string, input: UpdateProjectInput): Project | null {
  const existing = getProject(id);
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
  if (input.product_url !== undefined) {
    fields.push('product_url = ?');
    values.push(input.product_url);
  }
  if (input.status !== undefined) {
    fields.push('status = ?');
    values.push(input.status);
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  getDb()
    .prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);

  return getProject(id);
}

export function deleteProject(id: string): boolean {
  const result = getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
  return result.changes > 0;
}

export function archiveProject(id: string): Project | null {
  return updateProject(id, { status: 'archived' });
}
