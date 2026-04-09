// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
import { createProject } from '../projects';
import { createVpat } from '../vpats';
import {
  getCriterionRows,
  countUnresolvedRows,
  getVpatProgress,
  upsertCriterionComponent,
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
  const p = await createProject({ name: 'P' });
  const v = await createVpat({
    title: 'Multi',
    project_id: p.id,
    standard_edition: 'WCAG',
    product_scope: ['web', 'documents'],
  });
  vpatId = v.id;
});

describe('progress — multi-component rows', () => {
  it('counts all rows as unresolved when all components are not_evaluated', async () => {
    const rows = await getCriterionRows(vpatId);
    const unresolved = countUnresolvedRows(vpatId);
    expect(unresolved).toBe(rows.length);
  });

  it('a row with two components is only resolved when BOTH components are resolved', async () => {
    const rows = await getCriterionRows(vpatId);
    const first = rows[0]!;
    // Resolve only the web component
    await upsertCriterionComponent(first.id, 'web', { conformance: 'supports' });
    const unresolvedAfterOne = countUnresolvedRows(vpatId);
    expect(unresolvedAfterOne).toBe(rows.length); // still all unresolved
    // Resolve the docs component
    await upsertCriterionComponent(first.id, 'electronic-docs', { conformance: 'supports' });
    const unresolvedAfterBoth = countUnresolvedRows(vpatId);
    expect(unresolvedAfterBoth).toBe(rows.length - 1);
  });

  it('getVpatProgress returns correct resolved/total', async () => {
    const rows = await getCriterionRows(vpatId);
    const first = rows[0]!;
    await upsertCriterionComponent(first.id, 'web', { conformance: 'supports' });
    await upsertCriterionComponent(first.id, 'electronic-docs', { conformance: 'supports' });
    const progress = await getVpatProgress(vpatId);
    expect(progress.total).toBe(rows.length);
    expect(progress.resolved).toBe(1);
  });
});
