import { NextResponse } from 'next/server';
import { getCriteriaForEdition } from '@/lib/db/criteria';

const VALID_EDITIONS = ['WCAG', '508', 'EU', 'INT'] as const;
const VALID_WCAG_VERSIONS = ['2.0', '2.1', '2.2'] as const;
const VALID_WCAG_LEVELS = ['A', 'AA', 'AAA'] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const edition = searchParams.get('edition');
  const wcagVersionParam = searchParams.get('wcag_version') ?? '2.1';
  const wcagLevelParam = searchParams.get('wcag_level') ?? 'AA';
  const productScope = searchParams.get('product_scope')?.split(',') ?? ['web'];

  if (!edition || !(VALID_EDITIONS as readonly string[]).includes(edition)) {
    return NextResponse.json(
      { success: false, error: 'edition is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  if (!(VALID_WCAG_VERSIONS as readonly string[]).includes(wcagVersionParam)) {
    return NextResponse.json(
      { success: false, error: 'invalid wcag_version', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  if (!(VALID_WCAG_LEVELS as readonly string[]).includes(wcagLevelParam)) {
    return NextResponse.json(
      { success: false, error: 'invalid wcag_level', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const wcagVersion = wcagVersionParam as '2.0' | '2.1' | '2.2';
  const wcagLevel = wcagLevelParam as 'A' | 'AA' | 'AAA';

  try {
    const sections = await getCriteriaForEdition(
      edition as 'WCAG' | '508' | 'EU' | 'INT',
      productScope,
      wcagVersion,
      wcagLevel
    );
    const total = sections.reduce((n, s) => n + s.criteria.length, 0);
    return NextResponse.json({ success: true, data: { sections, total } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch criteria', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
