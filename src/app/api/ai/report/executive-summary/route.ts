/**
 * AI Report Executive Summary API — /api/ai/report/executive-summary
 *
 * POST /api/ai/report/executive-summary   Generate an AI executive summary for a report
 */

import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { buildIssueContext } from '../_shared';

export async function POST(request: Request) {
  const ai = getAIProvider('reports');
  if (!ai) {
    return NextResponse.json(
      { success: false, error: 'AI not configured', code: 'AI_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { reportId } = body as Record<string, unknown>;
  if (typeof reportId !== 'string' || !reportId.trim()) {
    return NextResponse.json(
      { success: false, error: 'reportId is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { report, context } = await buildIssueContext(reportId);
  if (!report) {
    return NextResponse.json(
      { success: false, error: 'Report not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  try {
    const generatedBody = await ai.generateExecutiveSummaryHtml(context);
    return NextResponse.json({ success: true, data: { body: generatedBody } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    return NextResponse.json({ success: false, error: message, code: 'AI_ERROR' }, { status: 500 });
  }
}
