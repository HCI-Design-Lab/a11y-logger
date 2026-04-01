/**
 * VPAT Versions API — /api/vpats/[id]/versions
 *
 * GET /api/vpats/[id]/versions   List all published version snapshots for a VPAT
 */

import { NextResponse } from 'next/server';
import { getVpat } from '@/lib/db/vpats';
import { listVpatSnapshots } from '@/lib/db/vpat-snapshots';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const vpat = await getVpat(id);
  if (!vpat) {
    return NextResponse.json(
      { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }
  const snapshots = await listVpatSnapshots(id);
  return NextResponse.json({ success: true, data: snapshots });
}
