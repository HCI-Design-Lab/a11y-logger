import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';

export async function POST(request: Request) {
  const ai = getAIProvider();
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

  const { title, description } = body as Record<string, unknown>;

  if (typeof title !== 'string' || !title.trim()) {
    return NextResponse.json(
      { success: false, error: 'title is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const plainText = description
    ? `Title: ${title}\nDescription: ${description}`
    : `Title: ${title}`;

  try {
    const result = await ai.analyzeIssue(plainText);
    return NextResponse.json({
      success: true,
      data: {
        codes: result.wcag_codes,
        confidence: result.confidence,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    return NextResponse.json({ success: false, error: message, code: 'AI_ERROR' }, { status: 500 });
  }
}
