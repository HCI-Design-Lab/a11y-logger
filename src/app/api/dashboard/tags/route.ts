import { NextResponse } from 'next/server';
import { getTagFrequency } from '@/lib/db/dashboard';

export async function GET() {
  try {
    const data = await getTagFrequency();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tag frequency', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
