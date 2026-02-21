import { getDb } from './index';
import type { CreateVpatInput, UpdateVpatInput, CriterionRow } from '../validators/vpats';

export interface Vpat {
  id: string;
  project_id: string;
  title: string;
  status: 'draft' | 'published';
  version_number: number;
  wcag_scope: string[];
  criteria_rows: CriterionRow[];
  ai_generated: number;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Raw shape returned by better-sqlite3 (JSON fields are strings)
interface VpatRow {
  id: string;
  project_id: string;
  title: string;
  status: string;
  version_number: number;
  wcag_scope: string;
  criteria_rows: string;
  ai_generated: number;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function parseVpat(raw: VpatRow): Vpat {
  return {
    ...raw,
    status: raw.status as Vpat['status'],
    wcag_scope: safeParse(raw.wcag_scope, []),
    criteria_rows: safeParse(raw.criteria_rows, []),
  };
}

export function getVpat(id: string): Vpat | null {
  const raw = getDb().prepare('SELECT * FROM vpats WHERE id = ?').get(id) as VpatRow | undefined;
  return raw ? parseVpat(raw) : null;
}

export function getVpats(projectId?: string): Vpat[] {
  let rows: VpatRow[];
  if (projectId) {
    rows = getDb()
      .prepare('SELECT * FROM vpats WHERE project_id = ? ORDER BY created_at DESC')
      .all(projectId) as VpatRow[];
  } else {
    rows = getDb().prepare('SELECT * FROM vpats ORDER BY created_at DESC').all() as VpatRow[];
  }
  return rows.map(parseVpat);
}

export function createVpat(input: CreateVpatInput): Vpat {
  const id = crypto.randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO vpats (id, project_id, title, wcag_scope, criteria_rows)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    id,
    input.project_id,
    input.title,
    JSON.stringify(input.wcag_scope ?? []),
    JSON.stringify(input.criteria_rows ?? [])
  );
  return getVpat(id)!;
}

export function updateVpat(id: string, input: UpdateVpatInput): Vpat | null {
  const existing = getVpat(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.title !== undefined) {
    fields.push('title = ?');
    values.push(input.title);
  }
  if (input.wcag_scope !== undefined) {
    fields.push('wcag_scope = ?');
    values.push(JSON.stringify(input.wcag_scope));
  }
  if (input.criteria_rows !== undefined) {
    fields.push('criteria_rows = ?');
    values.push(JSON.stringify(input.criteria_rows));
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  getDb()
    .prepare(`UPDATE vpats SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);

  return getVpat(id);
}

export function deleteVpat(id: string): boolean {
  const result = getDb().prepare('DELETE FROM vpats WHERE id = ?').run(id);
  return result.changes > 0;
}

export function publishVpat(id: string): Vpat | null {
  const existing = getVpat(id);
  if (!existing) return null;

  getDb()
    .prepare(
      `UPDATE vpats
       SET status = 'published',
           published_at = datetime('now'),
           version_number = version_number + 1,
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(id);

  return getVpat(id);
}

/**
 * Returns the subset of the provided issue IDs that do not exist in the database.
 * Used by API routes to validate related_issue_ids in criteria_rows.
 */
export function getInvalidIssueIds(ids: string[]): string[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const found = getDb()
    .prepare(`SELECT id FROM issues WHERE id IN (${placeholders})`)
    .all(...ids) as { id: string }[];
  const foundSet = new Set(found.map((r) => r.id));
  return ids.filter((id) => !foundSet.has(id));
}
