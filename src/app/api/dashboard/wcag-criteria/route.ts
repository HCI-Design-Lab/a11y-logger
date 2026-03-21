import { NextResponse } from 'next/server';
import { getWcagCriteriaCounts } from '@/lib/db/dashboard';
import { WCAG_PRINCIPLES, type WcagPrinciple } from '@/lib/wcag-criteria';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const principleParam = searchParams.get('principle') ?? 'perceivable';

    if (!WCAG_PRINCIPLES.includes(principleParam as WcagPrinciple)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid principle. Must be one of: ${WCAG_PRINCIPLES.join(', ')}`,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const data = await getWcagCriteriaCounts(principleParam as WcagPrinciple);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch WCAG criteria counts', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
