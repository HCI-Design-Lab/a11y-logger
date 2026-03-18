// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { getCriterionRows } from '@/lib/db/vpat-criterion-rows';
import { PATCH } from '../route';

let vpatId: string;
let rowId: string;

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const p = createProject({ name: 'Test' });
  const v = createVpat({
    title: 'Test',
    project_id: p.id,
    standard_edition: 'WCAG',
    product_scope: ['web'],
  });
  vpatId = v.id;
  rowId = getCriterionRows(vpatId)[0]!.id;
});

describe('PATCH /api/vpats/[id]/rows/[rowId]', () => {
  it('updates conformance', async () => {
    const res = await PATCH(
      new Request('http://localhost/', {
        method: 'PATCH',
        body: JSON.stringify({ conformance: 'supports' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: vpatId, rowId }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.conformance).toBe('supports');
  });

  it('updates remarks', async () => {
    const res = await PATCH(
      new Request('http://localhost/', {
        method: 'PATCH',
        body: JSON.stringify({ remarks: 'Fully supports.' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: vpatId, rowId }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.remarks).toBe('Fully supports.');
  });

  it('rejects invalid conformance value', async () => {
    const res = await PATCH(
      new Request('http://localhost/', {
        method: 'PATCH',
        body: JSON.stringify({ conformance: 'invalid' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: vpatId, rowId }) }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for empty body', async () => {
    const res = await PATCH(
      new Request('http://localhost/', {
        method: 'PATCH',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: vpatId, rowId }) }
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown row', async () => {
    const res = await PATCH(
      new Request('http://localhost/', {
        method: 'PATCH',
        body: JSON.stringify({ conformance: 'supports' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: vpatId, rowId: 'unknown-row-id' }) }
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});
