/**
 * Dashboard Environment API — /api/dashboard/environment
 *
 * GET /api/dashboard/environment   Get issue counts broken down by environment
 */

import { NextResponse } from 'next/server';
import { getEnvironmentBreakdown } from '@/lib/db/dashboard';

export async function GET() {
  try {
    const data = await getEnvironmentBreakdown();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch environment breakdown', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
