import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { vpats, projects, vpatCriterionRows } from './schema';
import type * as sqliteSchema from './schema';
import { getCriteriaForEdition } from './criteria';
import {
  createCriterionRows,
  countUnresolvedRows,
  getCriterionRows,
  createComponentRowsForVpat,
  upsertCriterionComponent,
} from './vpat-criterion-rows';
import type { VpatCriterionRow } from './vpat-criterion-rows';
import { createVpatSnapshot } from './vpat-snapshots';
import type { VpatSnapshotData } from './vpat-snapshots';
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

export class NotReviewedError extends Error {
  readonly code = 'NOT_REVIEWED' as const;
  constructor(id: string) {
    super(`Cannot publish: VPAT ${id} has not been reviewed`);
    this.name = 'NotReviewedError';
  }
}

export class NotPublishedError extends Error {
  constructor(id: string) {
    super(`VPAT ${id} is not published`);
    this.name = 'NotPublishedError';
  }
}

/**
 * Maps product_scope values to OpenACR component names.
 * software-desktop and software-mobile both map to 'software'.
 */
export function getScopeComponents(productScope: string[]): string[] {
  const components = new Set<string>();
  if (productScope.includes('web')) components.add('web');
  if (productScope.includes('software-desktop') || productScope.includes('software-mobile'))
    components.add('software');
  if (productScope.includes('documents')) components.add('electronic-docs');
  return Array.from(components);
}

export interface VpatData {
  id: string;
  title: string;
  status: 'draft' | 'reviewed' | 'published';
  standard_edition: 'WCAG' | '508' | 'EU' | 'INT';
  wcag_version: '2.1' | '2.2';
  wcag_level: 'A' | 'AA' | 'AAA';
  product_scope: string[];
  project_id: string;
  version_number: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  criterion_rows: VpatCriterionRow[];
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
  status: 'draft' | 'reviewed' | 'published';
  version_number: number;
  published_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
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
  reviewed_by: string | null;
  reviewed_at: string | null;
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

/**
 * Retrieves a single VPAT by its ID.
 *
 * @param id - The UUID of the VPAT to retrieve.
 * @returns The parsed VPAT record, or null if not found.
 */
export async function getVpat(id: string): Promise<Vpat | null> {
  const rows = db().select().from(vpats).where(eq(vpats.id, id)).limit(1).all();
  return rows[0] ? parseVpat(rows[0] as VpatRow) : null;
}

/**
 * Retrieves VPATs, optionally filtered by project, ordered by creation date descending.
 *
 * @param projectId - Optional project UUID; omit to retrieve VPATs across all projects.
 * @returns Array of parsed VPAT records.
 */
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

/**
 * Retrieves VPATs with per-VPAT criterion row progress (resolved vs. total), optionally scoped to a project.
 *
 * @param projectId - Optional project UUID; omit to retrieve across all projects.
 * @returns Array of VPATs each including project_name, resolved count, and total criterion row count.
 */
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
      reviewed_by: vpats.reviewed_by,
      reviewed_at: vpats.reviewed_at,
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

/**
 * Retrieves VPATs joined with their parent project name, optionally scoped to a project.
 *
 * @param projectId - Optional project UUID; omit to retrieve across all projects.
 * @returns Array of VPATs each including project_name (null if project was deleted).
 */
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
      reviewed_by: vpats.reviewed_by,
      reviewed_at: vpats.reviewed_at,
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

/**
 * Creates a new VPAT and auto-populates criterion rows based on the chosen edition and product scope.
 *
 * @param input - VPAT creation parameters including project_id, title, edition, WCAG version/level, and product_scope.
 * @returns The newly created VPAT record.
 */
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
  createComponentRowsForVpat(id, getScopeComponents(productScope));

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
    components?: Array<{
      component_name: string;
      conformance: string;
      remarks?: string | null;
    }>;
  }>;
}

/**
 * Creates a VPAT from an imported OpenACR data structure, inserting criterion rows as provided.
 *
 * @param input - Import payload including project_id, title, edition, and an array of criterion rows with conformance data.
 * @returns The newly created VPAT record.
 */
export async function importVpatFromOpenAcr(input: ImportVpatInput): Promise<Vpat> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Derive product_scope from component names across all rows
  const componentNamesUnion = new Set<string>();
  for (const row of input.rows) {
    for (const comp of row.components ?? []) {
      componentNamesUnion.add(comp.component_name);
    }
  }
  // Reverse map: component_name → product_scope value
  const derivedScope = new Set<string>();
  if (componentNamesUnion.has('web')) derivedScope.add('web');
  if (componentNamesUnion.has('software')) derivedScope.add('software-desktop');
  if (componentNamesUnion.has('electronic-docs')) derivedScope.add('documents');
  const productScope = derivedScope.size > 0 ? Array.from(derivedScope) : ['web'];

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
      product_scope: JSON.stringify(productScope),
      created_at: now,
      updated_at: now,
    })
    .run();

  createCriterionRows(
    id,
    input.rows.map((r) => ({ ...r, remarks: r.remarks ?? undefined }))
  );

  // Create per-component rows
  const criterionRowsForVpat = db()
    .select({ id: vpatCriterionRows.id, criterion_id: vpatCriterionRows.criterion_id })
    .from(vpatCriterionRows)
    .where(eq(vpatCriterionRows.vpat_id, id))
    .all() as { id: string; criterion_id: string }[];

  const criterionIdToRowId = new Map(criterionRowsForVpat.map((r) => [r.criterion_id, r.id]));

  for (const row of input.rows) {
    const rowId = criterionIdToRowId.get(row.criterion_id);
    if (!rowId) continue;
    if (row.components && row.components.length > 0) {
      for (const comp of row.components) {
        await upsertCriterionComponent(rowId, comp.component_name, {
          conformance: comp.conformance,
          remarks: comp.remarks ?? undefined,
        });
      }
    } else {
      // Fall back to single web component
      await upsertCriterionComponent(rowId, 'web', {
        conformance: row.conformance,
        remarks: row.remarks ?? undefined,
      });
    }
  }

  return (await getVpat(id))!;
}

/**
 * Updates a VPAT's title.
 *
 * @param id - The UUID of the VPAT to update.
 * @param input - Update payload; currently only title is updatable via this function.
 * @returns The updated VPAT record, or null if not found.
 */
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

/**
 * Permanently deletes a VPAT and its criterion rows.
 *
 * @param id - The UUID of the VPAT to delete.
 * @returns True if the VPAT was deleted, false if not found.
 */
export async function deleteVpat(id: string): Promise<boolean> {
  const existing = await getVpat(id);
  if (!existing) return false;
  db().delete(vpats).where(eq(vpats.id, id)).run();
  return true;
}

/**
 * Marks a VPAT as reviewed after confirming all criterion rows have been evaluated.
 *
 * @param id - The UUID of the VPAT to review.
 * @param reviewerName - Display name of the person completing the review.
 * @returns The updated VPAT record with status 'reviewed'.
 * @throws {VpatNotFoundError} If the VPAT does not exist.
 * @throws {UnresolvedRowsError} If any criterion rows are still 'not_evaluated'.
 */
export async function reviewVpat(id: string, reviewerName: string): Promise<Vpat> {
  const existing = await getVpat(id);
  if (!existing) throw new VpatNotFoundError(id);
  const unresolved = countUnresolvedRows(id);
  if (unresolved > 0) throw new UnresolvedRowsError(unresolved);
  const now = new Date().toISOString();
  db()
    .update(vpats)
    .set({ status: 'reviewed', reviewed_by: reviewerName, reviewed_at: now, updated_at: now })
    .where(eq(vpats.id, id))
    .run();
  return (await getVpat(id))!;
}

/**
 * Publishes a reviewed VPAT, increments its version_number, and creates an immutable snapshot.
 *
 * @param id - The UUID of the VPAT to publish.
 * @returns The updated VPAT record with status 'published' and incremented version.
 * @throws {VpatNotFoundError} If the VPAT does not exist.
 * @throws {UnresolvedRowsError} If any criterion rows are still 'not_evaluated'.
 * @throws {NotReviewedError} If the VPAT status is not 'reviewed'.
 */
export async function publishVpat(id: string): Promise<Vpat> {
  const existing = await getVpat(id);
  if (!existing) throw new VpatNotFoundError(id);
  const unresolved = countUnresolvedRows(id);
  if (unresolved > 0) {
    throw new UnresolvedRowsError(unresolved);
  }
  if (existing.status !== 'reviewed') throw new NotReviewedError(id);
  // Capture criterion rows before status update (rows don't change during publish)
  const criterionRows = await getCriterionRows(id);
  const publishedAt = new Date().toISOString();
  db()
    .update(vpats)
    .set({
      status: 'published',
      published_at: publishedAt,
      version_number: sql`${vpats.version_number} + 1`,
      updated_at: publishedAt,
    })
    .where(eq(vpats.id, id))
    .run();
  const published = (await getVpat(id))!;
  const snapshotData: VpatSnapshotData = {
    title: published.title,
    description: published.description,
    standard_edition: published.standard_edition,
    wcag_version: published.wcag_version,
    wcag_level: published.wcag_level,
    product_scope: published.product_scope,
    reviewed_by: published.reviewed_by,
    reviewed_at: published.reviewed_at,
    criterion_rows: criterionRows.map((r) => ({
      criterion_code: r.criterion_code,
      criterion_name: r.criterion_name,
      criterion_description: r.criterion_description,
      criterion_level: r.criterion_level,
      criterion_section: r.criterion_section,
      conformance: r.conformance,
      remarks: r.remarks,
    })),
  };
  await createVpatSnapshot(published.id, published.version_number, publishedAt, snapshotData);
  return published;
}

/**
 * Reverts a published VPAT back to 'draft' status.
 *
 * @param id - The UUID of the VPAT to unpublish.
 * @returns The updated VPAT record with status 'draft'.
 * @throws {VpatNotFoundError} If the VPAT does not exist.
 * @throws {NotPublishedError} If the VPAT is not currently published.
 */
export async function unpublishVpat(id: string): Promise<Vpat> {
  const existing = await getVpat(id);
  if (!existing) throw new VpatNotFoundError(id);
  if (existing.status !== 'published') throw new NotPublishedError(id);
  const now = new Date().toISOString();
  db().update(vpats).set({ status: 'draft', updated_at: now }).where(eq(vpats.id, id)).run();
  return (await getVpat(id))!;
}
