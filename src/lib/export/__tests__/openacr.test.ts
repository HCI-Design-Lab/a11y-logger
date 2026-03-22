// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateOpenAcr, generateOpenAcrYaml } from '../openacr';
import type { Vpat } from '@/lib/db/vpats';
import type { Project } from '@/lib/db/projects';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

const mockVpat: Vpat = {
  id: 'v1',
  project_id: 'p1',
  title: 'WCAG 2.1 Conformance Report',
  description: null,
  standard_edition: 'WCAG',
  wcag_version: '2.1',
  wcag_level: 'AA',
  product_scope: ['web'],
  status: 'draft',
  version_number: 1,
  published_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const mockProject: Project = {
  id: 'p1',
  name: 'Test Project',
  description: null,
  product_url: 'https://example.com',
  status: 'active',
  settings: '{}',
  created_by: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const mockRows: VpatCriterionRow[] = [
  {
    id: 'r1',
    vpat_id: 'v1',
    criterion_id: 'c1',
    criterion_code: '1.1.1',
    criterion_name: 'Non-text Content',
    criterion_description: 'All non-text content...',
    criterion_level: 'A',
    criterion_section: 'Perceivable',
    conformance: 'supports',
    remarks: 'All images have alt text',
    ai_confidence: null,
    ai_reasoning: null,
    last_generated_at: null,
    updated_at: '2026-01-01T00:00:00.000Z',
    issue_count: 0,
  },
  {
    id: 'r2',
    vpat_id: 'v1',
    criterion_id: 'c2',
    criterion_code: '1.4.3',
    criterion_name: 'Contrast (Minimum)',
    criterion_description: 'Text contrast...',
    criterion_level: 'AA',
    criterion_section: 'Perceivable',
    conformance: 'partially_supports',
    remarks: 'Some low contrast areas',
    ai_confidence: null,
    ai_reasoning: null,
    last_generated_at: null,
    updated_at: '2026-01-01T00:00:00.000Z',
    issue_count: 2,
  },
];

describe('generateOpenAcr', () => {
  it('returns an object with all required top-level OpenACR fields', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('product');
    expect(result).toHaveProperty('author');
    expect(result).toHaveProperty('vendor');
    expect(result).toHaveProperty('report_date');
    expect(result).toHaveProperty('catalog');
    expect(result).toHaveProperty('notes');
    expect(result).toHaveProperty('evaluation_methods_used');
    expect(result).toHaveProperty('legal_disclaimer');
    expect(result).toHaveProperty('chapters');
  });

  it('sets product name from the project', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result.product.name).toBe('Test Project');
  });

  it('derives catalog from standard_edition and wcag_version', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result.catalog).toBe('2.4-edition-wcag-2.1-en');
  });

  it('uses 508 catalog when standard_edition is 508', () => {
    const result = generateOpenAcr({ ...mockVpat, standard_edition: '508' }, mockProject, mockRows);
    expect(result.catalog).toBe('2.4-edition-wcag-2.1-508-en');
  });

  it('groups criteria into chapters by level', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result.chapters).toHaveProperty('success_criteria_level_a');
    expect(result.chapters).toHaveProperty('success_criteria_level_aa');
    expect(result.chapters.success_criteria_level_a!.criteria).toHaveLength(1);
    expect(result.chapters.success_criteria_level_aa!.criteria).toHaveLength(1);
  });

  it('uses criterion code as num', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result.chapters.success_criteria_level_a!.criteria![0]!.num).toBe('1.1.1');
  });

  it('maps conformance values to hyphenated OpenACR format', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(
      result.chapters.success_criteria_level_a!.criteria![0]!.components[0]!.adherence.level
    ).toBe('supports');
    expect(
      result.chapters.success_criteria_level_aa!.criteria![0]!.components[0]!.adherence.level
    ).toBe('partially-supports');
  });

  it('preserves remarks in adherence notes', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(
      result.chapters.success_criteria_level_a!.criteria![0]!.components[0]!.adherence.notes
    ).toBe('All images have alt text');
  });

  it('works with empty criterion rows', () => {
    const result = generateOpenAcr(mockVpat, mockProject, []);
    expect(result.chapters.success_criteria_level_a).toBeUndefined();
  });

  it('includes email field on author and vendor', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result.author).toHaveProperty('email');
    expect(result.vendor).toHaveProperty('email');
  });
});

describe('generateOpenAcrYaml', () => {
  it('returns a non-empty YAML string', () => {
    const yaml = generateOpenAcrYaml(mockVpat, mockProject, mockRows);
    expect(typeof yaml).toBe('string');
    expect(yaml.length).toBeGreaterThan(0);
  });

  it('contains required YAML keys', () => {
    const yaml = generateOpenAcrYaml(mockVpat, mockProject, mockRows);
    expect(yaml).toContain('title:');
    expect(yaml).toContain('catalog:');
    expect(yaml).toContain('chapters:');
    expect(yaml).toContain('success_criteria_level_a:');
  });

  it('serializes report_date as a quoted string so YAML 1.1 parsers treat it as string not date', () => {
    const yaml = generateOpenAcrYaml(mockVpat, mockProject, mockRows);
    // Quoted form: report_date: "2026-03-22" — not unquoted bare scalar
    expect(yaml).toMatch(/report_date: "\d{4}-\d{2}-\d{2}"/);
  });
});
