// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { createIssue } from '@/lib/db/issues';
import { GET } from '../route';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
});

type RouteParams = { params: Promise<{ projectId: string }> };

function makeParams(projectId: string): RouteParams {
  return { params: Promise.resolve({ projectId }) };
}

describe('GET /api/projects/[projectId]/export/csv', () => {
  it('returns CSV with correct headers', async () => {
    const project = createProject({ name: 'Test Project' });
    const assessment = createAssessment(project.id, { name: 'Assessment 1' });
    createIssue(assessment.id, {
      title: 'Missing alt text',
      severity: 'high',
      status: 'open',
      wcag_codes: ['1.1.1'],
      tags: ['images'],
    });

    const response = await GET(
      new Request('http://localhost'),
      makeParams(project.id)
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('Test Project-issues.csv');

    const text = await response.text();
    const lines = text.split('\n');
    expect(lines[0]).toBe('id,title,severity,status,wcag_codes,tags,created_at');
    expect(lines[1]).toContain('Missing alt text');
    expect(lines[1]).toContain('high');
    expect(lines[1]).toContain('open');
  });

  it('handles project with no issues (headers only)', async () => {
    const project = createProject({ name: 'Empty Project' });

    const response = await GET(
      new Request('http://localhost'),
      makeParams(project.id)
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text.trim()).toBe('id,title,severity,status,wcag_codes,tags,created_at');
  });

  it('returns 404 for unknown project', async () => {
    const response = await GET(
      new Request('http://localhost'),
      makeParams('nonexistent-project-id')
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('escapes double quotes in title', async () => {
    const project = createProject({ name: 'Quote Project' });
    const assessment = createAssessment(project.id, { name: 'Assessment' });
    createIssue(assessment.id, {
      title: 'Issue with "quotes"',
      severity: 'low',
      status: 'open',
    });

    const response = await GET(
      new Request('http://localhost'),
      makeParams(project.id)
    );

    const text = await response.text();
    expect(text).toContain('Issue with ""quotes""');
  });
});
