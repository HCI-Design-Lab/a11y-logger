// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateReportDocx } from '../report-docx';
import type { Report } from '@/lib/db/reports';
import type { Project } from '@/lib/db/projects';

const mockProject: Project = {
  id: 'p1',
  name: 'Test Project',
  description: null,
  product_url: null,
  status: 'active',
  settings: '{}',
  created_by: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function makeReport(content: object): Report {
  return {
    id: 'r1',
    type: 'detailed',
    title: 'Test Report',
    status: 'draft',
    content: JSON.stringify(content),
    template_id: null,
    ai_generated: 0,
    created_by: null,
    published_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    assessment_ids: ['a1'],
  };
}

describe('generateReportDocx', () => {
  it('returns a non-empty Buffer', async () => {
    const report = makeReport({ executive_summary: { body: '<p>Summary text</p>' } });
    const buffer = await generateReportDocx(report, mockProject);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('output is a valid DOCX file (PK signature)', async () => {
    const report = makeReport({});
    const buffer = await generateReportDocx(report, mockProject);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('works with an empty content object', async () => {
    const report = makeReport({});
    const buffer = await generateReportDocx(report, mockProject);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('works with all content sections populated', async () => {
    const report = makeReport({
      executive_summary: { body: '<p>Summary</p>' },
      top_risks: { items: ['Risk A', 'Risk B'] },
      quick_wins: { items: ['Win A'] },
      user_impact: {
        screen_reader: 'Good',
        low_vision: 'Good',
        color_vision: 'Good',
        keyboard_only: 'Good',
        cognitive: 'Good',
        deaf_hard_of_hearing: 'Good',
      },
    });
    const buffer = await generateReportDocx(report, mockProject);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
