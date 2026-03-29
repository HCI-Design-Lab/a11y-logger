// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat, publishVpat, reviewVpat } from '@/lib/db/vpats';
import { GET } from '../route';

let projectId: string;
let vpatId: string;

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  getDb().prepare('DELETE FROM vpat_snapshots').run();
  getDb().prepare('DELETE FROM vpat_criterion_rows').run();
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'Test Project' });
  projectId = project.id;
  const vpat = await createVpat({
    title: 'Test VPAT',
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
  await reviewVpat(vpatId, 'Test Reviewer');
});

function makeContext(id: string, version: string) {
  return { params: Promise.resolve({ id, version }) };
}

describe('GET /api/vpats/[id]/versions/[version]', () => {
  it('returns the snapshot for a published version', async () => {
    await publishVpat(vpatId);
    const res = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}/versions/2`),
      makeContext(vpatId, '2')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.version_number).toBe(2);
    expect(body.data.published_at).toBeDefined();
    expect(body.data.vpat.title).toBe('Test VPAT');
    expect(Array.isArray(body.data.vpat.criterion_rows)).toBe(true);
  });

  it('returns 404 for nonexistent version', async () => {
    const res = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}/versions/99`),
      makeContext(vpatId, '99')
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 400 for non-numeric version', async () => {
    const res = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}/versions/abc`),
      makeContext(vpatId, 'abc')
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('BAD_REQUEST');
  });

  it('returns 404 for nonexistent VPAT', async () => {
    const res = await GET(
      new Request('http://localhost/api/vpats/nonexistent/versions/2'),
      makeContext('nonexistent', '2')
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});
