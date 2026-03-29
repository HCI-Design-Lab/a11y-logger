import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { vpatCriterionRows, criteria } from './schema';
import type * as sqliteSchema from './schema';

// Cast helper: the union type BetterSQLite3Database | PostgresJsDatabase does not
// share callable overloads in TypeScript, so we cast to the SQLite type for query building.
// At runtime the correct driver is used transparently by Drizzle.
function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

export interface VpatCriterionRow {
  id: string;
  vpat_id: string;
  criterion_id: string;
  criterion_code: string;
  criterion_name: string;
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
  ai_referenced_issues: { title: string; severity: string }[] | null;
  ai_suggested_conformance: 'supports' | 'does_not_support' | 'not_applicable' | null;
  last_generated_at: string | null;
  updated_at: string;
  issue_count: number;
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
  ai_referenced_issues: string | null;    // JSON string in DB
  ai_suggested_conformance: string | null;
  last_generated_at: string | null;
  updated_at: string;
  issue_count?: number;
}

function parseRow(raw: CriterionRowDbRow): VpatCriterionRow {
  return {
    ...raw,
    conformance: raw.conformance as VpatCriterionRow['conformance'],
    ai_confidence: raw.ai_confidence as VpatCriterionRow['ai_confidence'],
    ai_suggested_conformance: raw.ai_suggested_conformance as VpatCriterionRow['ai_suggested_conformance'],
    ai_referenced_issues: raw.ai_referenced_issues
      ? (JSON.parse(raw.ai_referenced_issues) as { title: string; severity: string }[])
      : null,
    issue_count: raw.issue_count ?? 0,
  };
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
};

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

export async function getCriterionRows(vpatId: string): Promise<VpatCriterionRow[]> {
  const rows = db()
    .select(joinedSelect)
    .from(vpatCriterionRows)
    .innerJoin(criteria, eq(criteria.id, vpatCriterionRows.criterion_id))
    .where(eq(vpatCriterionRows.vpat_id, vpatId))
    .orderBy(criteria.sort_order)
    .all() as CriterionRowDbRow[];
  return rows.map(parseRow);
}

export async function getCriterionRowsWithIssueCounts(
  vpatId: string,
  projectId: string
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
  return rows.map(parseRow);
}

export async function getCriterionRow(rowId: string): Promise<VpatCriterionRow | null> {
  const row = db()
    .select(joinedSelect)
    .from(vpatCriterionRows)
    .innerJoin(criteria, eq(criteria.id, vpatCriterionRows.criterion_id))
    .where(eq(vpatCriterionRows.id, rowId))
    .limit(1)
    .get() as CriterionRowDbRow | undefined;
  return row ? parseRow(row) : null;
}

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

export function countUnresolvedRows(vpatId: string): number {
  const notEvaluated = db()
    .select({ count: sql<number>`COUNT(*)`.as('count') })
    .from(vpatCriterionRows)
    .where(
      sql`${vpatCriterionRows.vpat_id} = ${vpatId} AND ${vpatCriterionRows.conformance} = 'not_evaluated'`
    )
    .get() as { count: number };
  return notEvaluated.count;
}

export async function getVpatProgress(
  vpatId: string
): Promise<{ resolved: number; total: number }> {
  const result = db()
    .select({
      total: sql<number>`COUNT(*)`.as('total'),
      resolved:
        sql<number>`SUM(CASE WHEN ${vpatCriterionRows.conformance} != 'not_evaluated' THEN 1 ELSE 0 END)`.as(
          'resolved'
        ),
    })
    .from(vpatCriterionRows)
    .where(eq(vpatCriterionRows.vpat_id, vpatId))
    .get() as { total: number; resolved: number | null };
  return {
    total: result?.total ?? 0,
    resolved: result?.resolved ?? 0,
  };
}
