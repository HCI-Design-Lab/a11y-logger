// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateVpatHtml } from '../vpat-template';
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

describe('generateVpatHtml — multi-component', () => {
  it('includes Component column header when VPAT has >1 component per row', () => {
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
    const html = generateVpatHtml(baseVpat, baseProject, rows);
    expect(html).toMatch(/<th[^>]*>\s*Component\s*<\/th>/i);
  });

  it('renders sub-rows for each component when multi-component', () => {
    const rows = [
      makeRow('1.1.1', 'A', [
        {
          id: 1,
          criterion_row_id: 'row-1.1.1',
          component_name: 'web',
          conformance: 'supports',
          remarks: 'OK',
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
    const html = generateVpatHtml(baseVpat, baseProject, rows);
    expect(html).toContain('web');
    expect(html).toContain('electronic-docs');
    expect(html).toContain('Partially Supports');
  });

  it('does NOT include Component column for single-component (web-only) VPAT', () => {
    const webOnlyVpat = { ...baseVpat, product_scope: ['web'] };
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
      ]),
    ];
    const html = generateVpatHtml(webOnlyVpat, baseProject, rows);
    expect(html).not.toMatch(/<th[^>]*>\s*Component\s*<\/th>/i);
  });
});
