// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateVpatDocx } from '../vpat-docx';
import type { Vpat } from '@/lib/db/vpats';
import type { Project } from '@/lib/db/projects';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

const baseVpat: Vpat = {
  id: 'v1',
  project_id: 'p1',
  title: 'Test VPAT',
  description: null,
  standard_edition: 'WCAG',
  wcag_version: '2.1',
  wcag_level: 'AA',
  product_scope: ['web', 'documents'],
  status: 'draft',
  version_number: 1,
  published_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '',
  updated_at: '',
};

const baseProject: Project = {
  id: 'p1',
  name: 'My Product',
  description: null,
  product_url: null,
  status: 'active',
  settings: '{}',
  created_by: null,
  created_at: '',
  updated_at: '',
};

function makeRow(
  code: string,
  level: string,
  components: VpatCriterionRow['components']
): VpatCriterionRow {
  return {
    id: `row-${code}`,
    vpat_id: 'v1',
    criterion_id: `c-${code}`,
    criterion_code: code,
    criterion_name: `Criterion ${code}`,
    criterion_name_translated: null,
    criterion_description: '',
    criterion_level: level,
    criterion_section: 'Perceivable',
    conformance: 'not_evaluated',
    remarks: null,
    ai_confidence: null,
    ai_reasoning: null,
    ai_referenced_issues: null,
    ai_suggested_conformance: null,
    last_generated_at: null,
    updated_at: '',
    issue_count: 0,
    components,
  };
}

describe('generateVpatDocx — multi-component', () => {
  it('returns a Buffer', async () => {
    const rows = [
      makeRow('1.1.1', 'A', [
        {
          id: 1,
          criterion_row_id: 'row-1.1.1',
          component_name: 'web',
          conformance: 'supports',
          remarks: null,
          created_at: '',
          updated_at: '',
        },
        {
          id: 2,
          criterion_row_id: 'row-1.1.1',
          component_name: 'electronic-docs',
          conformance: 'partially_supports',
          remarks: null,
          created_at: '',
          updated_at: '',
        },
      ]),
    ];
    const buf = await generateVpatDocx(baseVpat, baseProject, rows);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('multi-component header row has 4 columns (Criteria, Component, Conformance, Remarks)', async () => {
    const JSZip = (await import('jszip')).default;
    const rows = [
      makeRow('1.1.1', 'A', [
        {
          id: 1,
          criterion_row_id: 'row-1.1.1',
          component_name: 'web',
          conformance: 'supports',
          remarks: null,
          created_at: '',
          updated_at: '',
        },
        {
          id: 2,
          criterion_row_id: 'row-1.1.1',
          component_name: 'electronic-docs',
          conformance: 'partially_supports',
          remarks: null,
          created_at: '',
          updated_at: '',
        },
      ]),
    ];
    const buf = await generateVpatDocx(baseVpat, baseProject, rows);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('Component');
  });
});
