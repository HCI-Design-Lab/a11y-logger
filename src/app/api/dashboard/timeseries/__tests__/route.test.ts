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

describe('GET /api/dashboard/timeseries', () => {
  it('returns 200 with empty array when no data', async () => {
    const req = new Request('http://localhost/api/dashboard/timeseries?range=1w');
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('defaults to 6m range when no range param', async () => {
    const req = new Request('http://localhost/api/dashboard/timeseries');
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('returns 400 for invalid range', async () => {
    const req = new Request('http://localhost/api/dashboard/timeseries?range=invalid');
    const response = await GET(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns time series data for valid range', async () => {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    db.prepare(
      `INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p1', 'P', ?, ?)`
    ).run(`${today}T00:00:00`, `${today}T00:00:00`);

    const req = new Request('http://localhost/api/dashboard/timeseries?range=1w');
    const response = await GET(req);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toMatchObject({
      date: expect.any(String),
      projects: expect.any(Number),
      assessments: expect.any(Number),
      issues: expect.any(Number),
    });
  });

  it('returns 500 when DB throws', async () => {
    vi.spyOn(dashboardDb, 'getTimeSeriesData').mockImplementation(() => {
      throw new Error('DB failure');
    });

    const req = new Request('http://localhost/api/dashboard/timeseries?range=1w');
    const response = await GET(req);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
