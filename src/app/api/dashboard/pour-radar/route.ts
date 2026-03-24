import { NextResponse } from 'next/server';
import { getPourTotals } from '@/lib/db/dashboard';

export async function GET() {
  try {
    const data = await getPourTotals();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch POUR totals', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
