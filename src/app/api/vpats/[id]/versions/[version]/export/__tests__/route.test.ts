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
    title: 'Export Test',
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
  await publishVpat(vpatId);
});

function makeContext(id: string, version: string) {
  return { params: Promise.resolve({ id, version }) };
}

describe('GET /api/vpats/[id]/versions/[version]/export', () => {
  it('returns openacr YAML for a snapshot version', async () => {
    const res = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}/versions/2/export?format=openacr`),
      makeContext(vpatId, '2')
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('yaml');
  });

  it('returns docx for a snapshot version', async () => {
    const res = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}/versions/2/export?format=docx`),
      makeContext(vpatId, '2')
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('wordprocessingml');
  });

  it('returns 404 for nonexistent version', async () => {
    const res = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}/versions/99/export?format=openacr`),
      makeContext(vpatId, '99')
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 for unsupported format', async () => {
    const res = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}/versions/2/export?format=pdf`),
      makeContext(vpatId, '2')
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('BAD_REQUEST');
  });
});
