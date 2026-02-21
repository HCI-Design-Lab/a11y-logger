// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createReport, publishReport } from '@/lib/db/reports';
import { POST, DELETE } from '../route';

let projectId: string;
let reportId: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM reports').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test Project' });
  projectId = project.id;
  const report = createReport({ title: 'Draft Report', project_id: projectId });
  reportId = report.id;
});

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/reports/[id]/publish', () => {
  it('publishes a draft report and returns it', async () => {
    const response = await POST(
      new Request(`http://localhost/api/reports/${reportId}/publish`, { method: 'POST' }),
      makeContext(reportId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('published');
    expect(body.data.published_at).not.toBeNull();
  });

  it('returns 404 when report does not exist', async () => {
    const response = await POST(
      new Request('http://localhost/api/reports/no-report/publish', { method: 'POST' }),
      makeContext('no-report')
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });

  it('is idempotent — publishing an already-published report returns 200 and preserves published_at', async () => {
    // First publish
    const first = await POST(
      new Request(`http://localhost/api/reports/${reportId}/publish`, { method: 'POST' }),
      makeContext(reportId)
    );
    const firstBody = await first.json();
    const firstPublishedAt = firstBody.data.published_at;

    // Second publish
    const second = await POST(
      new Request(`http://localhost/api/reports/${reportId}/publish`, { method: 'POST' }),
      makeContext(reportId)
    );
    expect(second.status).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.data.status).toBe('published');
    expect(secondBody.data.published_at).toBe(firstPublishedAt);
  });
});

describe('DELETE /api/reports/[id]/publish', () => {
  it('unpublishes a published report and reverts it to draft', async () => {
    publishReport(reportId);
    const response = await DELETE(
      new Request(`http://localhost/api/reports/${reportId}/publish`, { method: 'DELETE' }),
      makeContext(reportId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('draft');
    expect(body.data.published_at).toBeNull();
  });

  it('is idempotent — unpublishing a draft report returns 200', async () => {
    const response = await DELETE(
      new Request(`http://localhost/api/reports/${reportId}/publish`, { method: 'DELETE' }),
      makeContext(reportId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('draft');
  });

  it('returns 404 when report does not exist', async () => {
    const response = await DELETE(
      new Request('http://localhost/api/reports/no-report/publish', { method: 'DELETE' }),
      makeContext('no-report')
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });
});
