import { eq, and, desc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { vpatSnapshots } from './schema';
import type * as sqliteSchema from './schema';

function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

export interface SnapshotCriterionRow {
  criterion_code: string;
  criterion_name: string;
  criterion_description: string;
  criterion_level: string | null;
  criterion_section: string;
  conformance: string;
  remarks: string | null;
}

export interface VpatSnapshotData {
  title: string;
  description: string | null;
  standard_edition: string;
  wcag_version: string;
  wcag_level: string;
  product_scope: string[];
  criterion_rows: SnapshotCriterionRow[];
}

export interface VpatSnapshotSummary {
  id: string;
  vpat_id: string;
  version_number: number;
  published_at: string;
}

export interface VpatSnapshotFull extends VpatSnapshotSummary {
  data: VpatSnapshotData;
}

export async function createVpatSnapshot(
  vpatId: string,
  versionNumber: number,
  publishedAt: string,
  data: VpatSnapshotData
): Promise<VpatSnapshotSummary> {
  const id = crypto.randomUUID();
  db()
    .insert(vpatSnapshots)
    .values({
      id,
      vpat_id: vpatId,
      version_number: versionNumber,
      published_at: publishedAt,
      snapshot: JSON.stringify(data),
    })
    .run();
  return { id, vpat_id: vpatId, version_number: versionNumber, published_at: publishedAt };
}

export async function listVpatSnapshots(vpatId: string): Promise<VpatSnapshotSummary[]> {
  const rows = db()
    .select({
      id: vpatSnapshots.id,
      vpat_id: vpatSnapshots.vpat_id,
      version_number: vpatSnapshots.version_number,
      published_at: vpatSnapshots.published_at,
    })
    .from(vpatSnapshots)
    .where(eq(vpatSnapshots.vpat_id, vpatId))
    .orderBy(desc(vpatSnapshots.version_number))
    .all();
  return rows;
}

export async function getVpatSnapshot(
  vpatId: string,
  versionNumber: number
): Promise<VpatSnapshotFull | null> {
  const rows = db()
    .select()
    .from(vpatSnapshots)
    .where(and(eq(vpatSnapshots.vpat_id, vpatId), eq(vpatSnapshots.version_number, versionNumber)))
    .all();
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    vpat_id: row.vpat_id,
    version_number: row.version_number,
    published_at: row.published_at,
    data: JSON.parse(row.snapshot) as VpatSnapshotData,
  };
}
