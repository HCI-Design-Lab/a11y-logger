/**
 * AI Generate Issue API — /api/ai/generate-issue
 *
 * POST /api/ai/generate-issue   Generate or improve an issue description using AI
 */

import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';

interface CurrentFields {
  title?: string | null;
  description?: string | null;
  severity?: string | null;
  user_impact?: string | null;
  suggested_fix?: string | null;
  wcag_codes?: string[];
  section_508_codes?: string[];
  eu_codes?: string[];
}

export async function POST(request: Request) {
  const ai = getAIProvider('issues');
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

  const { ai_description, current = {} } = body as {
    ai_description?: unknown;
    current?: CurrentFields;
  };

  if (typeof ai_description !== 'string' || !ai_description.trim()) {
    return NextResponse.json(
      { success: false, error: 'ai_description is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  try {
    const result = await ai.analyzeIssue(ai_description);

    const isEmpty = (val: string | null | undefined) => !val || !val.trim();
    const emptyArray = (val: string[] | undefined) => !val || val.length === 0;

    return NextResponse.json({
      success: true,
      data: {
        title: isEmpty(current.title) ? result.title : null,
        description: isEmpty(current.description) ? result.description : null,
        severity: isEmpty(current.severity) ? result.severity : null,
        user_impact: isEmpty(current.user_impact) ? result.user_impact : null,
        suggested_fix: isEmpty(current.suggested_fix) ? result.suggested_fix : null,
        wcag_codes: emptyArray(current.wcag_codes) ? result.wcag_codes : null,
        section_508_codes: emptyArray(current.section_508_codes) ? result.section_508_codes : null,
        eu_codes: emptyArray(current.eu_codes) ? result.eu_codes : null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    return NextResponse.json({ success: false, error: message, code: 'AI_ERROR' }, { status: 500 });
  }
}
