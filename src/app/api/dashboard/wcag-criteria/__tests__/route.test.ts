// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, afterEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { GET } from '../route';
import * as dashboardDb from '@/lib/db/dashboard';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  const db = getDb();
  db.prepare('DELETE FROM issues').run();
  db.prepare('DELETE FROM assessments').run();
  db.prepare('DELETE FROM projects').run();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/dashboard/wcag-criteria', () => {
  it('returns 200 with empty array when no issues', async () => {
    const req = new Request('http://localhost/api/dashboard/wcag-criteria?principle=perceivable');
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('defaults to perceivable when no principle param', async () => {
    const req = new Request('http://localhost/api/dashboard/wcag-criteria');
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('returns 400 for invalid principle', async () => {
    const req = new Request('http://localhost/api/dashboard/wcag-criteria?principle=invalid');
    const response = await GET(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns criteria counts for a given principle', async () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p1', 'P', datetime('now'), datetime('now'))`
    ).run();
    db.prepare(
      `INSERT INTO assessments (id, project_id, name, created_at, updated_at) VALUES ('a1', 'p1', 'A', datetime('now'), datetime('now'))`
    ).run();
    db.prepare(
      `INSERT INTO issues (id, assessment_id, title, wcag_codes, created_at, updated_at) VALUES ('i1', 'a1', 'Issue', ?, datetime('now'), datetime('now'))`
    ).run(JSON.stringify(['1.1.1']));

    const req = new Request('http://localhost/api/dashboard/wcag-criteria?principle=perceivable');
    const response = await GET(req);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data[0]).toMatchObject({ code: '1.1.1', count: 1, name: expect.any(String) });
  });

  it('returns 500 when DB throws', async () => {
    vi.spyOn(dashboardDb, 'getWcagCriteriaCounts').mockImplementation(() => {
      throw new Error('DB failure');
    });

    const req = new Request('http://localhost/api/dashboard/wcag-criteria?principle=perceivable');
    const response = await GET(req);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('passes statuses param to getWcagCriteriaCounts', async () => {
    const spy = vi.spyOn(dashboardDb, 'getWcagCriteriaCounts').mockResolvedValue([]);

    const req = new Request(
      'http://localhost/api/dashboard/wcag-criteria?principle=perceivable&statuses=resolved'
    );
    await GET(req);

    expect(spy).toHaveBeenCalledWith('perceivable', ['resolved']);
  });
});
