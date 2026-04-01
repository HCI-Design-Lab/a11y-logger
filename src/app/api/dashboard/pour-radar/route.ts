/**
 * Dashboard POUR Radar API — /api/dashboard/pour-radar
 *
 * GET /api/dashboard/pour-radar   Get issue totals grouped by POUR principle for radar chart
 */

import { NextResponse } from 'next/server';
import { getPourTotals } from '@/lib/db/dashboard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('statuses');
    const statuses = statusParam ? statusParam.split(',').filter(Boolean) : ['open'];
    const data = await getPourTotals(statuses);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch POUR totals', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
