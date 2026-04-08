import { randomUUID } from 'crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { getDbClient } from './client';
import { vpatCoverSheets } from './schema';
import type * as sqliteSchema from './schema';
import type { VpatCoverSheetRow } from './schema';

function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

export type CoverSheetData = Omit<VpatCoverSheetRow, 'id' | 'created_at' | 'updated_at'>;

export function getCoverSheet(vpatId: string): VpatCoverSheetRow | null {
  const rows = db().select().from(vpatCoverSheets).where(eq(vpatCoverSheets.vpat_id, vpatId)).all();
  return rows[0] ?? null;
}

export function upsertCoverSheet(
  vpatId: string,
  data: Partial<Omit<VpatCoverSheetRow, 'id' | 'vpat_id' | 'created_at' | 'updated_at'>>
): VpatCoverSheetRow {
  const now = new Date().toISOString();
  const existing = getCoverSheet(vpatId);

  if (existing) {
    db()
      .update(vpatCoverSheets)
      .set({ ...data, updated_at: now })
      .where(eq(vpatCoverSheets.vpat_id, vpatId))
      .run();
  } else {
    db()
      .insert(vpatCoverSheets)
      .values({
        id: randomUUID(),
        vpat_id: vpatId,
        ...data,
        created_at: now,
        updated_at: now,
      })
      .run();
  }

  return db().select().from(vpatCoverSheets).where(eq(vpatCoverSheets.vpat_id, vpatId)).get()!;
}
