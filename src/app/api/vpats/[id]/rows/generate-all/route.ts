/**
 * VPAT Generate All Rows API — /api/vpats/[id]/rows/generate-all
 *
 * POST /api/vpats/[id]/rows/generate-all   Generate AI narratives for all unevaluated criterion rows
 */

import { NextResponse } from 'next/server';
import { getCriterionRows, updateCriterionRow } from '@/lib/db/vpat-criterion-rows';
import { getVpat } from '@/lib/db/vpats';
import { getDb } from '@/lib/db';
import { getSetting } from '@/lib/db/settings';
import { getAIProvider } from '@/lib/ai';
import type { VpatGenerationContext, VpatRowGenerationResult } from '@/lib/ai';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id: vpatId } = await params;

  const ai = getAIProvider('vpat');
  if (!ai) {
    return NextResponse.json(
      { success: false, error: 'No AI provider configured', code: 'NO_AI_PROVIDER' },
      { status: 422 }
    );
  }

  const vpat = await getVpat(vpatId);
  if (!vpat)
    return NextResponse.json(
      { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
      { status: 404 }
    );

  const allRows = await getCriterionRows(vpatId);
  const rows = allRows.filter((r) => !r.remarks);

  const reviewEnabled = getSetting('ai_review_pass_enabled');
  const reviewer = reviewEnabled ? getAIProvider('vpat_review') : null;

  let generated = 0;
  const errors: string[] = [];

  const stmt = getDb().prepare(`
    SELECT i.id, i.assessment_id, i.title, i.severity, i.url, i.description
    FROM issues i JOIN assessments a ON i.assessment_id = a.id
    WHERE a.project_id = ? AND i.status = 'open'
      AND EXISTS (SELECT 1 FROM json_each(i.wcag_codes) WHERE value = ?)
  `);

  for (const row of rows) {
    const issues = stmt.all(vpat.project_id, row.criterion_code) as {
      id: string;
      assessment_id: string;
      title: string;
      severity: string;
      url: string;
      description: string;
    }[];

    const context: VpatGenerationContext = {
      criterion: {
        code: row.criterion_code,
        name: row.criterion_name,
        description: row.criterion_description,
      },
      issues,
    };

    try {
      let result: VpatRowGenerationResult = await ai.generateVpatRow(context);

      if (reviewer) {
        result = await reviewer.reviewVpatRow(context, result);
      }

      await updateCriterionRow(row.id, {
        remarks: result.remarks,
        ai_confidence: result.confidence,
        ai_reasoning: result.reasoning,
        ai_referenced_issues: result.referenced_issues,
        ai_suggested_conformance: result.suggested_conformance,
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
