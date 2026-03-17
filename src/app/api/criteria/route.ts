import { NextResponse } from 'next/server';
import { getCriteriaForEdition } from '@/lib/db/criteria';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const edition = searchParams.get('edition') as 'WCAG' | '508' | 'EU' | 'INT' | null;
  const wcagVersion = (searchParams.get('wcag_version') ?? '2.1') as '2.0' | '2.1' | '2.2';
  const wcagLevel = (searchParams.get('wcag_level') ?? 'AA') as 'A' | 'AA' | 'AAA';
  const productScope = searchParams.get('product_scope')?.split(',') ?? ['web'];

  if (!edition || !['WCAG', '508', 'EU', 'INT'].includes(edition)) {
    return NextResponse.json(
      { success: false, error: 'edition is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  try {
    const sections = getCriteriaForEdition(edition, productScope, wcagVersion, wcagLevel);
    const total = sections.reduce((n, s) => n + s.criteria.length, 0);
    return NextResponse.json({ success: true, data: { sections, total } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch criteria', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
