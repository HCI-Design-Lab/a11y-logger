import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';

export async function POST() {
  const provider = getAIProvider();
  if (!provider) {
    return NextResponse.json(
      { success: false, error: 'No AI provider configured', code: 'NO_PROVIDER' },
      { status: 503 }
    );
  }
  try {
    const result = await provider.testConnection();
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, error: 'Connection test failed', code: 'AI_ERROR' }, { status: 500 });
  }
}
