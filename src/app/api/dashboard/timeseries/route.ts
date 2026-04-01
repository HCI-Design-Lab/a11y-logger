/**
 * Dashboard Timeseries API — /api/dashboard/timeseries
 *
 * GET /api/dashboard/timeseries   Get issue counts over time for a given range (1w, 1m, 3m, 6m)
 */

import { NextResponse } from 'next/server';
import { getTimeSeriesData, type TimeRange } from '@/lib/db/dashboard';

const VALID_RANGES: TimeRange[] = ['6m', '3m', '1m', '1w'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range') ?? '6m';

    if (!VALID_RANGES.includes(rangeParam as TimeRange)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid range. Must be one of: ${VALID_RANGES.join(', ')}`,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const data = await getTimeSeriesData(rangeParam as TimeRange);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch time series data', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
