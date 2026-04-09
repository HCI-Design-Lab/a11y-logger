// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateOpenAcr } from '../openacr';
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

describe('generateOpenAcr — multi-component', () => {
  it('builds components array from VpatCriterionComponent rows', () => {
    const rows: VpatCriterionRow[] = [
      makeRow('1.1.1', 'A', [
        {
          id: 1,
          criterion_row_id: 'row-1.1.1',
          component_name: 'web',
          conformance: 'supports',
          remarks: 'Full support',
          created_at: '',
          updated_at: '',
        },
        {
          id: 2,
          criterion_row_id: 'row-1.1.1',
          component_name: 'electronic-docs',
          conformance: 'partially_supports',
          remarks: 'Missing alt',
          created_at: '',
          updated_at: '',
        },
      ]),
    ];
    const report = generateOpenAcr(baseVpat, baseProject, rows);
    const crit = report.chapters['success_criteria_level_a']!.criteria![0]!;
    expect(crit.num).toBe('1.1.1');
    expect(crit.components).toHaveLength(2);
    const web = crit.components.find((c) => c.name === 'web')!;
    expect(web.adherence.level).toBe('supports');
    expect(web.adherence.notes).toBe('Full support');
    const docs = crit.components.find((c) => c.name === 'electronic-docs')!;
    expect(docs.adherence.level).toBe('partially-supports');
    expect(docs.adherence.notes).toBe('Missing alt');
  });

  it('falls back to single web component when components array is empty', () => {
    const rows: VpatCriterionRow[] = [makeRow('1.1.1', 'A', [])];
    const report = generateOpenAcr(baseVpat, baseProject, rows);
    const crit = report.chapters['success_criteria_level_a']!.criteria![0]!;
    expect(crit.components).toHaveLength(1);
    expect(crit.components[0]!.name).toBe('web');
  });

  it('omits hardware chapter when product scope does not include hardware', () => {
    const report = generateOpenAcr(baseVpat, baseProject, []);
    expect(report.chapters['hardware']).toBeUndefined();
  });

  it('omits software chapter when product scope does not include software', () => {
    const report = generateOpenAcr(baseVpat, baseProject, []);
    expect(report.chapters['software']).toBeUndefined();
  });

  it('includes hardware chapter when product scope includes hardware', () => {
    const vpat = { ...baseVpat, product_scope: ['web', 'hardware'] };
    const report = generateOpenAcr(vpat, baseProject, []);
    expect(report.chapters['hardware']).toBeDefined();
  });

  it('includes software chapter when product scope includes software-desktop', () => {
    const vpat = { ...baseVpat, product_scope: ['web', 'software-desktop'] };
    const report = generateOpenAcr(vpat, baseProject, []);
    expect(report.chapters['software']).toBeDefined();
  });

  it('includes software chapter when product scope includes software-mobile', () => {
    const vpat = { ...baseVpat, product_scope: ['software-mobile'] };
    const report = generateOpenAcr(vpat, baseProject, []);
    expect(report.chapters['software']).toBeDefined();
  });
});
