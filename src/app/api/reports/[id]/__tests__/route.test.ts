// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { createReport, publishReport } from '@/lib/db/reports';
import { GET, PUT, DELETE } from '../route';

let assessmentId: string;
let reportId: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  getDb().prepare('DELETE FROM report_assessments').run();
  getDb().prepare('DELETE FROM reports').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'Test Project' });
  const assessment = await createAssessment(project.id, { name: 'Assessment 1' });
  assessmentId = assessment.id;
  const report = await createReport({ title: 'Test Report', assessment_ids: [assessmentId] });
  reportId = report.id;
});

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/reports/[id]', () => {
  it('returns the report', async () => {
    const response = await GET(
      new Request(`http://localhost/api/reports/${reportId}`),
      makeContext(reportId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(reportId);
    expect(body.data.title).toBe('Test Report');
  });

  it('returns 404 when report does not exist', async () => {
    const response = await GET(
      new Request('http://localhost/api/reports/no-report'),
      makeContext('no-report')
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});

describe('PUT /api/reports/[id]', () => {
  it('updates the report and returns it', async () => {
    const request = new Request(`http://localhost/api/reports/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    const response = await PUT(request, makeContext(reportId));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Updated Title');
  });

  it('returns 400 for invalid update data', async () => {
    const request = new Request(`http://localhost/api/reports/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    const response = await PUT(request, makeContext(reportId));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when report does not exist', async () => {
    const request = new Request('http://localhost/api/reports/no-report', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'X' }),
    });
    const response = await PUT(request, makeContext('no-report'));
    expect(response.status).toBe(404);
  });

  it('returns 409 when report is published (immutable)', async () => {
    await publishReport(reportId);
    const request = new Request(`http://localhost/api/reports/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Attempt Edit' }),
    });
    const response = await PUT(request, makeContext(reportId));
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe('CONFLICT');
  });
});

describe('DELETE /api/reports/[id]', () => {
  it('deletes the report and returns success', async () => {
    const response = await DELETE(
      new Request(`http://localhost/api/reports/${reportId}`),
      makeContext(reportId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: null });
  });

  it('returns 404 when report does not exist', async () => {
    const response = await DELETE(
      new Request('http://localhost/api/reports/no-report'),
      makeContext('no-report')
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});
