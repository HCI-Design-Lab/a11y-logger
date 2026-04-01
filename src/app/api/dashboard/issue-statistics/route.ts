/**
 * Dashboard Issue Statistics API — /api/dashboard/issue-statistics
 *
 * GET /api/dashboard/issue-statistics   Get issue counts broken down by severity
 */

import { NextResponse } from 'next/server';
import { getSeverityBreakdown } from '@/lib/db/dashboard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('statuses');
    const statuses = statusParam ? statusParam.split(',').filter(Boolean) : ['open'];
    const projectId = searchParams.get('projectId') ?? undefined;
    const data = await getSeverityBreakdown(statuses, projectId);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
