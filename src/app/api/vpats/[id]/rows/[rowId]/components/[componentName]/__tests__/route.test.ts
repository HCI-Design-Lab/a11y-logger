// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { getCriterionRows } from '@/lib/db/vpat-criterion-rows';
import { PUT } from '../route';

let vpatId: string;
let rowId: string;

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});
beforeEach(async () => {
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const p = await createProject({ name: 'Test' });
  const v = await createVpat({
    title: 'T',
    project_id: p.id,
    standard_edition: 'WCAG',
    product_scope: ['web', 'documents'],
  });
  vpatId = v.id;
  const rows = await getCriterionRows(vpatId);
  rowId = rows[0]!.id;
});

describe('PUT /api/vpats/[id]/rows/[rowId]/components/[componentName]', () => {
  it('updates conformance for a specific component', async () => {
    const res = await PUT(
      new Request('http://localhost/', {
        method: 'PUT',
        body: JSON.stringify({ conformance: 'supports' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: vpatId, rowId, componentName: 'web' }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.conformance).toBe('supports');
    expect(body.data.component_name).toBe('web');
  });

  it('updates remarks for a specific component', async () => {
    const res = await PUT(
      new Request('http://localhost/', {
        method: 'PUT',
        body: JSON.stringify({ remarks: 'Docs are partially accessible.' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: vpatId, rowId, componentName: 'electronic-docs' }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.remarks).toBe('Docs are partially accessible.');
  });

  it('returns 400 for invalid conformance value', async () => {
    const res = await PUT(
      new Request('http://localhost/', {
        method: 'PUT',
        body: JSON.stringify({ conformance: 'invalid' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: vpatId, rowId, componentName: 'web' }) }
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown componentName', async () => {
    const res = await PUT(
      new Request('http://localhost/', {
        method: 'PUT',
        body: JSON.stringify({ conformance: 'supports' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: vpatId, rowId, componentName: 'hardware' }) }
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 404 for unknown rowId', async () => {
    const res = await PUT(
      new Request('http://localhost/', {
        method: 'PUT',
        body: JSON.stringify({ conformance: 'supports' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: vpatId, rowId: 'bad-id', componentName: 'web' }) }
    );
    expect(res.status).toBe(404);
  });
});
