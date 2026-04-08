// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { GET, PUT } from '../route';

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
  getDb().prepare('DELETE FROM vpat_cover_sheets').run();
  getDb().prepare('DELETE FROM vpat_criterion_rows').run();
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'Test Project' });
  const vpat = await createVpat({
    title: 'Test VPAT',
    project_id: project.id,
    standard_edition: 'WCAG',
    wcag_version: '2.1',
    wcag_level: 'AA',
    product_scope: ['web'],
  });
  vpatId = vpat.id;
});

describe('GET /api/vpats/[id]/cover-sheet', () => {
  it('returns null data when no cover sheet exists', async () => {
    const res = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}/cover-sheet`),
      makeContext(vpatId)
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toBeNull();
  });

  it('returns cover sheet data when it exists', async () => {
    await PUT(
      new Request(`http://localhost/api/vpats/${vpatId}/cover-sheet`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: 'My App' }),
      }),
      makeContext(vpatId)
    );
    const res = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}/cover-sheet`),
      makeContext(vpatId)
    );
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.product_name).toBe('My App');
  });
});

describe('PUT /api/vpats/[id]/cover-sheet', () => {
  it('creates a new cover sheet and returns 200', async () => {
    const res = await PUT(
      new Request(`http://localhost/api/vpats/${vpatId}/cover-sheet`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: 'Acme App', vendor_company: 'Acme Corp' }),
      }),
      makeContext(vpatId)
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.product_name).toBe('Acme App');
    expect(json.data.vendor_company).toBe('Acme Corp');
  });

  it('updates an existing cover sheet', async () => {
    await PUT(
      new Request(`http://localhost/api/vpats/${vpatId}/cover-sheet`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: 'Old Name' }),
      }),
      makeContext(vpatId)
    );
    const res = await PUT(
      new Request(`http://localhost/api/vpats/${vpatId}/cover-sheet`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: 'New Name' }),
      }),
      makeContext(vpatId)
    );
    const json = await res.json();
    expect(json.data.product_name).toBe('New Name');
  });

  it('stores all provided fields', async () => {
    const payload = {
      product_name: 'My Product',
      product_version: '1.2.3',
      vendor_company: 'Corp Inc',
      vendor_contact_email: 'admin@corp.com',
      report_date: '2026-04-08',
      evaluation_methods: 'Manual + automated',
      notes: 'No issues found',
    };
    const res = await PUT(
      new Request(`http://localhost/api/vpats/${vpatId}/cover-sheet`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      makeContext(vpatId)
    );
    const json = await res.json();
    expect(json.data.product_version).toBe('1.2.3');
    expect(json.data.report_date).toBe('2026-04-08');
    expect(json.data.notes).toBe('No issues found');
  });
});
