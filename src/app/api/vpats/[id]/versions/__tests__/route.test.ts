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
  // Resolve all rows so publish can succeed
  getDb()
    .prepare("UPDATE vpat_criterion_rows SET conformance = 'supports' WHERE vpat_id = ?")
    .run(vpatId);
  await reviewVpat(vpatId, 'Test Reviewer');
});

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/vpats/[id]/versions', () => {
  it('returns empty array when no snapshots exist', async () => {
    const res = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}/versions`),
      makeContext(vpatId)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('returns snapshot list after publishing', async () => {
    await publishVpat(vpatId);
    const res = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}/versions`),
      makeContext(vpatId)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].version_number).toBe(2);
    expect(body.data[0].published_at).toBeDefined();
    expect(body.data[0].snapshot).toBeUndefined(); // blob not included
  });

  it('returns 404 for nonexistent VPAT', async () => {
    const res = await GET(
      new Request('http://localhost/api/vpats/nonexistent/versions'),
      makeContext('nonexistent')
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});
