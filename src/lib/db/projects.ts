import { getDb } from './index';
import type { CreateProjectInput } from '../validators/projects';

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
