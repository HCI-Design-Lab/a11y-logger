/**
 * Dashboard Repeat Offenders API — /api/dashboard/repeat-offenders
 *
 * GET /api/dashboard/repeat-offenders   Get WCAG criteria with the highest issue counts
 */

import { NextResponse } from 'next/server';
import { getRepeatOffenders } from '@/lib/db/dashboard';

export async function GET() {
  try {
    const data = await getRepeatOffenders();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch repeat offenders', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
