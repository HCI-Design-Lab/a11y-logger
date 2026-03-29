// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDbClient } from '../client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '../schema';
import * as schema from '../schema';
import { eq } from 'drizzle-orm';
import { createProject } from '../projects';
import {
  createCriterionRows,
  getCriterionRows,
  updateCriterionRow,
  getCriterionRow,
  countUnresolvedRows,
  getVpatProgress,
} from '../vpat-criterion-rows';
import { reviewVpat, getVpat } from '../vpats';

function dbc() {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

let projectId: string;
let vpatId: string;
let criterionId: string;

beforeAll(async () => {
  await initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  await dbc().delete(schema.vpatCriterionRows);
  await dbc().delete(schema.vpats);
  await dbc().delete(schema.projects);
  const project = await createProject({ name: 'Test' });
  projectId = project.id;
  // Create a VPAT directly using Drizzle
  vpatId = crypto.randomUUID();
  const now = new Date().toISOString();
  dbc()
    .insert(schema.vpats)
    .values({
      id: vpatId,
      project_id: projectId,
      title: 'Test VPAT',
      standard_edition: 'WCAG',
      product_scope: '["web"]',
      created_at: now,
      updated_at: now,
    })
    .run();
  // Get a real criterion ID from the seeded criteria
  const row = dbc()
    .select({ id: schema.criteria.id })
    .from(schema.criteria)
    .where(eq(schema.criteria.code, '1.1.1'))
    .limit(1)
    .get() as { id: string };
  criterionId = row.id;
});

describe('createCriterionRows', () => {
  it('inserts rows and they can be retrieved', async () => {
    await createCriterionRows(vpatId, [
      { criterion_id: criterionId, conformance: 'not_evaluated' },
    ]);
    const rows = await getCriterionRows(vpatId);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.criterion_code).toBe('1.1.1');
    expect(rows[0]!.conformance).toBe('not_evaluated');
  });

  it('sets remarks when provided', async () => {
    await createCriterionRows(vpatId, [
      {
        criterion_id: criterionId,
        conformance: 'not_applicable',
        remarks: 'Not applicable — web only.',
      },
    ]);
    const rows = await getCriterionRows(vpatId);
    expect(rows[0]!.remarks).toBe('Not applicable — web only.');
  });

  it('inserts multiple rows in one transaction', async () => {
    const row2 = dbc()
      .select({ id: schema.criteria.id })
      .from(schema.criteria)
      .where(eq(schema.criteria.code, '1.1.1'))
      .limit(1)
      .get() as { id: string };
    const row3 = dbc()
      .select({ id: schema.criteria.id })
      .from(schema.criteria)
      .where(eq(schema.criteria.code, '1.3.1'))
      .limit(1)
      .get() as { id: string };
    await createCriterionRows(vpatId, [
      { criterion_id: row2.id, conformance: 'not_evaluated' },
      { criterion_id: row3.id, conformance: 'not_evaluated' },
    ]);
    expect(await getCriterionRows(vpatId)).toHaveLength(2);
  });
});

describe('getCriterionRow', () => {
  it('returns a single row by id', async () => {
    await createCriterionRows(vpatId, [
      { criterion_id: criterionId, conformance: 'not_evaluated' },
    ]);
    const rows = await getCriterionRows(vpatId);
    const found = await getCriterionRow(rows[0]!.id);
    expect(found).not.toBeNull();
    expect(found!.criterion_code).toBe('1.1.1');
  });

  it('returns null for a non-existent id', async () => {
    expect(await getCriterionRow('non-existent')).toBeNull();
  });
});

describe('updateCriterionRow', () => {
  it('updates conformance', async () => {
    await createCriterionRows(vpatId, [
      { criterion_id: criterionId, conformance: 'not_evaluated' },
    ]);
    const row = (await getCriterionRows(vpatId))[0]!;
    const updated = await updateCriterionRow(row.id, { conformance: 'supports' });
    expect(updated!.conformance).toBe('supports');
  });

  it('updates remarks', async () => {
    await createCriterionRows(vpatId, [
      { criterion_id: criterionId, conformance: 'not_evaluated' },
    ]);
    const row = (await getCriterionRows(vpatId))[0]!;
    const updated = await updateCriterionRow(row.id, { remarks: 'Good.' });
    expect(updated!.remarks).toBe('Good.');
  });

  it('sets last_generated_at when ai_reasoning is provided', async () => {
    await createCriterionRows(vpatId, [
      { criterion_id: criterionId, conformance: 'not_evaluated' },
    ]);
    const row = (await getCriterionRows(vpatId))[0]!;
    expect(row.last_generated_at).toBeNull();
    const updated = await updateCriterionRow(row.id, {
      remarks: 'AI text.',
      ai_confidence: 'high',
      ai_reasoning: 'Step by step.',
    });
    expect(updated!.ai_confidence).toBe('high');
    expect(updated!.ai_reasoning).toBe('Step by step.');
    expect(updated!.last_generated_at).not.toBeNull();
  });

  it('returns null for non-existent row', async () => {
    expect(await updateCriterionRow('non-existent', { conformance: 'supports' })).toBeNull();
  });
});

describe('countUnresolvedRows', () => {
  it('returns count of not_evaluated rows', async () => {
    const c1 = dbc()
      .select({ id: schema.criteria.id })
      .from(schema.criteria)
      .where(eq(schema.criteria.code, '1.1.1'))
      .limit(1)
      .get() as { id: string };
    const c2 = dbc()
      .select({ id: schema.criteria.id })
      .from(schema.criteria)
      .where(eq(schema.criteria.code, '1.3.1'))
      .limit(1)
      .get() as { id: string };
    await createCriterionRows(vpatId, [
      { criterion_id: c1.id, conformance: 'not_evaluated' },
      { criterion_id: c2.id, conformance: 'supports' },
    ]);
    expect(await countUnresolvedRows(vpatId)).toBe(1);
  });
});

describe('getVpatProgress', () => {
  it('returns resolved and total counts', async () => {
    const c1 = dbc()
      .select({ id: schema.criteria.id })
      .from(schema.criteria)
      .where(eq(schema.criteria.code, '1.1.1'))
      .limit(1)
      .get() as { id: string };
    const c2 = dbc()
      .select({ id: schema.criteria.id })
      .from(schema.criteria)
      .where(eq(schema.criteria.code, '1.3.1'))
      .limit(1)
      .get() as { id: string };
    await createCriterionRows(vpatId, [
      { criterion_id: c1.id, conformance: 'not_evaluated' },
      { criterion_id: c2.id, conformance: 'supports' },
    ]);
    const progress = await getVpatProgress(vpatId);
    expect(progress.total).toBe(2);
    expect(progress.resolved).toBe(1);
  });
});

describe('updateCriterionRow — review reset', () => {
  beforeEach(async () => {
    await createCriterionRows(vpatId, [
      { criterion_id: criterionId, conformance: 'not_evaluated' },
    ]);
  });

  it('resets reviewed VPAT to draft when conformance changes', async () => {
    // resolve all rows and review the VPAT
    dbc()
      .update(schema.vpatCriterionRows)
      .set({ conformance: 'supports' })
      .where(eq(schema.vpatCriterionRows.vpat_id, vpatId))
      .run();
    await reviewVpat(vpatId, 'Jane Smith');
    expect((await getVpat(vpatId))!.status).toBe('reviewed');

    // change conformance on one row
    const rows = await getCriterionRows(vpatId);
    await updateCriterionRow(rows[0]!.id, { conformance: 'does_not_support' });

    const vpat = await getVpat(vpatId);
    expect(vpat!.status).toBe('draft');
    expect(vpat!.reviewed_by).toBeNull();
    expect(vpat!.reviewed_at).toBeNull();
  });

  it('resets reviewed VPAT to draft when remarks changes', async () => {
    dbc()
      .update(schema.vpatCriterionRows)
      .set({ conformance: 'supports' })
      .where(eq(schema.vpatCriterionRows.vpat_id, vpatId))
      .run();
    await reviewVpat(vpatId, 'Jane Smith');

    const rows = await getCriterionRows(vpatId);
    await updateCriterionRow(rows[0]!.id, { remarks: 'Updated remark' });

    const vpat = await getVpat(vpatId);
    expect(vpat!.status).toBe('draft');
    expect(vpat!.reviewed_by).toBeNull();
  });

  it('does NOT reset when only ai_reasoning changes', async () => {
    dbc()
      .update(schema.vpatCriterionRows)
      .set({ conformance: 'supports' })
      .where(eq(schema.vpatCriterionRows.vpat_id, vpatId))
      .run();
    await reviewVpat(vpatId, 'Jane Smith');

    const rows = await getCriterionRows(vpatId);
    await updateCriterionRow(rows[0]!.id, { ai_reasoning: 'Updated AI reasoning' });

    const vpat = await getVpat(vpatId);
    expect(vpat!.status).toBe('reviewed');
  });

  it('does NOT reset a draft VPAT when conformance changes', async () => {
    const rows = await getCriterionRows(vpatId);
    await updateCriterionRow(rows[0]!.id, { conformance: 'supports' });
    const vpat = await getVpat(vpatId);
    expect(vpat!.status).toBe('draft');
  });
});
