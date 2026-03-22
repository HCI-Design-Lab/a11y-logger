// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateOpenAcr } from '../openacr';
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
    criterion_section: 'A',
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
    criterion_section: 'AA',
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
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('notes');
    expect(result).toHaveProperty('evaluation_methods_used');
    expect(result).toHaveProperty('legal_disclaimer');
    expect(result).toHaveProperty('standard_version');
    expect(result).toHaveProperty('report_items');
  });

  it('sets product name from the project', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result.product.name).toBe('Test Project');
  });

  it('derives standard_version from wcag_version', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result.standard_version).toBe('wcag-2.1');
  });

  it('converts criterion codes to OpenACR id format', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result.report_items[0]!.id).toBe('success-criterion-1-1-1');
    expect(result.report_items[1]!.id).toBe('success-criterion-1-4-3');
  });

  it('maps all conformance values to OpenACR display strings', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result.report_items[0]!.conformance_level).toBe('Supports');
    expect(result.report_items[1]!.conformance_level).toBe('Partially Supports');
  });

  it('includes one report_item per criterion row', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result.report_items).toHaveLength(2);
  });

  it('preserves remarks in report items', () => {
    const result = generateOpenAcr(mockVpat, mockProject, mockRows);
    expect(result.report_items[0]!.remarks).toBe('All images have alt text');
  });

  it('works with empty criterion rows', () => {
    const result = generateOpenAcr(mockVpat, mockProject, []);
    expect(result.report_items).toHaveLength(0);
  });
});
