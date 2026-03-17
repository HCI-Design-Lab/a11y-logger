import { getDb } from './index';

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
  last_generated_at: string | null;
  updated_at: string;
  issue_count?: number;
}

function parseRow(raw: CriterionRowDbRow): VpatCriterionRow {
  return {
    ...raw,
    conformance: raw.conformance as VpatCriterionRow['conformance'],
    ai_confidence: raw.ai_confidence as VpatCriterionRow['ai_confidence'],
    issue_count: raw.issue_count ?? 0,
  };
}

const SELECT_JOINED = `
  SELECT
    r.id,
    r.vpat_id,
    r.criterion_id,
    c.code  AS criterion_code,
    c.name  AS criterion_name,
    c.description AS criterion_description,
    c.level AS criterion_level,
    c.chapter_section AS criterion_section,
    r.conformance,
    r.remarks,
    r.ai_confidence,
    r.ai_reasoning,
    r.last_generated_at,
    r.updated_at
  FROM vpat_criterion_rows r
  JOIN criteria c ON c.id = r.criterion_id
`;

export function createCriterionRows(vpatId: string, inputs: CreateCriterionRowInput[]): void {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO vpat_criterion_rows (id, vpat_id, criterion_id, conformance, remarks)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows: CreateCriterionRowInput[]) => {
    for (const row of rows) {
      insert.run(
        crypto.randomUUID(),
        vpatId,
        row.criterion_id,
        row.conformance,
        row.remarks ?? null
      );
    }
  });

  insertMany(inputs);
}

export function getCriterionRows(vpatId: string): VpatCriterionRow[] {
  const rows = getDb()
    .prepare(`${SELECT_JOINED} WHERE r.vpat_id = ? ORDER BY c.sort_order`)
    .all(vpatId) as CriterionRowDbRow[];
  return rows.map(parseRow);
}

export function getCriterionRowsWithIssueCounts(
  vpatId: string,
  projectId: string
): VpatCriterionRow[] {
  const sql = `
    SELECT
      r.id,
      r.vpat_id,
      r.criterion_id,
      c.code  AS criterion_code,
      c.name  AS criterion_name,
      c.description AS criterion_description,
      c.level AS criterion_level,
      c.chapter_section AS criterion_section,
      r.conformance,
      r.remarks,
      r.ai_confidence,
      r.ai_reasoning,
      r.last_generated_at,
      r.updated_at,
      (
        SELECT COUNT(*)
        FROM issues i
        JOIN assessments a ON i.assessment_id = a.id
        WHERE a.project_id = ?
          AND EXISTS (SELECT 1 FROM json_each(i.wcag_codes) WHERE value = c.code)
      ) AS issue_count
    FROM vpat_criterion_rows r
    JOIN criteria c ON c.id = r.criterion_id
    WHERE r.vpat_id = ?
    ORDER BY c.sort_order
  `;
  const rows = getDb().prepare(sql).all(projectId, vpatId) as CriterionRowDbRow[];
  return rows.map(parseRow);
}

export function getCriterionRow(rowId: string): VpatCriterionRow | null {
  const row = getDb().prepare(`${SELECT_JOINED} WHERE r.id = ?`).get(rowId) as
    | CriterionRowDbRow
    | undefined;
  return row ? parseRow(row) : null;
}

export function updateCriterionRow(
  rowId: string,
  input: UpdateCriterionRowInput
): VpatCriterionRow | null {
  const existing = getCriterionRow(rowId);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.conformance !== undefined) {
    fields.push('conformance = ?');
    values.push(input.conformance);
  }
  if (input.remarks !== undefined) {
    fields.push('remarks = ?');
    values.push(input.remarks);
  }
  if (input.ai_confidence !== undefined) {
    fields.push('ai_confidence = ?');
    values.push(input.ai_confidence);
  }
  if (input.ai_reasoning !== undefined) {
    fields.push('ai_reasoning = ?');
    values.push(input.ai_reasoning);
    fields.push("last_generated_at = datetime('now')");
  }

  fields.push("updated_at = datetime('now')");
  values.push(rowId);

  getDb()
    .prepare(`UPDATE vpat_criterion_rows SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);

  return getCriterionRow(rowId);
}

export function countUnresolvedRows(vpatId: string): number {
  const result = getDb()
    .prepare(
      `SELECT COUNT(*) AS count FROM vpat_criterion_rows WHERE vpat_id = ? AND conformance = 'not_evaluated'`
    )
    .get(vpatId) as { count: number };
  return result.count;
}

export function getVpatProgress(vpatId: string): { resolved: number; total: number } {
  const result = getDb()
    .prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN conformance != 'not_evaluated' THEN 1 ELSE 0 END) AS resolved
       FROM vpat_criterion_rows
       WHERE vpat_id = ?`
    )
    .get(vpatId) as { total: number; resolved: number | null };
  return {
    total: result.total,
    resolved: result.resolved ?? 0,
  };
}
