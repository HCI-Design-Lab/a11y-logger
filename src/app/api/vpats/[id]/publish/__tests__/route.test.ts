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

beforeEach(() => {
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test Project' });
  projectId = project.id;
  const vpat = createVpat({ title: 'Draft VPAT', project_id: projectId });
  vpatId = vpat.id;
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

  it('increments version_number further on repeated publishes', async () => {
    await POST(
      new Request(`http://localhost/api/vpats/${vpatId}/publish`, { method: 'POST' }),
      makeContext(vpatId)
    );
    const response2 = await POST(
      new Request(`http://localhost/api/vpats/${vpatId}/publish`, { method: 'POST' }),
      makeContext(vpatId)
    );
    const body = await response2.json();
    expect(body.data.version_number).toBe(3);
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
