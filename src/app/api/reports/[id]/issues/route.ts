/**
 * Report Issues API — /api/reports/[id]/issues
 *
 * GET /api/reports/[id]/issues   List all issues included in a report
 */

import { NextResponse } from 'next/server';
import { getReport, getReportIssues } from '@/lib/db/reports';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const report = await getReport(id);
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    const issues = await getReportIssues(id);
    return NextResponse.json({ success: true, data: issues });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issues', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
