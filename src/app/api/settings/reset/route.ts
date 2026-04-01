import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';

const USER_DATA_TABLES = [
  'vpat_snapshots',
  'vpat_criterion_rows',
  'vpats',
  'issues',
  'reports',
  'assessments',
  'projects',
] as const;

export async function POST() {
  try {
    const db = getDb();
    if (!db) throw new Error('Database not available');

    const deleteAll = db.transaction(() => {
      for (const table of USER_DATA_TABLES) {
        db.prepare(`DELETE FROM ${table}`).run();
      }
    });

    deleteAll();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to reset database', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
