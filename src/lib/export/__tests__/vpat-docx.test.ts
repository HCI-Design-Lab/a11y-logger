// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateVpatDocx } from '../vpat-docx';
import type { Vpat } from '@/lib/db/vpats';
import type { Project } from '@/lib/db/projects';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

const mockVpat: Vpat = {
  id: 'v1',
  project_id: 'p1',
  title: 'Test VPAT',
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
  url: null,
  status: 'active',
  settings: null,
  assessment_count: 0,
  issue_count: 0,
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
];

describe('generateVpatDocx', () => {
  it('returns a non-empty Buffer', async () => {
    const buffer = await generateVpatDocx(mockVpat, mockProject, mockRows);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('output is a valid ZIP/DOCX file (starts with PK signature)', async () => {
    const buffer = await generateVpatDocx(mockVpat, mockProject, mockRows);
    // DOCX files are ZIP archives — PK\x03\x04
    expect(buffer[0]).toBe(0x50); // 'P'
    expect(buffer[1]).toBe(0x4b); // 'K'
  });

  it('works with empty criterion rows', async () => {
    const buffer = await generateVpatDocx(mockVpat, mockProject, []);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
