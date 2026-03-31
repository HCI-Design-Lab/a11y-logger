// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { POST } from '../route';

let projectId: string;
let vpatId: string;

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  getDb().prepare('DELETE FROM vpat_criterion_rows').run();
  getDb().prepare('DELETE FROM vpat_snapshots').run();
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'Test' });
  projectId = project.id;
  const vpat = await createVpat({
    title: 'Draft VPAT',
    project_id: projectId,
    standard_edition: 'WCAG',
    wcag_version: '2.1',
    wcag_level: 'AA',
    product_scope: ['web'],
  });
  vpatId = vpat.id;
  getDb()
    .prepare("UPDATE vpat_criterion_rows SET conformance = 'supports' WHERE vpat_id = ?")
    .run(vpatId);
});

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/vpats/[id]/review', () => {
  it('sets status to reviewed and returns vpat', async () => {
    const res = await POST(
      new Request(`http://localhost/api/vpats/${vpatId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_name: 'Jane Smith' }),
      }),
      makeContext(vpatId)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('reviewed');
    expect(body.data.reviewed_by).toBe('Jane Smith');
    expect(body.data.reviewed_at).not.toBeNull();
  });

  it('returns 400 when reviewer_name is missing', async () => {
    const res = await POST(
      new Request(`http://localhost/api/vpats/${vpatId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      makeContext(vpatId)
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when rows are unresolved', async () => {
    getDb()
      .prepare(
        "UPDATE vpat_criterion_rows SET conformance = 'not_evaluated' WHERE vpat_id = ? LIMIT 1"
      )
      .run(vpatId);
    const res = await POST(
      new Request(`http://localhost/api/vpats/${vpatId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_name: 'Jane Smith' }),
      }),
      makeContext(vpatId)
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('UNRESOLVED_ROWS');
  });

  it('returns 404 for nonexistent VPAT', async () => {
    const res = await POST(
      new Request('http://localhost/api/vpats/nonexistent/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_name: 'Jane Smith' }),
      }),
      makeContext('nonexistent')
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});
