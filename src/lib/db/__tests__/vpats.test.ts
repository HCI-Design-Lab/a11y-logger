// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDbClient } from '../client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '../schema';
import * as schema from '../schema';
import { createProject } from '../projects';
import {
  createVpat,
  getVpat,
  getVpats,
  updateVpat,
  deleteVpat,
  publishVpat,
  getVpatsWithProject,
  getVpatsWithProgress,
  importVpatFromOpenAcr,
} from '../vpats';
import { getCriterionRows } from '../vpat-criterion-rows';
import { getCriteriaByCode } from '../criteria';
import { listVpatSnapshots } from '../vpat-snapshots';
import { eq } from 'drizzle-orm';

function dbc() {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

let projectId: string;

beforeAll(async () => {
  await initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  await dbc().delete(schema.vpatSnapshots);
  await dbc().delete(schema.vpatCriterionRows);
  await dbc().delete(schema.vpats);
  await dbc().delete(schema.projects);
  projectId = (await createProject({ name: 'Test Project' })).id;
});

describe('createVpat', () => {
  it('creates a VPAT with correct fields', async () => {
    const vpat = await createVpat({
      title: 'Test VPAT',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    expect(vpat.id).toBeDefined();
    expect(vpat.title).toBe('Test VPAT');
    expect(vpat.standard_edition).toBe('WCAG');
    expect(vpat.wcag_version).toBe('2.1');
    expect(vpat.wcag_level).toBe('AA');
    expect(vpat.product_scope).toEqual(['web']);
    expect(vpat.status).toBe('draft');
  });

  it('auto-populates criterion rows', async () => {
    const vpat = await createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const rows = await getCriterionRows(vpat.id);
    expect(rows.length).toBeGreaterThan(0);
    const codes = rows.map((r) => r.criterion_code);
    expect(codes).toContain('1.1.1');
    expect(codes).toContain('1.4.3');
  });

  it('excludes 2.1-only criteria for 508 edition', async () => {
    const vpat = await createVpat({
      title: '508 VPAT',
      project_id: projectId,
      standard_edition: '508',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const codes = (await getCriterionRows(vpat.id)).map((r) => r.criterion_code);
    expect(codes).not.toContain('1.3.4');
    expect(codes).not.toContain('1.4.10');
    expect(codes).toContain('302.1');
  });

  it('marks Chapter5 rows as not_applicable for web-only scope in 508 edition', async () => {
    const vpat = await createVpat({
      title: '508 VPAT',
      project_id: projectId,
      standard_edition: '508',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const rows = await getCriterionRows(vpat.id);
    const ch5Rows = rows.filter((r) => r.criterion_section === 'Chapter5');
    expect(ch5Rows.length).toBeGreaterThan(0);
    ch5Rows.forEach((r) => {
      expect(r.conformance).toBe('not_applicable');
      expect(r.remarks).toContain('Not applicable');
    });
  });
});

describe('getVpat', () => {
  it('returns null for non-existent id', async () => {
    expect(await getVpat('non-existent')).toBeNull();
  });

  it('returns the vpat by id', async () => {
    const created = await createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    const found = await getVpat(created.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Test');
  });
});

describe('getVpats', () => {
  it('returns all VPATs when no projectId', async () => {
    await createVpat({
      title: 'A',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    await createVpat({
      title: 'B',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    expect(await getVpats()).toHaveLength(2);
  });

  it('filters by projectId', async () => {
    const other = await createProject({ name: 'Other' });
    await createVpat({
      title: 'Mine',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    await createVpat({
      title: 'Theirs',
      project_id: other.id,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    expect(await getVpats(projectId)).toHaveLength(1);
  });
});

describe('updateVpat', () => {
  it('updates title', async () => {
    const vpat = await createVpat({
      title: 'Old',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    const updated = await updateVpat(vpat.id, { title: 'New' });
    expect(updated!.title).toBe('New');
  });

  it('returns null for non-existent', async () => {
    expect(await updateVpat('non-existent', { title: 'New' })).toBeNull();
  });
});

describe('deleteVpat', () => {
  it('deletes the VPAT and cascades to criterion rows', async () => {
    const vpat = await createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    expect((await getCriterionRows(vpat.id)).length).toBeGreaterThan(0);
    await deleteVpat(vpat.id);
    expect(await getVpat(vpat.id)).toBeNull();
    expect(await getCriterionRows(vpat.id)).toHaveLength(0);
  });

  it('returns false for non-existent', async () => {
    expect(await deleteVpat('non-existent')).toBe(false);
  });
});

describe('publishVpat', () => {
  it('publishVpat throws for non-existent VPAT', async () => {
    await expect(publishVpat('non-existent')).rejects.toThrow('not found');
  });

  it('throws when unresolved rows exist', async () => {
    const vpat = await createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    await expect(publishVpat(vpat.id)).rejects.toThrow('unresolved');
  });

  it('publishes when all rows are resolved', async () => {
    const vpat = await createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    // Resolve all rows by setting conformance to supports
    dbc()
      .update(schema.vpatCriterionRows)
      .set({ conformance: 'supports' })
      .where(
        (await import('drizzle-orm')).and(
          (await import('drizzle-orm')).eq(schema.vpatCriterionRows.vpat_id, vpat.id),
          (await import('drizzle-orm')).eq(schema.vpatCriterionRows.conformance, 'not_evaluated')
        )
      )
      .run();
    const published = await publishVpat(vpat.id);
    expect(published.status).toBe('published');
    expect(published.published_at).not.toBeNull();
  });
});

describe('getVpatsWithProject', () => {
  it('returns vpat with project name', async () => {
    await createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const results = await getVpatsWithProject();
    expect(results[0]!.project_name).toBe('Test Project');
  });
});

describe('getVpatsWithProgress', () => {
  it('returns resolved and total counts', async () => {
    const vpat = await createVpat({
      title: 'Progress Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    // Mark 3 rows as resolved
    const { eq, and } = await import('drizzle-orm');
    const rows = dbc()
      .select({ id: schema.vpatCriterionRows.id })
      .from(schema.vpatCriterionRows)
      .where(
        and(
          eq(schema.vpatCriterionRows.vpat_id, vpat.id),
          eq(schema.vpatCriterionRows.conformance, 'not_evaluated')
        )
      )
      .limit(3)
      .all();
    for (const row of rows) {
      dbc()
        .update(schema.vpatCriterionRows)
        .set({ conformance: 'supports' })
        .where(eq(schema.vpatCriterionRows.id, row.id))
        .run();
    }
    const results = await getVpatsWithProgress();
    expect(results).toHaveLength(1);
    expect(results[0]!.total).toBeGreaterThan(0);
    expect(results[0]!.resolved).toBe(3);
  });

  it('returns project_name', async () => {
    await createVpat({
      title: 'Progress Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const results = await getVpatsWithProgress();
    expect(results[0]!.project_name).toBe('Test Project');
  });

  it('filters by projectId when provided', async () => {
    const other = await createProject({ name: 'Other Project' });
    await createVpat({
      title: 'Mine',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    await createVpat({
      title: 'Theirs',
      project_id: other.id,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const results = await getVpatsWithProgress(projectId);
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Mine');
  });

  it('resolved is 0 when all rows are not_evaluated', async () => {
    await createVpat({
      title: 'All Unevaluated',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const results = await getVpatsWithProgress();
    expect(results[0]!.resolved).toBe(0);
  });
});

describe('publishVpat snapshot creation', () => {
  it('creates a snapshot when publishing', async () => {
    const vpat = await createVpat({
      title: 'Snap Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    // Mark all rows as resolved
    dbc()
      .update(schema.vpatCriterionRows)
      .set({ conformance: 'supports' })
      .where(eq(schema.vpatCriterionRows.vpat_id, vpat.id))
      .run();
    await publishVpat(vpat.id);
    const snapshots = await listVpatSnapshots(vpat.id);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].version_number).toBe(2);
  });
});

describe('importVpatFromOpenAcr', () => {
  it('creates a VPAT with the given metadata', async () => {
    const vpat = await importVpatFromOpenAcr({
      project_id: projectId,
      title: 'Imported VPAT',
      description: 'From OpenACR',
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      rows: [],
    });
    expect(vpat.title).toBe('Imported VPAT');
    expect(vpat.description).toBe('From OpenACR');
    expect(vpat.standard_edition).toBe('WCAG');
    expect(vpat.wcag_version).toBe('2.1');
    expect(vpat.wcag_level).toBe('AA');
    expect(vpat.status).toBe('draft');
  });

  it('creates only the criterion rows passed in (no auto-population)', async () => {
    const codeMap = await getCriteriaByCode(['1.1.1']);
    const criterionId = codeMap.get('1.1.1')!;

    const vpat = await importVpatFromOpenAcr({
      project_id: projectId,
      title: 'Sparse VPAT',
      description: null,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      rows: [
        { criterion_id: criterionId, conformance: 'supports', remarks: 'All images have alt text' },
      ],
    });

    const rows = await getCriterionRows(vpat.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.conformance).toBe('supports');
    expect(rows[0]!.remarks).toBe('All images have alt text');
  });

  it('creates a VPAT with zero rows when rows array is empty', async () => {
    const vpat = await importVpatFromOpenAcr({
      project_id: projectId,
      title: 'Empty VPAT',
      description: null,
      standard_edition: '508',
      wcag_version: '2.1',
      wcag_level: 'A',
      rows: [],
    });
    const rows = await getCriterionRows(vpat.id);
    expect(rows).toHaveLength(0);
  });
});
