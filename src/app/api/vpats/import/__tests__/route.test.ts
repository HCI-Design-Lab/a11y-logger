// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { getCriterionRows } from '@/lib/db/vpat-criterion-rows';
import { POST } from '../route';

let projectId: string;

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  getDb().prepare('DELETE FROM vpat_criterion_rows').run();
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'Import Test Project' });
  projectId = project.id;
});

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/vpats/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validYaml = `
title: Test VPAT
catalog: 2.4-edition-wcag-2.1-en
notes: Test notes
chapters:
  success_criteria_level_a:
    criteria:
      - num: "1.1.1"
        components:
          - name: web
            adherence:
              level: supports
              notes: All images have alt text
  success_criteria_level_aa:
    criteria:
      - num: "1.4.3"
        components:
          - name: web
            adherence:
              level: partially-supports
              notes: Some contrast issues
`;

describe('POST /api/vpats/import', () => {
  it('creates a VPAT from valid OpenACR YAML', async () => {
    const res = await POST(makeRequest({ projectId, yaml: validYaml }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.skipped).toEqual([]);
  });

  it('creates criterion rows for criteria present in the YAML', async () => {
    const res = await POST(makeRequest({ projectId, yaml: validYaml }));
    const body = await res.json();
    const rows = await getCriterionRows(body.data.id);
    expect(rows).toHaveLength(2);
    expect(rows.some((r) => r.conformance === 'supports')).toBe(true);
    expect(rows.some((r) => r.conformance === 'partially_supports')).toBe(true);
  });

  it('skips criterion codes not found in the criteria table', async () => {
    const yamlWithUnknown =
      validYaml +
      `
      - num: "9.9.9"
        components:
          - name: web
            adherence:
              level: supports
              notes: ""
`;
    const res = await POST(makeRequest({ projectId, yaml: yamlWithUnknown }));
    const body = await res.json();
    expect(body.data.skipped).toContain('9.9.9');
  });

  it('returns 400 for invalid YAML', async () => {
    const res = await POST(makeRequest({ projectId, yaml: 'not: valid: yaml: {{{' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when catalog is missing', async () => {
    const res = await POST(
      makeRequest({
        projectId,
        yaml: 'title: X\nchapters: {}',
      })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing request fields', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown project', async () => {
    const res = await POST(makeRequest({ projectId: 'nonexistent', yaml: validYaml }));
    expect(res.status).toBe(404);
  });
});
