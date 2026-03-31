// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDbClient } from '../client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '../schema';
import * as schema from '../schema';
import { createProject } from '../projects';
import { createVpat } from '../vpats';
import { createVpatSnapshot, listVpatSnapshots, getVpatSnapshot } from '../vpat-snapshots';

function dbc() {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

let projectId: string;
let vpatId: string;

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
  const vpat = await createVpat({
    title: 'Test VPAT',
    project_id: projectId,
    standard_edition: 'WCAG',
    wcag_version: '2.1',
    wcag_level: 'AA',
    product_scope: ['web'],
  });
  vpatId = vpat.id;
});

describe('createVpatSnapshot', () => {
  it('stores a snapshot and returns it', async () => {
    const snap = await createVpatSnapshot(vpatId, 2, new Date().toISOString(), {
      title: 'Test VPAT',
      description: null,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
      criterion_rows: [
        {
          criterion_code: '1.1.1',
          criterion_name: 'Non-text Content',
          criterion_description: 'desc',
          criterion_level: 'A',
          criterion_section: '1.1',
          conformance: 'supports',
          remarks: null,
        },
      ],
      reviewed_by: null,
      reviewed_at: null,
    });
    expect(snap.id).toBeDefined();
    expect(snap.version_number).toBe(2);
    expect(snap.vpat_id).toBe(vpatId);
  });
});

describe('listVpatSnapshots', () => {
  it('returns snapshots ordered by version_number descending', async () => {
    const now = new Date().toISOString();
    const data = {
      title: 'T',
      description: null,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
      criterion_rows: [],
      reviewed_by: null,
      reviewed_at: null,
    };
    await createVpatSnapshot(vpatId, 1, now, data);
    await createVpatSnapshot(vpatId, 2, now, data);
    const list = await listVpatSnapshots(vpatId);
    expect(list).toHaveLength(2);
    expect(list[0]!.version_number).toBe(2);
    expect(list[1]!.version_number).toBe(1);
    // Should NOT include the snapshot blob
    expect((list[0]! as unknown as Record<string, unknown>).snapshot).toBeUndefined();
  });

  it('includes created_at in returned summaries', async () => {
    const now = new Date().toISOString();
    const data = {
      title: 'T',
      description: null,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
      criterion_rows: [],
      reviewed_by: null,
      reviewed_at: null,
    };
    await createVpatSnapshot(vpatId, 1, now, data);
    const list = await listVpatSnapshots(vpatId);
    expect(list[0]!.created_at).toBeDefined();
    expect(typeof list[0]!.created_at).toBe('string');
  });
});

describe('getVpatSnapshot', () => {
  it('returns the full deserialized snapshot for a version', async () => {
    const now = new Date().toISOString();
    const data = {
      title: 'Test VPAT',
      description: null,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
      criterion_rows: [],
      reviewed_by: null,
      reviewed_at: null,
    };
    await createVpatSnapshot(vpatId, 2, now, data);
    const snap = await getVpatSnapshot(vpatId, 2);
    expect(snap).not.toBeNull();
    expect(snap!.version_number).toBe(2);
    expect(snap!.data.title).toBe('Test VPAT');
    expect(snap!.data.criterion_rows).toEqual([]);
  });

  it('returns null for a version that does not exist', async () => {
    const snap = await getVpatSnapshot(vpatId, 99);
    expect(snap).toBeNull();
  });
});
