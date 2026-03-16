import { describe, it, expect } from 'vitest';
import { generateVpatDocx } from '../vpat-docx';
import type { Vpat } from '@/lib/db/vpats';

const mockVpat: Vpat = {
  id: 'v1',
  title: 'Test VPAT',
  wcag_version: '2.1',
  wcag_level: 'AA',
  status: 'draft',
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
      remarks: 'Most text meets contrast requirements.',
      related_issue_ids: [],
    },
  ],
  wcag_scope: [],
  version_number: 1,
  project_id: 'p1',
  ai_generated: 0,
  created_by: null,
  published_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockProject = {
  id: 'p1',
  name: 'My Product',
  description: 'A test product',
  product_url: null,
  status: 'active' as const,
  settings: '{}',
  created_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('generateVpatDocx', () => {
  it('returns a Buffer', async () => {
    const result = await generateVpatDocx(mockVpat, mockProject);
    expect(result).toBeInstanceOf(Buffer);
  });

  it('returns a non-empty buffer', async () => {
    const result = await generateVpatDocx(mockVpat, mockProject);
    expect(result.length).toBeGreaterThan(100);
  });
});
