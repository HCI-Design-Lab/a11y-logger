// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
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
} from '../vpats';
import { getCriterionRows } from '../vpat-criterion-rows';

let projectId: string;

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM vpat_criterion_rows').run();
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  projectId = createProject({ name: 'Test Project' }).id;
});

describe('createVpat', () => {
  it('creates a VPAT with correct fields', () => {
    const vpat = createVpat({
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

  it('auto-populates criterion rows', () => {
    const vpat = createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const rows = getCriterionRows(vpat.id);
    expect(rows.length).toBeGreaterThan(0);
    const codes = rows.map((r) => r.criterion_code);
    expect(codes).toContain('1.1.1');
    expect(codes).toContain('1.4.3');
  });

  it('excludes 2.1-only criteria for 508 edition', () => {
    const vpat = createVpat({
      title: '508 VPAT',
      project_id: projectId,
      standard_edition: '508',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const codes = getCriterionRows(vpat.id).map((r) => r.criterion_code);
    expect(codes).not.toContain('1.3.4');
    expect(codes).not.toContain('1.4.10');
    expect(codes).toContain('302.1');
  });

  it('marks Chapter5 rows as not_applicable for web-only scope in 508 edition', () => {
    const vpat = createVpat({
      title: '508 VPAT',
      project_id: projectId,
      standard_edition: '508',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const rows = getCriterionRows(vpat.id);
    const ch5Rows = rows.filter((r) => r.criterion_section === 'Chapter5');
    expect(ch5Rows.length).toBeGreaterThan(0);
    ch5Rows.forEach((r) => {
      expect(r.conformance).toBe('not_applicable');
      expect(r.remarks).toContain('Not applicable');
    });
  });
});

describe('getVpat', () => {
  it('returns null for non-existent id', () => {
    expect(getVpat('non-existent')).toBeNull();
  });

  it('returns the vpat by id', () => {
    const created = createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    const found = getVpat(created.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Test');
  });
});

describe('getVpats', () => {
  it('returns all VPATs when no projectId', () => {
    createVpat({
      title: 'A',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    createVpat({
      title: 'B',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    expect(getVpats()).toHaveLength(2);
  });

  it('filters by projectId', () => {
    const other = createProject({ name: 'Other' });
    createVpat({
      title: 'Mine',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    createVpat({
      title: 'Theirs',
      project_id: other.id,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    expect(getVpats(projectId)).toHaveLength(1);
  });
});

describe('updateVpat', () => {
  it('updates title', () => {
    const vpat = createVpat({
      title: 'Old',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    const updated = updateVpat(vpat.id, { title: 'New' });
    expect(updated!.title).toBe('New');
  });

  it('returns null for non-existent', () => {
    expect(updateVpat('non-existent', { title: 'New' })).toBeNull();
  });
});

describe('deleteVpat', () => {
  it('deletes the VPAT and cascades to criterion rows', () => {
    const vpat = createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    expect(getCriterionRows(vpat.id).length).toBeGreaterThan(0);
    deleteVpat(vpat.id);
    expect(getVpat(vpat.id)).toBeNull();
    expect(getCriterionRows(vpat.id)).toHaveLength(0);
  });

  it('returns false for non-existent', () => {
    expect(deleteVpat('non-existent')).toBe(false);
  });
});

describe('publishVpat', () => {
  it('publishVpat throws for non-existent VPAT', () => {
    expect(() => publishVpat('non-existent')).toThrow('not found');
  });

  it('throws when unresolved rows exist', () => {
    const vpat = createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    expect(() => publishVpat(vpat.id)).toThrow('unresolved');
  });

  it('publishes when all rows are resolved', () => {
    const vpat = createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    // Resolve all rows by setting conformance to supports
    getDb()
      .prepare(
        "UPDATE vpat_criterion_rows SET conformance = 'supports' WHERE vpat_id = ? AND conformance = 'not_evaluated'"
      )
      .run(vpat.id);
    const published = publishVpat(vpat.id);
    expect(published.status).toBe('published');
    expect(published.published_at).not.toBeNull();
  });
});

describe('getVpatsWithProject', () => {
  it('returns vpat with project name', () => {
    createVpat({
      title: 'Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    const results = getVpatsWithProject();
    expect(results[0].project_name).toBe('Test Project');
  });
});

describe('getVpatsWithProgress', () => {
  it('returns resolved and total counts', () => {
    const vpat = createVpat({
      title: 'Progress Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    // Mark some rows as resolved
    getDb()
      .prepare(
        "UPDATE vpat_criterion_rows SET conformance = 'supports' WHERE vpat_id = ? AND conformance = 'not_evaluated' LIMIT 3"
      )
      .run(vpat.id);
    const results = getVpatsWithProgress();
    expect(results).toHaveLength(1);
    expect(results[0].total).toBeGreaterThan(0);
    expect(results[0].resolved).toBe(3);
  });

  it('returns project_name', () => {
    createVpat({
      title: 'Progress Test',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    const results = getVpatsWithProgress();
    expect(results[0].project_name).toBe('Test Project');
  });

  it('filters by projectId when provided', () => {
    const other = createProject({ name: 'Other Project' });
    createVpat({
      title: 'Mine',
      project_id: projectId,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    createVpat({
      title: 'Theirs',
      project_id: other.id,
      standard_edition: 'WCAG',
      product_scope: ['web'],
    });
    const results = getVpatsWithProgress(projectId);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Mine');
  });

  it('resolved is 0 when all rows are not_evaluated', () => {
    createVpat({
      title: 'All Unevaluated',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    });
    const results = getVpatsWithProgress();
    expect(results[0].resolved).toBe(0);
  });
});
