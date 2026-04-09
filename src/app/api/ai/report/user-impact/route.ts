/**
 * AI Report User Impact API — /api/ai/report/user-impact
 *
 * POST /api/ai/report/user-impact   Generate an AI user-impact section for a report
 */

import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { buildIssueContext } from '../_shared';
import { buildUserImpactPrompt } from '@/lib/ai/prompts';

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

  const EMPTY_IMPACT = {
    screen_reader: '',
    low_vision: '',
    color_vision: '',
    keyboard_only: '',
    cognitive: '',
    deaf_hard_of_hearing: '',
  };

  try {
    const raw = await ai.generateReportSection(buildUserImpactPrompt(context), 'User Impact');
    let data: Record<string, string>;
    try {
      data = { ...EMPTY_IMPACT, ...JSON.parse(raw) };
    } catch {
      data = { ...EMPTY_IMPACT };
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    return NextResponse.json({ success: false, error: message, code: 'AI_ERROR' }, { status: 500 });
  }
}
