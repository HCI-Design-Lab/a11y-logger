// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { GET } from '../route';

vi.mock('@/lib/export/vpat-docx', () => ({
  generateVpatDocx: vi.fn().mockResolvedValue(Buffer.from('fake-docx')),
}));

let vpatId: string;

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test Project' });
  const vpat = createVpat({
    title: 'WCAG 2.1 Conformance Report',
    project_id: project.id,
    wcag_scope: [],
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
        remarks: null,
        related_issue_ids: [],
      },
    ],
  });
  vpatId = vpat.id;
});

describe('GET /api/vpats/[id]/export', () => {
  describe('HTML export (?format=html)', () => {
    it('returns 200 with text/html content type', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=html`),
        makeContext(vpatId)
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');
    });

    it('returns HTML containing the VPAT title', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=html`),
        makeContext(vpatId)
      );
      const text = await response.text();
      expect(text).toContain('WCAG 2.1 Conformance Report');
    });

    it('returns HTML containing the project name', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=html`),
        makeContext(vpatId)
      );
      const text = await response.text();
      expect(text).toContain('Test Project');
    });

    it('returns HTML with the criteria table', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=html`),
        makeContext(vpatId)
      );
      const text = await response.text();
      expect(text).toContain('<table');
      expect(text).toContain('1.1.1');
      expect(text).toContain('1.4.3');
    });

    it('includes Content-Disposition header for download', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=html`),
        makeContext(vpatId)
      );
      const disposition = response.headers.get('Content-Disposition');
      expect(disposition).toBeTruthy();
      expect(disposition).toContain('attachment');
      expect(disposition).toContain('.html');
    });

    it('defaults to html format when no format param is provided', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export`),
        makeContext(vpatId)
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');
    });
  });

  describe('PDF export (?format=pdf)', () => {
    it('returns html with auto-print for format=pdf', async () => {
      const req = new Request(`http://localhost/api/vpats/${vpatId}/export?format=pdf`);
      const res = await GET(req, makeContext(vpatId));
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
      const text = await res.text();
      expect(text).toContain('window.print()');
    });
  });

  describe('DOCX export (?format=docx)', () => {
    it('returns 200 with correct content-type for docx format', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=docx`),
        makeContext(vpatId)
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('wordprocessingml');
    });

    it('includes Content-Disposition header for docx download', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=docx`),
        makeContext(vpatId)
      );
      const disposition = response.headers.get('Content-Disposition');
      expect(disposition).toBeTruthy();
      expect(disposition).toContain('attachment');
      expect(disposition).toContain('.docx');
    });
  });

  describe('Error cases', () => {
    it('returns 404 for a nonexistent VPAT', async () => {
      const response = await GET(
        new Request('http://localhost/api/vpats/nonexistent/export?format=html'),
        makeContext('nonexistent')
      );
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe('NOT_FOUND');
    });

    it('returns 400 for an unsupported format', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=csv`),
        makeContext(vpatId)
      );
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe('BAD_REQUEST');
    });
  });
});
