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
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'Test Project' });
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
  // Mark all criterion rows as resolved so publish can succeed
  getDb()
    .prepare("UPDATE vpat_criterion_rows SET conformance = 'supports' WHERE vpat_id = ?")
    .run(vpatId);
});

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/vpats/[id]/publish', () => {
  it('publishes the VPAT and returns it with updated fields', async () => {
    const response = await POST(
      new Request(`http://localhost/api/vpats/${vpatId}/publish`, { method: 'POST' }),
      makeContext(vpatId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('published');
    expect(body.data.version_number).toBe(2);
    expect(body.data.published_at).not.toBeNull();
  });

  it('returns 422 when criterion rows are unresolved', async () => {
    const vpat2 = await createVpat({
      title: 'Unresolved',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const response = await POST(
      new Request(`http://localhost/api/vpats/${vpat2.id}/publish`, { method: 'POST' }),
      makeContext(vpat2.id)
    );
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('UNRESOLVED_ROWS');
  });

  it('returns 404 for nonexistent VPAT id', async () => {
    const response = await POST(
      new Request('http://localhost/api/vpats/nonexistent/publish', { method: 'POST' }),
      makeContext('nonexistent')
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });
});
