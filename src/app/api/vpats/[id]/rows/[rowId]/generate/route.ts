import { NextResponse } from 'next/server';
import { getCriterionRow, updateCriterionRow } from '@/lib/db/vpat-criterion-rows';
import { getVpat } from '@/lib/db/vpats';
import { getDb } from '@/lib/db';
import { getAIProvider } from '@/lib/ai';

type RouteContext = { params: Promise<{ id: string; rowId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id: vpatId, rowId } = await params;

  const ai = getAIProvider();
  if (!ai) {
    return NextResponse.json(
      { success: false, error: 'No AI provider configured', code: 'NO_AI_PROVIDER' },
      { status: 422 }
    );
  }

  const row = await getCriterionRow(rowId);
  if (!row || row.vpat_id !== vpatId)
    return NextResponse.json(
      { success: false, error: 'Row not found', code: 'NOT_FOUND' },
      { status: 404 }
    );

  const vpat = await getVpat(vpatId);
  if (!vpat)
    return NextResponse.json(
      { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
      { status: 404 }
    );

  // Fetch issues matched to this criterion from the associated project
  const issues = getDb()
    .prepare(
      `
    SELECT i.title, i.severity, i.url, i.description
    FROM issues i
    JOIN assessments a ON i.assessment_id = a.id
    WHERE a.project_id = ?
      AND i.status = 'open'
      AND EXISTS (
        SELECT 1 FROM json_each(i.wcag_codes) WHERE value = ?
      )
  `
    )
    .all(vpat.project_id, row.criterion_code) as {
    title: string;
    severity: string;
    url: string;
    description: string;
  }[];

  try {
    const result = await ai.generateVpatRow({
      criterion: {
        code: row.criterion_code,
        name: row.criterion_name,
        description: row.criterion_description,
      },
      issues,
    });

    const updated = await updateCriterionRow(rowId, {
      remarks: result.remarks,
      ai_confidence: result.confidence,
      ai_reasoning: result.reasoning,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'AI generation failed', code: 'AI_ERROR' },
      { status: 500 }
    );
  }
}
