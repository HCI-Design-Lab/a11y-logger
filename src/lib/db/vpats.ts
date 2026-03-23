import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { vpats, projects, vpatCriterionRows } from './schema';
import type * as sqliteSchema from './schema';
import { getCriteriaForEdition } from './criteria';
import { createCriterionRows, countUnresolvedRows } from './vpat-criterion-rows';
import type { CreateVpatParams, UpdateVpatInput } from '../validators/vpats';

// Cast helper: the union type BetterSQLite3Database | PostgresJsDatabase does not
// share callable overloads in TypeScript, so we cast to the SQLite type for query building.
// At runtime the correct driver is used transparently by Drizzle.
function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

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
  product_scope: string | null;
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
    product_scope: JSON.parse(raw.product_scope ?? '["web"]'),
  };
}

export async function getVpat(id: string): Promise<Vpat | null> {
  const rows = db().select().from(vpats).where(eq(vpats.id, id)).limit(1).all();
  return rows[0] ? parseVpat(rows[0] as VpatRow) : null;
}

export async function getVpats(projectId?: string): Promise<Vpat[]> {
  const rows = projectId
    ? db()
        .select()
        .from(vpats)
        .where(eq(vpats.project_id, projectId))
        .orderBy(sql`${vpats.created_at} DESC`)
        .all()
    : db()
        .select()
        .from(vpats)
        .orderBy(sql`${vpats.created_at} DESC`)
        .all();
  return (rows as VpatRow[]).map(parseVpat);
}

export interface VpatWithProgress extends VpatWithProject {
  resolved: number;
  total: number;
}

export async function getVpatsWithProgress(projectId?: string): Promise<VpatWithProgress[]> {
  type ProgressRow = VpatRow & { project_name: string | null; resolved: number; total: number };

  const base = db()
    .select({
      id: vpats.id,
      project_id: vpats.project_id,
      title: vpats.title,
      description: vpats.description,
      standard_edition: vpats.standard_edition,
      wcag_version: vpats.wcag_version,
      wcag_level: vpats.wcag_level,
      product_scope: vpats.product_scope,
      status: vpats.status,
      version_number: vpats.version_number,
      published_at: vpats.published_at,
      created_at: vpats.created_at,
      updated_at: vpats.updated_at,
      project_name: projects.name,
      total: sql<number>`COUNT(${vpatCriterionRows.id})`.as('total'),
      resolved:
        sql<number>`COALESCE(SUM(CASE WHEN ${vpatCriterionRows.conformance} != 'not_evaluated' THEN 1 ELSE 0 END), 0)`.as(
          'resolved'
        ),
    })
    .from(vpats)
    .leftJoin(projects, eq(projects.id, vpats.project_id))
    .leftJoin(vpatCriterionRows, eq(vpatCriterionRows.vpat_id, vpats.id))
    .groupBy(vpats.id)
    .orderBy(sql`${vpats.created_at} DESC`);

  const rows = (
    projectId ? base.where(eq(vpats.project_id, projectId)).all() : base.all()
  ) as ProgressRow[];

  return rows.map((raw) => ({
    ...parseVpat(raw),
    project_name: raw.project_name ?? null,
    resolved: raw.resolved,
    total: raw.total,
  }));
}

export async function getVpatsWithProject(projectId?: string): Promise<VpatWithProject[]> {
  type WithProjectRow = VpatRow & { project_name: string | null };

  const base = db()
    .select({
      id: vpats.id,
      project_id: vpats.project_id,
      title: vpats.title,
      description: vpats.description,
      standard_edition: vpats.standard_edition,
      wcag_version: vpats.wcag_version,
      wcag_level: vpats.wcag_level,
      product_scope: vpats.product_scope,
      status: vpats.status,
      version_number: vpats.version_number,
      published_at: vpats.published_at,
      created_at: vpats.created_at,
      updated_at: vpats.updated_at,
      project_name: projects.name,
    })
    .from(vpats)
    .leftJoin(projects, eq(projects.id, vpats.project_id))
    .orderBy(sql`${vpats.created_at} DESC`);

  const rows = (
    projectId ? base.where(eq(vpats.project_id, projectId)).all() : base.all()
  ) as WithProjectRow[];

  return rows.map((raw) => ({
    ...parseVpat(raw),
    project_name: raw.project_name ?? null,
  }));
}

export async function createVpat(input: CreateVpatParams): Promise<Vpat> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const edition = input.standard_edition ?? 'WCAG';
  const wcagVersion = input.wcag_version ?? '2.1';
  const wcagLevel = input.wcag_level ?? 'AA';
  const productScope = input.product_scope ?? ['web'];

  db()
    .insert(vpats)
    .values({
      id,
      project_id: input.project_id,
      title: input.title,
      description: input.description ?? null,
      standard_edition: edition,
      wcag_version: wcagVersion,
      wcag_level: wcagLevel,
      product_scope: JSON.stringify(productScope),
      created_at: now,
      updated_at: now,
    })
    .run();

  // Auto-populate criterion rows based on edition and scope
  const sections = await getCriteriaForEdition(edition, productScope, wcagVersion, wcagLevel);
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

  return (await getVpat(id))!;
}

export interface ImportVpatInput {
  project_id: string;
  title: string;
  description: string | null;
  standard_edition: 'WCAG' | '508' | 'EU' | 'INT';
  wcag_version: '2.1' | '2.2';
  wcag_level: 'A' | 'AA' | 'AAA';
  rows: Array<{
    criterion_id: string;
    conformance:
      | 'supports'
      | 'partially_supports'
      | 'does_not_support'
      | 'not_applicable'
      | 'not_evaluated';
    remarks?: string | null;
  }>;
}

export async function importVpatFromOpenAcr(input: ImportVpatInput): Promise<Vpat> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db()
    .insert(vpats)
    .values({
      id,
      project_id: input.project_id,
      title: input.title,
      description: input.description,
      standard_edition: input.standard_edition,
      wcag_version: input.wcag_version,
      wcag_level: input.wcag_level,
      product_scope: JSON.stringify(['web']), // OpenACR YAML has no product_scope concept; default to web
      created_at: now,
      updated_at: now,
    })
    .run();

  createCriterionRows(
    id,
    input.rows.map((r) => ({ ...r, remarks: r.remarks ?? undefined }))
  );

  return (await getVpat(id))!;
}

export async function updateVpat(id: string, input: UpdateVpatInput): Promise<Vpat | null> {
  const existing = await getVpat(id);
  if (!existing) return null;
  if (input.title === undefined) return existing;
  db()
    .update(vpats)
    .set({ title: input.title, updated_at: new Date().toISOString() })
    .where(eq(vpats.id, id))
    .run();
  return getVpat(id);
}

export async function deleteVpat(id: string): Promise<boolean> {
  const existing = await getVpat(id);
  if (!existing) return false;
  db().delete(vpats).where(eq(vpats.id, id)).run();
  return true;
}

export async function publishVpat(id: string): Promise<Vpat> {
  const existing = await getVpat(id);
  if (!existing) throw new VpatNotFoundError(id);
  const unresolved = countUnresolvedRows(id);
  if (unresolved > 0) {
    throw new UnresolvedRowsError(unresolved);
  }
  db()
    .update(vpats)
    .set({
      status: 'published',
      published_at: new Date().toISOString(),
      version_number: sql`${vpats.version_number} + 1`,
      updated_at: new Date().toISOString(),
    })
    .where(eq(vpats.id, id))
    .run();
  return (await getVpat(id))!;
}
