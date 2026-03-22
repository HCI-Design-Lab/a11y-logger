// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { GET } from '../route';

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

beforeEach(async () => {
  getDb().prepare('DELETE FROM vpat_criterion_rows').run();
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'Test Project' });
  const vpat = await createVpat({
    title: 'WCAG 2.1 Conformance Report',
    project_id: project.id,
    standard_edition: 'WCAG',
    wcag_version: '2.1',
    wcag_level: 'AA',
    product_scope: ['web'],
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

    it('defaults to html when no format param provided', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export`),
        makeContext(vpatId)
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');
    });

    it('returns a complete HTML document', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=html`),
        makeContext(vpatId)
      );
      const text = await response.text();
      expect(text).toContain('<!DOCTYPE html>');
      expect(text).toContain('<html');
    });
  });

  describe('PDF export (?format=pdf)', () => {
    it('returns 501 since Puppeteer is not available', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=pdf`),
        makeContext(vpatId)
      );
      expect(response.status).toBe(501);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe('NOT_IMPLEMENTED');
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

  describe('Word export (?format=docx)', () => {
    it('returns 200 with docx content type', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=docx`),
        makeContext(vpatId)
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('includes Content-Disposition header with .docx filename', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=docx`),
        makeContext(vpatId)
      );
      const disposition = response.headers.get('Content-Disposition');
      expect(disposition).toContain('attachment');
      expect(disposition).toContain('.docx');
    });
  });

  describe('OpenACR export (?format=openacr)', () => {
    it('returns 200 with application/json content type', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=openacr`),
        makeContext(vpatId)
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
    });

    it('includes Content-Disposition header with .json filename', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=openacr`),
        makeContext(vpatId)
      );
      const disposition = response.headers.get('Content-Disposition');
      expect(disposition).toContain('attachment');
      expect(disposition).toContain('.json');
    });

    it('returns valid OpenACR JSON with required fields', async () => {
      const response = await GET(
        new Request(`http://localhost/api/vpats/${vpatId}/export?format=openacr`),
        makeContext(vpatId)
      );
      const body = await response.json();
      expect(body).toHaveProperty('title');
      expect(body).toHaveProperty('product');
      expect(body).toHaveProperty('standard_version');
      expect(body).toHaveProperty('report_items');
    });
  });
});
