/**
 * VPAT Import API — /api/vpats/import
 *
 * POST /api/vpats/import   Import a VPAT from an OpenACR YAML file
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import jsYaml from 'js-yaml';
import { getProject } from '@/lib/db/projects';
import { importVpatFromOpenAcr } from '@/lib/db/vpats';
import { getCriteriaByCode } from '@/lib/db/criteria';
import { parseOpenAcr } from '@/lib/import/parse-openacr';

const ImportRequestSchema = z.object({
  projectId: z.string().min(1),
  yaml: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const result = ImportRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { projectId, yaml } = result.data;

    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    let parsed: unknown;
    try {
      parsed = jsYaml.load(yaml);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid YAML', code: 'PARSE_ERROR' },
        { status: 400 }
      );
    }

    const openacr = parseOpenAcr(parsed);
    if (!openacr) {
      return NextResponse.json(
        {
          success: false,
          error: 'File does not appear to be a valid OpenACR YAML',
          code: 'INVALID_FORMAT',
        },
        { status: 400 }
      );
    }

    const codes = openacr.criteria.map((c) => c.code);
    const codeMap = await getCriteriaByCode(codes);

    const skipped: string[] = [];
    const rows: Array<{
      criterion_id: string;
      conformance:
        | 'supports'
        | 'partially_supports'
        | 'does_not_support'
        | 'not_applicable'
        | 'not_evaluated';
      remarks: string | null;
      components?: Array<{ component_name: string; conformance: string; remarks?: string | null }>;
    }> = [];

    for (const criterion of openacr.criteria) {
      const criterionId = codeMap.get(criterion.code);
      if (!criterionId) {
        skipped.push(criterion.code);
        continue;
      }
      rows.push({
        criterion_id: criterionId,
        conformance: criterion.conformance,
        remarks: criterion.remarks,
        components: criterion.components,
      });
    }

    const vpat = await importVpatFromOpenAcr({
      project_id: projectId,
      title: openacr.title,
      description: openacr.description,
      standard_edition: openacr.standard_edition,
      wcag_version: openacr.wcag_version,
      wcag_level: openacr.wcag_level,
      rows,
    });

    return NextResponse.json({ success: true, data: { id: vpat.id, skipped } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
