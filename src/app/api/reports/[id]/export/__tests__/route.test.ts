// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { createReport } from '@/lib/db/reports';
import { GET } from '../route';

let reportId: string;
let assessmentId: string;

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
  getDb().prepare('DELETE FROM report_assessments').run();
  getDb().prepare('DELETE FROM reports').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test Project' });
  const assessment = createAssessment(project.id, { name: 'Assessment 1' });
  assessmentId = assessment.id;
  const report = createReport({
    title: 'Accessibility Audit Report',
    assessment_ids: [assessment.id],
  });
  reportId = report.id;
});

describe('GET /api/reports/[id]/export', () => {
  describe('HTML export (?format=html)', () => {
    it('returns 200 with text/html content type', async () => {
      const response = await GET(
        new Request(`http://localhost/api/reports/${reportId}/export?format=html`),
        makeContext(reportId)
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');
    });

    it('returns HTML containing the report title', async () => {
      const response = await GET(
        new Request(`http://localhost/api/reports/${reportId}/export?format=html`),
        makeContext(reportId)
      );
      const text = await response.text();
      expect(text).toContain('Accessibility Audit Report');
    });

    it('includes Content-Disposition header for download', async () => {
      const response = await GET(
        new Request(`http://localhost/api/reports/${reportId}/export?format=html`),
        makeContext(reportId)
      );
      const disposition = response.headers.get('Content-Disposition');
      expect(disposition).toBeTruthy();
      expect(disposition).toContain('attachment');
      expect(disposition).toContain('.html');
    });

    it('defaults to html format when no format param is provided', async () => {
      const response = await GET(
        new Request(`http://localhost/api/reports/${reportId}/export`),
        makeContext(reportId)
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');
    });

    it('returns a complete HTML document', async () => {
      const response = await GET(
        new Request(`http://localhost/api/reports/${reportId}/export?format=html`),
        makeContext(reportId)
      );
      const text = await response.text();
      expect(text).toContain('<!DOCTYPE html>');
      expect(text).toContain('<html');
    });

    it('includes report content in HTML output', async () => {
      // Create a report with executive summary content
      const reportWithContent = createReport({
        title: 'Content Report',
        assessment_ids: [assessmentId],
        content: { executive_summary: { body: 'Test summary text' } },
      });

      const req = new Request(
        `http://localhost/api/reports/${reportWithContent.id}/export?format=html`
      );
      const res = await GET(req, { params: Promise.resolve({ id: reportWithContent.id }) });
      const text = await res.text();
      expect(text).toContain('Content Report');
    });
  });

  describe('PDF export (?format=pdf)', () => {
    it('returns 501 with helpful message since Puppeteer is not available', async () => {
      const response = await GET(
        new Request(`http://localhost/api/reports/${reportId}/export?format=pdf`),
        makeContext(reportId)
      );
      expect(response.status).toBe(501);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe('NOT_IMPLEMENTED');
      expect(body.error).toBeTruthy();
    });
  });

  describe('Error cases', () => {
    it('returns 404 for a nonexistent report', async () => {
      const response = await GET(
        new Request('http://localhost/api/reports/nonexistent/export?format=html'),
        makeContext('nonexistent')
      );
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe('NOT_FOUND');
    });

    it('returns 400 for an unsupported format', async () => {
      const response = await GET(
        new Request(`http://localhost/api/reports/${reportId}/export?format=docx`),
        makeContext(reportId)
      );
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe('BAD_REQUEST');
    });
  });

  describe('variant=with-chart', () => {
    it('returns 200 HTML containing issue statistics section', async () => {
      const response = await GET(
        new Request(
          `http://localhost/api/reports/${reportId}/export?format=html&variant=with-chart`
        ),
        makeContext(reportId)
      );
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('Issue Statistics');
    });

    it('contains WCAG criterion breakdown section', async () => {
      const response = await GET(
        new Request(
          `http://localhost/api/reports/${reportId}/export?format=html&variant=with-chart`
        ),
        makeContext(reportId)
      );
      const text = await response.text();
      expect(text).toContain('WCAG Criteria Breakdown');
    });
  });

  describe('variant=with-issues', () => {
    it('returns 200 HTML containing linked issues', async () => {
      const { createIssue } = await import('@/lib/db/issues');
      createIssue(assessmentId, { title: 'Missing alt text', severity: 'high' });

      const response = await GET(
        new Request(
          `http://localhost/api/reports/${reportId}/export?format=html&variant=with-issues`
        ),
        makeContext(reportId)
      );
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('Missing alt text');
      expect(text).toContain('Issues');
    });
  });

  describe('invalid variant', () => {
    it('returns 400 for unknown variant', async () => {
      const response = await GET(
        new Request(`http://localhost/api/reports/${reportId}/export?format=html&variant=unknown`),
        makeContext(reportId)
      );
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe('BAD_REQUEST');
    });
  });

  describe('variant=with-all', () => {
    it('returns 200 HTML containing both issue statistics and issues list', async () => {
      const { createIssue } = await import('@/lib/db/issues');
      createIssue(assessmentId, { title: 'Alt text missing', severity: 'critical' });

      const response = await GET(
        new Request(`http://localhost/api/reports/${reportId}/export?format=html&variant=with-all`),
        makeContext(reportId)
      );
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('Issue Statistics');
      expect(text).toContain('Alt text missing');
    });
  });

  describe('issue title links', () => {
    it('includes app links on issue titles in with-issues export', async () => {
      const { createIssue } = await import('@/lib/db/issues');
      const issue = createIssue(assessmentId, { title: 'Linked issue', severity: 'low' });

      const response = await GET(
        new Request(
          `http://localhost/api/reports/${reportId}/export?format=html&variant=with-issues`
        ),
        makeContext(reportId)
      );
      const text = await response.text();
      expect(text).toContain(`/issues/${issue.id}`);
    });
  });
});
