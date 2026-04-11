/**
 * AI Report Top Risks API — /api/ai/report/top-risks
 *
 * POST /api/ai/report/top-risks   Generate an AI top-risks section for a report
 */

import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { buildIssueContext } from '../_shared';
import { TOP_RISKS_SECTION } from '@/lib/ai/prompts';

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
    const raw = await ai.generateReportSection(context, TOP_RISKS_SECTION);
    const items = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => Boolean(line) && line.toLowerCase() !== 'top risks')
      .slice(0, 5);
    return NextResponse.json({ success: true, data: { items } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    return NextResponse.json({ success: false, error: message, code: 'AI_ERROR' }, { status: 500 });
  }
}
