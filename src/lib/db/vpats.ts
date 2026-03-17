import { getDb } from './index';
import { getCriteriaForEdition } from './criteria';
import { createCriterionRows, countUnresolvedRows } from './vpat-criterion-rows';
import type { CreateVpatInput, UpdateVpatInput } from '../validators/vpats';

export class VpatNotFoundError extends Error {
  readonly code = 'VPAT_NOT_FOUND' as const;
  constructor(id: string) {
    super(`VPAT not found: ${id}`);
    this.name = 'VpatNotFoundError';
  }
}

export class UnresolvedRowsError extends Error {
  readonly code = 'UNRESOLVED_ROWS' as const;
  constructor(count: number) {
    super(`Cannot publish: ${count} unresolved rows`);
    this.name = 'UnresolvedRowsError';
  }
}

export interface Vpat {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  standard_edition: 'WCAG' | '508' | 'EU' | 'INT';
  wcag_version: '2.1' | '2.2';
  wcag_level: 'A' | 'AA' | 'AAA';
  product_scope: string[];
  status: 'draft' | 'published';
  version_number: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VpatWithProject extends Vpat {
  project_name: string | null;
}

interface VpatRow {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  standard_edition: string;
  wcag_version: string;
  wcag_level: string;
  product_scope: string;
  status: string;
  version_number: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function parseVpat(raw: VpatRow): Vpat {
  return {
    ...raw,
    standard_edition: raw.standard_edition as Vpat['standard_edition'],
    wcag_version: raw.wcag_version as Vpat['wcag_version'],
    wcag_level: raw.wcag_level as Vpat['wcag_level'],
    status: raw.status as Vpat['status'],
    product_scope: JSON.parse(raw.product_scope),
  };
}

export function getVpat(id: string): Vpat | null {
  const raw = getDb().prepare('SELECT * FROM vpats WHERE id = ?').get(id) as VpatRow | undefined;
  return raw ? parseVpat(raw) : null;
}

export function getVpats(projectId?: string): Vpat[] {
  const rows = projectId
    ? (getDb()
        .prepare('SELECT * FROM vpats WHERE project_id = ? ORDER BY created_at DESC')
        .all(projectId) as VpatRow[])
    : (getDb().prepare('SELECT * FROM vpats ORDER BY created_at DESC').all() as VpatRow[]);
  return rows.map(parseVpat);
}

export interface VpatWithProgress extends VpatWithProject {
  resolved: number;
  total: number;
}

export function getVpatsWithProgress(projectId?: string): VpatWithProgress[] {
  const sql = `
    SELECT v.*, p.name as project_name,
      COUNT(r.id) as total,
      SUM(CASE WHEN r.conformance != 'not_evaluated' THEN 1 ELSE 0 END) as resolved
    FROM vpats v
    LEFT JOIN projects p ON v.project_id = p.id
    LEFT JOIN vpat_criterion_rows r ON r.vpat_id = v.id
    ${projectId ? 'WHERE v.project_id = ?' : ''}
    GROUP BY v.id
    ORDER BY v.created_at DESC
  `;
  const rows = (
    projectId ? getDb().prepare(sql).all(projectId) : getDb().prepare(sql).all()
  ) as (VpatRow & { project_name: string | null; resolved: number; total: number })[];
  return rows.map((raw) => ({
    ...parseVpat(raw),
    project_name: raw.project_name,
    resolved: raw.resolved,
    total: raw.total,
  }));
}

export function getVpatsWithProject(projectId?: string): VpatWithProject[] {
  const sql = `
    SELECT v.*, p.name as project_name
    FROM vpats v
    LEFT JOIN projects p ON v.project_id = p.id
    ${projectId ? 'WHERE v.project_id = ?' : ''}
    ORDER BY v.created_at DESC
  `;
  const rows = (
    projectId ? getDb().prepare(sql).all(projectId) : getDb().prepare(sql).all()
  ) as (VpatRow & { project_name: string | null })[];
  return rows.map((raw) => ({ ...parseVpat(raw), project_name: raw.project_name }));
}

export function createVpat(input: CreateVpatInput): Vpat {
  const id = crypto.randomUUID();
  const db = getDb();
  const edition = input.standard_edition ?? 'WCAG';
  const wcagVersion = input.wcag_version ?? '2.1';
  const wcagLevel = input.wcag_level ?? 'AA';
  const productScope = input.product_scope ?? ['web'];

  db.prepare(
    `
    INSERT INTO vpats (id, project_id, title, description, standard_edition, wcag_version, wcag_level, product_scope)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    input.project_id,
    input.title,
    input.description ?? null,
    edition,
    wcagVersion,
    wcagLevel,
    JSON.stringify(productScope)
  );

  // Auto-populate criterion rows based on edition and scope
  const sections = getCriteriaForEdition(edition, productScope, wcagVersion, wcagLevel);
  const rowInputs = sections.flatMap((s) =>
    s.criteria.map((c) => ({
      criterion_id: c.id,
      conformance: (c.autoNotApplicable ? 'not_applicable' : 'not_evaluated') as
        | 'not_applicable'
        | 'not_evaluated',
      remarks: c.autoNotApplicable
        ? `Not applicable — product scope does not include ${c.chapter_section}.`
        : undefined,
    }))
  );
  createCriterionRows(id, rowInputs);

  return getVpat(id)!;
}

export function updateVpat(id: string, input: UpdateVpatInput): Vpat | null {
  const existing = getVpat(id);
  if (!existing) return null;
  if (input.title === undefined) return existing;
  getDb()
    .prepare("UPDATE vpats SET title = ?, updated_at = datetime('now') WHERE id = ?")
    .run(input.title, id);
  return getVpat(id);
}

export function deleteVpat(id: string): boolean {
  const result = getDb().prepare('DELETE FROM vpats WHERE id = ?').run(id);
  return result.changes > 0;
}

export function publishVpat(id: string): Vpat {
  const existing = getVpat(id);
  if (!existing) throw new VpatNotFoundError(id);
  const unresolved = countUnresolvedRows(id);
  if (unresolved > 0) {
    throw new UnresolvedRowsError(unresolved);
  }
  getDb()
    .prepare(
      `
      UPDATE vpats
      SET status = 'published',
          published_at = datetime('now'),
          version_number = version_number + 1,
          updated_at = datetime('now')
      WHERE id = ?
    `
    )
    .run(id);
  return getVpat(id)!;
}
