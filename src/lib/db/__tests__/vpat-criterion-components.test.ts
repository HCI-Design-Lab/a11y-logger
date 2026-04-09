// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
import { createProject } from '../projects';
import { createVpat } from '../vpats';
import {
  getCriterionRows,
  getCriterionRow,
  getComponentsForRow,
  upsertCriterionComponent,
  getCriterionComponent,
} from '../vpat-criterion-rows';

let vpatId: string;

beforeAll(async () => {
  await initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const p = await createProject({ name: 'Test' });
  const v = await createVpat({
    title: 'Test',
    project_id: p.id,
    standard_edition: 'WCAG',
    product_scope: ['web'],
  });
  vpatId = v.id;
});

describe('VpatCriterionComponent — data layer', () => {
  it('creates one component row per criterion row for single-scope web VPAT', async () => {
    const rows = await getCriterionRows(vpatId);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.components).toHaveLength(1);
      expect(row.components[0]!.component_name).toBe('web');
      expect(row.components[0]!.conformance).toBe('not_evaluated');
    }
  });

  it('creates two component rows per criterion row for web+documents VPAT', async () => {
    const p2 = await createProject({ name: 'Multi' });
    const v2 = await createVpat({
      title: 'Multi',
      project_id: p2.id,
      standard_edition: 'WCAG',
      product_scope: ['web', 'documents'],
    });
    const rows = await getCriterionRows(v2.id);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.components).toHaveLength(2);
      const names = row.components.map((c) => c.component_name).sort();
      expect(names).toEqual(['electronic-docs', 'web']);
    }
  });

  it('software-desktop and software-mobile both map to software (no duplicate)', async () => {
    const p3 = await createProject({ name: 'SW' });
    const v3 = await createVpat({
      title: 'SW',
      project_id: p3.id,
      standard_edition: 'WCAG',
      product_scope: ['software-desktop', 'software-mobile'],
    });
    const rows = await getCriterionRows(v3.id);
    for (const row of rows) {
      expect(row.components).toHaveLength(1);
      expect(row.components[0]!.component_name).toBe('software');
    }
  });

  it('getComponentsForRow returns components for a given row', async () => {
    const rows = await getCriterionRows(vpatId);
    const first = rows[0]!;
    const components = await getComponentsForRow(first.id);
    expect(components).toHaveLength(1);
    expect(components[0]!.component_name).toBe('web');
  });

  it('upsertCriterionComponent updates conformance and remarks', async () => {
    const rows = await getCriterionRows(vpatId);
    const first = rows[0]!;
    const comp = first.components[0]!;
    await upsertCriterionComponent(first.id, comp.component_name, {
      conformance: 'supports',
      remarks: 'Fully accessible',
    });
    const updated = await getCriterionComponent(first.id, comp.component_name);
    expect(updated!.conformance).toBe('supports');
    expect(updated!.remarks).toBe('Fully accessible');
  });

  it('getCriterionComponent returns null for unknown component', async () => {
    const rows = await getCriterionRows(vpatId);
    const result = await getCriterionComponent(rows[0]!.id, 'nonexistent');
    expect(result).toBeNull();
  });

  it('getCriterionRow returns components attached', async () => {
    const rows = await getCriterionRows(vpatId);
    const first = rows[0]!;
    const row = await getCriterionRow(first.id);
    expect(row).not.toBeNull();
    expect(row!.components).toHaveLength(1);
    expect(row!.components[0]!.component_name).toBe('web');
  });
});
