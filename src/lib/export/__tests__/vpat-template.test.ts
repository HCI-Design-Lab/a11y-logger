import { describe, it, expect } from 'vitest';
import { generateVpatHtml } from '../vpat-template';
import type { Vpat } from '@/lib/db/vpats';
import type { Project } from '@/lib/db/projects';

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
  status: 'published',
  version_number: 2,
  wcag_version: '2.1',
  wcag_level: 'AA',
  wcag_scope: ['1.1.1', '1.4.3', '2.1.1'],
  criteria_rows: [
    {
      criterion_code: '1.1.1',
      conformance: 'supports',
      remarks: 'All images have alt text.',
      related_issue_ids: [],
    },
    {
      criterion_code: '1.4.3',
      conformance: 'partially_supports',
      remarks: 'Some text has insufficient contrast.',
      related_issue_ids: [],
    },
    {
      criterion_code: '2.1.1',
      conformance: 'does_not_support',
      remarks: 'Custom dropdown is not keyboard accessible.',
      related_issue_ids: [],
    },
  ],
  ai_generated: 0,
  created_by: null,
  published_at: '2024-03-01T00:00:00Z',
  created_at: '2024-02-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
};

describe('generateVpatHtml', () => {
  it('returns a string', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(typeof result).toBe('string');
  });

  it('contains the VPAT title', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).toContain('WCAG 2.1 Conformance Report');
  });

  it('contains the project name', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).toContain('Acme Corp Website');
  });

  it('is a complete HTML document with doctype', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html');
    expect(result).toContain('</html>');
  });

  it('includes a criteria table', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).toContain('<table');
    expect(result).toContain('</table>');
  });

  it('includes criterion codes in the table', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).toContain('1.1.1');
    expect(result).toContain('1.4.3');
    expect(result).toContain('2.1.1');
  });

  it('includes conformance values in the table', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    // Conformance display values
    expect(result).toContain('Supports');
    expect(result).toContain('Partially Supports');
    expect(result).toContain('Does Not Support');
  });

  it('includes remarks in the table', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).toContain('All images have alt text.');
    expect(result).toContain('Some text has insufficient contrast.');
    expect(result).toContain('Custom dropdown is not keyboard accessible.');
  });

  it('includes print CSS media query', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).toContain('@media print');
  });

  it('includes semantic heading structure', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).toContain('<h1');
  });

  it('includes the version number', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).toContain('v2');
  });

  it('includes the VPAT status', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).toContain('published');
  });

  it('includes no external dependencies (standalone document)', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).not.toMatch(/<link[^>]+href="https?:/);
    expect(result).not.toMatch(/<script[^>]+src="https?:/);
  });

  it('handles a VPAT with no criteria_rows gracefully', () => {
    const emptyVpat: Vpat = { ...mockVpat, criteria_rows: [] };
    const result = generateVpatHtml(emptyVpat, mockProject);
    expect(typeof result).toBe('string');
    expect(result).toContain('WCAG 2.1 Conformance Report');
  });

  it('includes table header columns', () => {
    const result = generateVpatHtml(mockVpat, mockProject);
    expect(result).toContain('<th');
    // Criteria column header
    expect(result.toLowerCase()).toContain('criterion');
    // Conformance column header
    expect(result.toLowerCase()).toContain('conformance');
  });

  it('escapes HTML-special characters in the VPAT title', () => {
    const xssVpat = { ...mockVpat, title: '<script>alert("xss")</script>' };
    const result = generateVpatHtml(xssVpat, mockProject);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});
