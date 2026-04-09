// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
import { createProject } from '../projects';
import { createVpat, importVpatFromOpenAcr } from '../vpats';
import { getCriterionRows } from '../vpat-criterion-rows';
import { getCriteriaByCode } from '../criteria';

beforeAll(async () => {
  await initDb(':memory:');
});
afterAll(() => {
  closeDb();
});
beforeEach(() => {
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
});

describe('createVpat — component rows', () => {
  it('creates one component per row for single-scope web', async () => {
    const p = await createProject({ name: 'P' });
    const v = await createVpat({
      title: 'V',
      project_id: p.id,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    const rows = await getCriterionRows(v.id);
    expect(rows.every((r) => r.components.length === 1)).toBe(true);
    expect(rows.every((r) => r.components[0]!.component_name === 'web')).toBe(true);
  });

  it('creates two components per row for web + electronic-docs', async () => {
    const p = await createProject({ name: 'P' });
    const v = await createVpat({
      title: 'V',
      project_id: p.id,
      standard_edition: 'WCAG',
      product_scope: ['web', 'documents'],
    });
    const rows = await getCriterionRows(v.id);
    expect(rows.every((r) => r.components.length === 2)).toBe(true);
  });
});

describe('importVpatFromOpenAcr — component rows', () => {
  it('creates component rows from parsed components array', async () => {
    const p = await createProject({ name: 'P' });
    // Get a real criterion_id for 1.1.1
    const criteriaMap = await getCriteriaByCode(['1.1.1']);
    const criterionId = criteriaMap.get('1.1.1');
    if (!criterionId) return; // skip if criteria not seeded
    const v = await importVpatFromOpenAcr({
      project_id: p.id,
      title: 'Imported',
      description: null,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      rows: [
        {
          criterion_id: criterionId,
          conformance: 'supports',
          remarks: null,
          components: [
            { component_name: 'web', conformance: 'supports', remarks: null },
            {
              component_name: 'electronic-docs',
              conformance: 'partially_supports',
              remarks: 'Some images lack alt text',
            },
          ],
        },
      ],
    });
    const rows = await getCriterionRows(v.id);
    const row = rows.find((r) => r.criterion_code === '1.1.1');
    expect(row).toBeDefined();
    expect(row!.components).toHaveLength(2);
    const webComp = row!.components.find((c) => c.component_name === 'web');
    const docsComp = row!.components.find((c) => c.component_name === 'electronic-docs');
    expect(webComp!.conformance).toBe('supports');
    expect(docsComp!.conformance).toBe('partially_supports');
  });
});
