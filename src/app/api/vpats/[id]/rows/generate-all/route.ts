import { NextResponse } from 'next/server';
import { getCriterionRows, updateCriterionRow } from '@/lib/db/vpat-criterion-rows';
import { getVpat } from '@/lib/db/vpats';
import { getDb } from '@/lib/db';
import { getAIProvider } from '@/lib/ai';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id: vpatId } = await params;

  const ai = getAIProvider();
  if (!ai) {
    return NextResponse.json(
      { success: false, error: 'No AI provider configured', code: 'NO_AI_PROVIDER' },
      { status: 422 }
    );
  }

  const vpat = getVpat(vpatId);
  if (!vpat)
    return NextResponse.json(
      { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
      { status: 404 }
    );

  // Skip rows that already have remarks text
  const allRows = getCriterionRows(vpatId);
  const rows = allRows.filter((r) => !r.remarks);

  let generated = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const issues = getDb()
      .prepare(
        `
      SELECT i.title, i.severity, i.url, i.description
      FROM issues i JOIN assessments a ON i.assessment_id = a.id
      WHERE a.project_id = ? AND i.status = 'open'
        AND EXISTS (SELECT 1 FROM json_each(i.wcag_codes) WHERE value = ?)
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
      updateCriterionRow(row.id, {
        remarks: result.remarks,
        ai_confidence: result.confidence,
        ai_reasoning: result.reasoning,
      });
      generated++;
    } catch {
      errors.push(row.criterion_code);
    }
  }

  return NextResponse.json({
    success: true,
    data: { generated, skipped: allRows.length - rows.length, errors },
  });
}
