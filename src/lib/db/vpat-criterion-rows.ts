import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { vpatCriterionRows, vpatCriterionComponents, criteria } from './schema';
import type * as sqliteSchema from './schema';

// Cast helper: the union type BetterSQLite3Database | PostgresJsDatabase does not
// share callable overloads in TypeScript, so we cast to the SQLite type for query building.
// At runtime the correct driver is used transparently by Drizzle.
function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

export interface VpatCriterionComponent {
  id: number;
  criterion_row_id: string;
  component_name: string;
  conformance:
    | 'not_evaluated'
    | 'supports'
    | 'partially_supports'
    | 'does_not_support'
    | 'not_applicable';
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface VpatCriterionRow {
  id: string;
  vpat_id: string;
  criterion_id: string;
  criterion_code: string;
  criterion_name: string;
  criterion_name_translated: string | null;
  criterion_description: string;
  criterion_level: string | null;
  criterion_section: string;
  conformance:
    | 'supports'
    | 'partially_supports'
    | 'does_not_support'
    | 'not_applicable'
    | 'not_evaluated';
  remarks: string | null;
  ai_confidence: 'high' | 'medium' | 'low' | null;
  ai_reasoning: string | null;
  ai_referenced_issues:
    | {
        title: string;
        severity: string;
        id?: string;
        assessment_id?: string;
        project_id?: string;
      }[]
    | null;
  ai_suggested_conformance: 'supports' | 'does_not_support' | 'not_applicable' | null;
  last_generated_at: string | null;
  updated_at: string;
  issue_count: number;
  components: VpatCriterionComponent[];
}

export interface CreateCriterionRowInput {
  criterion_id: string;
  conformance: VpatCriterionRow['conformance'];
  remarks?: string;
}

export interface UpdateCriterionRowInput {
  conformance?: VpatCriterionRow['conformance'];
  remarks?: string;
  ai_confidence?: VpatCriterionRow['ai_confidence'];
  ai_reasoning?: string;
  ai_referenced_issues?: { title: string; severity: string }[];
  ai_suggested_conformance?: VpatCriterionRow['ai_suggested_conformance'];
}

// Raw DB join shape
interface CriterionRowDbRow {
  id: string;
  vpat_id: string;
  criterion_id: string;
  criterion_code: string;
  criterion_name: string;
  criterion_description: string;
  criterion_level: string | null;
  criterion_section: string;
  conformance: string;
  remarks: string | null;
  ai_confidence: string | null;
  ai_reasoning: string | null;
  ai_referenced_issues: string | null; // JSON string in DB
  ai_suggested_conformance: string | null;
  last_generated_at: string | null;
  updated_at: string;
  issue_count?: number;
  criterion_name_fr: string | null;
  criterion_name_es: string | null;
  criterion_name_de: string | null;
}

function parseRow(
  raw: CriterionRowDbRow,
  components: VpatCriterionComponent[] = [],
  locale = 'en'
): VpatCriterionRow {
  const translatedName =
    locale !== 'en'
      ? ((raw[`criterion_name_${locale}` as keyof typeof raw] as string | null) ?? null)
      : null;
  return {
    ...raw,
    criterion_name_translated: translatedName,
    conformance: raw.conformance as VpatCriterionRow['conformance'],
    ai_confidence: raw.ai_confidence as VpatCriterionRow['ai_confidence'],
    ai_suggested_conformance:
      raw.ai_suggested_conformance as VpatCriterionRow['ai_suggested_conformance'],
    ai_referenced_issues: (() => {
      if (!raw.ai_referenced_issues) return null;
      try {
        return JSON.parse(raw.ai_referenced_issues) as { title: string; severity: string }[];
      } catch {
        return null;
      }
    })(),
    issue_count: raw.issue_count ?? 0,
    components,
  };
}

/**
 * Batch-loads all component rows for a set of criterion row IDs.
 * Returns a Map from criterion_row_id to its components array.
 */
function loadComponentsMap(rowIds: string[]): Map<string, VpatCriterionComponent[]> {
  if (rowIds.length === 0) return new Map();
  const allComponents = db()
    .select()
    .from(vpatCriterionComponents)
    .where(
      sql`${vpatCriterionComponents.criterion_row_id} IN (${sql.join(
        rowIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    )
    .all() as VpatCriterionComponent[];
  const map = new Map<string, VpatCriterionComponent[]>();
  for (const comp of allComponents) {
    const arr = map.get(comp.criterion_row_id) ?? [];
    arr.push(comp);
    map.set(comp.criterion_row_id, arr);
  }
  return map;
}

const joinedSelect = {
  id: vpatCriterionRows.id,
  vpat_id: vpatCriterionRows.vpat_id,
  criterion_id: vpatCriterionRows.criterion_id,
  criterion_code: criteria.code,
  criterion_name: criteria.name,
  criterion_description: criteria.description,
  criterion_level: criteria.level,
  criterion_section: criteria.chapter_section,
  conformance: vpatCriterionRows.conformance,
  remarks: vpatCriterionRows.remarks,
  ai_confidence: vpatCriterionRows.ai_confidence,
  ai_reasoning: vpatCriterionRows.ai_reasoning,
  ai_referenced_issues: vpatCriterionRows.ai_referenced_issues,
  ai_suggested_conformance: vpatCriterionRows.ai_suggested_conformance,
  last_generated_at: vpatCriterionRows.last_generated_at,
  updated_at: vpatCriterionRows.updated_at,
  criterion_name_fr: criteria.name_fr,
  criterion_name_es: criteria.name_es,
  criterion_name_de: criteria.name_de,
};

/**
 * Bulk-inserts criterion rows for a VPAT in a single database write.
 *
 * @param vpatId - The UUID of the parent VPAT.
 * @param inputs - Array of criterion row creation inputs, each with criterion_id, conformance, and optional remarks.
 */
export function createCriterionRows(vpatId: string, inputs: CreateCriterionRowInput[]): void {
  if (inputs.length === 0) return;
  const now = new Date().toISOString();
  db()
    .insert(vpatCriterionRows)
    .values(
      inputs.map((input) => ({
        id: crypto.randomUUID(),
        vpat_id: vpatId,
        criterion_id: input.criterion_id,
        conformance: input.conformance,
        remarks: input.remarks ?? null,
        updated_at: now,
      }))
    )
    .run();
}

/**
 * Retrieves all criterion rows for a VPAT, joined with their criterion metadata, ordered by sort_order.
 *
 * @param vpatId - The UUID of the VPAT whose rows should be retrieved.
 * @returns Array of fully populated criterion row records.
 */
export async function getCriterionRows(vpatId: string, locale = 'en'): Promise<VpatCriterionRow[]> {
  const rows = db()
    .select(joinedSelect)
    .from(vpatCriterionRows)
    .innerJoin(criteria, eq(criteria.id, vpatCriterionRows.criterion_id))
    .where(eq(vpatCriterionRows.vpat_id, vpatId))
    .orderBy(criteria.sort_order)
    .all() as CriterionRowDbRow[];
  const rowIds = rows.map((r) => r.id);
  const componentsMap = loadComponentsMap(rowIds);
  return rows.map((r) => parseRow(r, componentsMap.get(r.id) ?? [], locale));
}

/**
 * Retrieves criterion rows for a VPAT, each annotated with the count of project issues referencing that criterion's WCAG code.
 *
 * @param vpatId - The UUID of the VPAT whose rows should be retrieved.
 * @param projectId - The UUID of the project used to scope the issue count subquery.
 * @returns Array of criterion row records including an issue_count for each criterion.
 */
export async function getCriterionRowsWithIssueCounts(
  vpatId: string,
  projectId: string,
  locale = 'en'
): Promise<VpatCriterionRow[]> {
  // issue_count uses a subquery — keep raw SQL for this complex aggregation
  type RowWithCount = CriterionRowDbRow & { issue_count: number };
  const rows = db()
    .select({
      ...joinedSelect,
      issue_count: sql<number>`(
        SELECT COUNT(*)
        FROM issues i
        JOIN assessments a ON i.assessment_id = a.id
        WHERE a.project_id = ${projectId}
          AND EXISTS (SELECT 1 FROM json_each(i.wcag_codes) WHERE value = ${criteria.code})
      )`.as('issue_count'),
    })
    .from(vpatCriterionRows)
    .innerJoin(criteria, eq(criteria.id, vpatCriterionRows.criterion_id))
    .where(eq(vpatCriterionRows.vpat_id, vpatId))
    .orderBy(criteria.sort_order)
    .all() as RowWithCount[];
  const rowIds = rows.map((r) => r.id);
  const componentsMap = loadComponentsMap(rowIds);
  return rows.map((r) => parseRow(r, componentsMap.get(r.id) ?? [], locale));
}

/**
 * Retrieves a single criterion row by its ID, joined with its criterion metadata.
 *
 * @param rowId - The UUID of the criterion row to retrieve.
 * @returns The criterion row record, or null if not found.
 */
export async function getCriterionRow(
  rowId: string,
  locale = 'en'
): Promise<VpatCriterionRow | null> {
  const row = db()
    .select(joinedSelect)
    .from(vpatCriterionRows)
    .innerJoin(criteria, eq(criteria.id, vpatCriterionRows.criterion_id))
    .where(eq(vpatCriterionRows.id, rowId))
    .limit(1)
    .get() as CriterionRowDbRow | undefined;
  if (!row) return null;
  const components = await getComponentsForRow(rowId);
  return parseRow(row, components, locale);
}

/**
 * Updates a criterion row's conformance, remarks, or AI suggestion fields.
 * Automatically resets a 'reviewed' parent VPAT to 'draft' if conformance or remarks change.
 *
 * @param rowId - The UUID of the criterion row to update.
 * @param input - Partial update payload; only provided fields are written.
 * @returns The updated criterion row record, or null if not found.
 */
export async function updateCriterionRow(
  rowId: string,
  input: UpdateCriterionRowInput
): Promise<VpatCriterionRow | null> {
  const existing = await getCriterionRow(rowId);
  if (!existing) return null;

  type RowUpdate = Partial<
    Pick<
      typeof vpatCriterionRows.$inferInsert,
      | 'conformance'
      | 'remarks'
      | 'ai_confidence'
      | 'ai_reasoning'
      | 'ai_referenced_issues'
      | 'ai_suggested_conformance'
      | 'last_generated_at'
      | 'updated_at'
    >
  >;
  const values: RowUpdate = {};

  if (input.conformance !== undefined) values.conformance = input.conformance;
  if (input.remarks !== undefined) values.remarks = input.remarks;
  if (input.ai_confidence !== undefined) values.ai_confidence = input.ai_confidence;
  if (input.ai_reasoning !== undefined) {
    values.ai_reasoning = input.ai_reasoning;
    values.last_generated_at = new Date().toISOString();
  }
  if (input.ai_referenced_issues !== undefined) {
    values.ai_referenced_issues = JSON.stringify(input.ai_referenced_issues);
  }
  if (input.ai_suggested_conformance !== undefined) {
    values.ai_suggested_conformance = input.ai_suggested_conformance;
  }

  values.updated_at = new Date().toISOString();

  db().update(vpatCriterionRows).set(values).where(eq(vpatCriterionRows.id, rowId)).run();

  // Reset reviewed VPAT to draft if conformance or remarks changed
  if (input.conformance !== undefined || input.remarks !== undefined) {
    // Dynamic import of schema (not vpats.ts) to avoid circular dependency:
    // vpats.ts statically imports vpat-criterion-rows.ts, so importing vpats.ts
    // here would create a cycle. Schema has no such dependency.
    const { vpats: vpatsTable } = await import('./schema');
    const vpatRow = db()
      .select({ status: vpatsTable.status })
      .from(vpatsTable)
      .where(eq(vpatsTable.id, existing.vpat_id))
      .limit(1)
      .get() as { status: string } | undefined;
    if (vpatRow?.status === 'reviewed') {
      const now = new Date().toISOString();
      db()
        .update(vpatsTable)
        .set({ status: 'draft', reviewed_by: null, reviewed_at: null, updated_at: now })
        .where(eq(vpatsTable.id, existing.vpat_id))
        .run();
    }
  }

  return getCriterionRow(rowId);
}

/**
 * Counts the number of criterion rows for a VPAT that still have conformance set to 'not_evaluated'.
 *
 * @param vpatId - The UUID of the VPAT to inspect.
 * @returns The count of unresolved (not_evaluated) rows.
 */
export function countUnresolvedRows(vpatId: string): number {
  // A row is resolved when EITHER:
  //   (a) its row-level conformance is not 'not_evaluated' (explicit override), OR
  //   (b) it has component rows AND all components have conformance != 'not_evaluated'
  // A row is unresolved when NEITHER condition holds.
  const result = db().get(sql`
    SELECT COUNT(*) as count FROM vpat_criterion_rows r
    WHERE r.vpat_id = ${vpatId}
      AND r.conformance = 'not_evaluated'
      AND NOT (
        EXISTS (SELECT 1 FROM vpat_criterion_components c WHERE c.criterion_row_id = r.id)
        AND NOT EXISTS (SELECT 1 FROM vpat_criterion_components c WHERE c.criterion_row_id = r.id AND c.conformance = 'not_evaluated')
      )
  `) as { count: number };
  return result.count;
}

/**
 * Returns the total and resolved criterion row counts for a VPAT.
 * A row is considered resolved when its conformance is anything other than 'not_evaluated'.
 *
 * @param vpatId - The UUID of the VPAT to check.
 * @returns Object with total rows and resolved rows counts.
 */
export async function getVpatProgress(
  vpatId: string
): Promise<{ resolved: number; total: number }> {
  // A row is resolved when EITHER:
  //   (a) its row-level conformance is not 'not_evaluated', OR
  //   (b) it has component rows AND ALL components have conformance != 'not_evaluated'
  const result = db().get(sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE
        WHEN r.conformance != 'not_evaluated'
        THEN 1
        WHEN EXISTS (SELECT 1 FROM vpat_criterion_components c WHERE c.criterion_row_id = r.id)
          AND NOT EXISTS (SELECT 1 FROM vpat_criterion_components c WHERE c.criterion_row_id = r.id AND c.conformance = 'not_evaluated')
        THEN 1
        ELSE 0
      END) as resolved
    FROM vpat_criterion_rows r
    WHERE r.vpat_id = ${vpatId}
  `) as { total: number; resolved: number | null };
  return {
    total: result?.total ?? 0,
    resolved: result?.resolved ?? 0,
  };
}

/**
 * Returns all component rows for a given criterion row ID.
 */
export async function getComponentsForRow(rowId: string): Promise<VpatCriterionComponent[]> {
  return db()
    .select()
    .from(vpatCriterionComponents)
    .where(eq(vpatCriterionComponents.criterion_row_id, rowId))
    .all() as VpatCriterionComponent[];
}

/**
 * Returns a single component row by row ID and component name, or null if not found.
 */
export async function getCriterionComponent(
  rowId: string,
  componentName: string
): Promise<VpatCriterionComponent | null> {
  const result = db()
    .select()
    .from(vpatCriterionComponents)
    .where(
      sql`${vpatCriterionComponents.criterion_row_id} = ${rowId} AND ${vpatCriterionComponents.component_name} = ${componentName}`
    )
    .limit(1)
    .get() as VpatCriterionComponent | undefined;
  return result ?? null;
}

/**
 * Upserts (inserts or updates) a component row for a criterion row.
 */
export async function upsertCriterionComponent(
  rowId: string,
  componentName: string,
  update: { conformance?: string; remarks?: string }
): Promise<VpatCriterionComponent> {
  const now = new Date().toISOString();
  const existing = await getCriterionComponent(rowId, componentName);
  if (existing) {
    const values: Partial<typeof vpatCriterionComponents.$inferInsert> = { updated_at: now };
    if (update.conformance !== undefined) values.conformance = update.conformance;
    if (update.remarks !== undefined) values.remarks = update.remarks;
    db()
      .update(vpatCriterionComponents)
      .set(values)
      .where(
        sql`${vpatCriterionComponents.criterion_row_id} = ${rowId} AND ${vpatCriterionComponents.component_name} = ${componentName}`
      )
      .run();
  } else {
    db()
      .insert(vpatCriterionComponents)
      .values({
        criterion_row_id: rowId,
        component_name: componentName,
        conformance: update.conformance ?? 'not_evaluated',
        remarks: update.remarks ?? null,
        created_at: now,
        updated_at: now,
      })
      .run();
  }
  return (await getCriterionComponent(rowId, componentName))!;
}

/**
 * Bulk-creates component rows for all criterion rows of a VPAT.
 * Called by createVpat() after createCriterionRows().
 */
export function createComponentRowsForVpat(vpatId: string, componentNames: string[]): void {
  if (componentNames.length === 0) return;
  const rowIds = db()
    .select({ id: vpatCriterionRows.id })
    .from(vpatCriterionRows)
    .where(eq(vpatCriterionRows.vpat_id, vpatId))
    .all() as { id: string }[];
  if (rowIds.length === 0) return;
  const now = new Date().toISOString();
  const values = rowIds.flatMap((row) =>
    componentNames.map((name) => ({
      criterion_row_id: row.id,
      component_name: name,
      conformance: 'not_evaluated' as const,
      remarks: null,
      created_at: now,
      updated_at: now,
    }))
  );
  db().insert(vpatCriterionComponents).values(values).run();
}
