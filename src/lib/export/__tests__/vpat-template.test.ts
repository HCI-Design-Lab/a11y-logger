import { describe, it, expect } from 'vitest';
import { generateVpatHtml } from '../vpat-template';
import type { Vpat } from '@/lib/db/vpats';
import type { Project } from '@/lib/db/projects';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

const mockProject: Project = {
  id: 'project-1',
  name: 'Acme Corp Website',
  description: 'Main corporate website',
  product_url: 'https://acme.example.com',
  status: 'active',
  settings: '{}',
  created_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockVpat: Vpat = {
  id: 'vpat-1',
  project_id: 'project-1',
  title: 'WCAG 2.1 Conformance Report',
  description: null,
  standard_edition: 'WCAG',
  wcag_version: '2.1',
  wcag_level: 'AA',
  product_scope: ['web'],
  status: 'published',
  version_number: 2,
  published_at: '2024-03-01T00:00:00Z',
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2024-02-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
};

const makeRow = (overrides: Partial<VpatCriterionRow> = {}): VpatCriterionRow => ({
  id: '1',
  vpat_id: 'vpat-1',
  criterion_id: 'c1',
  criterion_code: '1.1.1',
  criterion_name: 'Non-text Content',
  criterion_name_translated: null,
  criterion_description: 'All non-text content has a text alternative.',
  criterion_level: 'A',
  criterion_section: 'A',
  conformance: 'supports',
  remarks: 'All images have alt text.',
  ai_confidence: null,
  ai_reasoning: null,
  ai_referenced_issues: null,
  ai_suggested_conformance: null,
  last_generated_at: null,
  updated_at: '2026-01-01',
  issue_count: 0,
  ...overrides,
});

const mockRows: VpatCriterionRow[] = [
  makeRow({
    id: '1',
    criterion_id: 'c1',
    criterion_code: '1.1.1',
    criterion_name: 'Non-text Content',
    criterion_name_translated: null,
    criterion_level: 'A',
    criterion_section: 'A',
    conformance: 'supports',
    remarks: 'All images have alt text.',
  }),
  makeRow({
    id: '2',
    criterion_id: 'c2',
    criterion_code: '1.4.3',
    criterion_name: 'Contrast (Minimum)',
    criterion_name_translated: null,
    criterion_level: 'AA',
    criterion_section: 'AA',
    conformance: 'partially_supports',
    remarks: 'Some text has insufficient contrast.',
  }),
  makeRow({
    id: '3',
    criterion_id: 'c3',
    criterion_code: '2.1.1',
    criterion_name: 'Keyboard',
    criterion_name_translated: null,
    criterion_level: 'A',
    criterion_section: 'A',
    conformance: 'does_not_support',
    remarks: 'Custom dropdown is not keyboard accessible.',
  }),
];

describe('generateVpatHtml', () => {
  it('returns a string', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(typeof result).toBe('string');
  });

  it('contains the VPAT title', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('WCAG 2.1 Conformance Report');
  });

  it('contains the project name', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('Acme Corp Website');
  });

  it('is a complete HTML document with doctype', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html');
    expect(result).toContain('</html>');
  });

  it('includes a criteria table', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('<table');
    expect(result).toContain('</table>');
  });

  it('includes criterion codes in the table', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('1.1.1');
    expect(result).toContain('1.4.3');
    expect(result).toContain('2.1.1');
  });

  it('includes conformance values in the table', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('Supports');
    expect(result).toContain('Partially Supports');
    expect(result).toContain('Does Not Support');
  });

  it('includes remarks in the table', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('All images have alt text.');
    expect(result).toContain('Some text has insufficient contrast.');
    expect(result).toContain('Custom dropdown is not keyboard accessible.');
  });

  it('includes print CSS media query', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('@media print');
  });

  it('includes semantic heading structure', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('<h1');
  });

  it('includes the version number', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('v2');
  });

  it('includes the VPAT status', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('published');
  });

  it('includes no external dependencies (standalone document)', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).not.toMatch(/<link[^>]+href="https?:/);
    expect(result).not.toMatch(/<script[^>]+src="https?:/);
  });

  it('handles empty rows gracefully', () => {
    const result = generateVpatHtml(mockVpat, mockProject, []);
    expect(typeof result).toBe('string');
    expect(result).toContain('WCAG 2.1 Conformance Report');
    expect(result).toContain('No criteria');
  });

  it('includes table header columns', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('<th');
    expect(result.toLowerCase()).toContain('criterion');
    expect(result.toLowerCase()).toContain('conformance');
  });

  it('escapes HTML-special characters in the VPAT title', () => {
    const xssVpat = { ...mockVpat, title: '<script>alert("xss")</script>' };
    const result = generateVpatHtml(xssVpat, mockProject, mockRows);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('shows rows.length in the Criteria meta-pair', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('3');
  });

  it('groups rows by section and renders section labels', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).toContain('Table 1: Success Criteria, Level A');
    expect(result).toContain('Table 2: Success Criteria, Level AA');
  });
});

describe('generateVpatHtml — cover sheet', () => {
  const mockCoverSheet = {
    id: 'cs-1',
    vpat_id: 'vpat-1',
    product_name: 'Acme App',
    product_version: '2.0',
    product_description: 'A great product',
    vendor_company: 'Acme Corp',
    vendor_contact_name: 'Jane Doe',
    vendor_contact_email: 'jane@acme.com',
    vendor_contact_phone: '+1 555 000 0000',
    vendor_website: 'https://acme.com',
    report_date: '2026-04-08',
    evaluation_methods: 'Manual and automated testing',
    notes: 'Some notes here',
    created_at: '2026-04-08T00:00:00Z',
    updated_at: '2026-04-08T00:00:00Z',
  };

  it('renders Cover Sheet section when coverSheet is provided', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows, mockCoverSheet);
    expect(result).toContain('Cover Sheet');
    expect(result).toContain('Acme App');
    expect(result).toContain('Acme Corp');
  });

  it('renders all populated cover sheet fields', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows, mockCoverSheet);
    expect(result).toContain('Jane Doe');
    expect(result).toContain('jane@acme.com');
    expect(result).toContain('+1 555 000 0000');
    expect(result).toContain('https://acme.com');
    expect(result).toContain('2026-04-08');
    expect(result).toContain('Manual and automated testing');
    expect(result).toContain('Some notes here');
  });

  it('omits cover sheet section when coverSheet is null', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows, null);
    expect(result).not.toContain('Cover Sheet');
  });

  it('omits cover sheet section when coverSheet is undefined', () => {
    const result = generateVpatHtml(mockVpat, mockProject, mockRows);
    expect(result).not.toContain('Cover Sheet');
  });

  it('skips null fields in the cover sheet table', () => {
    const partial = {
      ...mockCoverSheet,
      vendor_contact_phone: null,
      vendor_website: null,
      notes: null,
    };
    const result = generateVpatHtml(mockVpat, mockProject, mockRows, partial);
    expect(result).toContain('Acme App');
    expect(result).not.toContain('+1 555 000 0000');
  });

  it('escapes HTML in cover sheet fields', () => {
    const xss = { ...mockCoverSheet, product_name: '<script>alert("xss")</script>' };
    const result = generateVpatHtml(mockVpat, mockProject, mockRows, xss);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});
