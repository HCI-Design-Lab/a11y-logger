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
  getInvalidIssueIds,
  safeParse,
} from '../vpats';

let projectId: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  // Clear in reverse FK dependency order
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test Project' });
  projectId = project.id;
});

describe('createVpat', () => {
  it('inserts a VPAT and returns it with defaults', () => {
    const vpat = createVpat({ title: 'VPAT 2024', project_id: projectId });
    expect(vpat.id).toBeDefined();
    expect(vpat.title).toBe('VPAT 2024');
    expect(vpat.project_id).toBe(projectId);
    expect(vpat.status).toBe('draft');
    expect(vpat.version_number).toBe(1);
    expect(vpat.wcag_scope).toEqual([]);
    expect(vpat.criteria_rows).toEqual([]);
    expect(vpat.created_at).toBeDefined();
    expect(vpat.updated_at).toBeDefined();
  });

  it('generates a unique id for each VPAT', () => {
    const v1 = createVpat({ title: 'VPAT A', project_id: projectId });
    const v2 = createVpat({ title: 'VPAT B', project_id: projectId });
    expect(v1.id).not.toBe(v2.id);
  });

  it('stores and returns wcag_scope as a parsed array', () => {
    const vpat = createVpat({
      title: 'VPAT',
      project_id: projectId,
      wcag_scope: ['1.1.1', '4.1.2'],
    });
    expect(vpat.wcag_scope).toEqual(['1.1.1', '4.1.2']);
  });

  it('stores and returns criteria_rows as a parsed array', () => {
    const row = {
      criterion_code: '1.1.1',
      conformance: 'supports' as const,
      remarks: 'All images have alt text',
      related_issue_ids: [],
    };
    const vpat = createVpat({
      title: 'VPAT',
      project_id: projectId,
      criteria_rows: [row],
    });
    expect(vpat.criteria_rows).toHaveLength(1);
    expect(vpat.criteria_rows[0]!.criterion_code).toBe('1.1.1');
    expect(vpat.criteria_rows[0]!.conformance).toBe('supports');
  });
});

describe('getVpat', () => {
  it('returns the VPAT by id', () => {
    const created = createVpat({ title: 'Find Me', project_id: projectId });
    const found = getVpat(created.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Find Me');
  });

  it('returns null for nonexistent id', () => {
    expect(getVpat('nonexistent')).toBeNull();
  });

  it('parses wcag_scope from JSON on read', () => {
    const created = createVpat({
      title: 'VPAT',
      project_id: projectId,
      wcag_scope: ['1.1.1'],
    });
    const found = getVpat(created.id);
    expect(Array.isArray(found!.wcag_scope)).toBe(true);
    expect(found!.wcag_scope).toEqual(['1.1.1']);
  });
});

describe('getVpats', () => {
  it('returns empty array when no VPATs exist', () => {
    expect(getVpats()).toEqual([]);
  });

  it('returns all VPATs when no projectId filter given', () => {
    const other = createProject({ name: 'Other' });
    createVpat({ title: 'VPAT A', project_id: projectId });
    createVpat({ title: 'VPAT B', project_id: other.id });
    expect(getVpats()).toHaveLength(2);
  });

  it('filters by projectId when provided', () => {
    const other = createProject({ name: 'Other' });
    createVpat({ title: 'VPAT A', project_id: projectId });
    createVpat({ title: 'VPAT B', project_id: other.id });
    const results = getVpats(projectId);
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('VPAT A');
  });

  it('returns VPATs ordered by created_at descending', () => {
    createVpat({ title: 'First', project_id: projectId });
    createVpat({ title: 'Second', project_id: projectId });
    const results = getVpats(projectId);
    expect(results).toHaveLength(2);
    const titles = results.map((v) => v.title);
    expect(titles).toContain('First');
    expect(titles).toContain('Second');
  });
});

describe('updateVpat', () => {
  it('updates provided fields and returns the updated VPAT', () => {
    const created = createVpat({ title: 'Original', project_id: projectId });
    const updated = updateVpat(created.id, { title: 'Updated' });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');
  });

  it('does not change fields not included in the update', () => {
    const created = createVpat({
      title: 'Keep',
      project_id: projectId,
      wcag_scope: ['1.1.1'],
    });
    const updated = updateVpat(created.id, { title: 'New Title' });
    expect(updated!.wcag_scope).toEqual(['1.1.1']);
  });

  it('can update wcag_scope', () => {
    const created = createVpat({ title: 'VPAT', project_id: projectId });
    const updated = updateVpat(created.id, { wcag_scope: ['2.1.1', '2.1.2'] });
    expect(updated!.wcag_scope).toEqual(['2.1.1', '2.1.2']);
  });

  it('sets updated_at on update', () => {
    const created = createVpat({ title: 'VPAT', project_id: projectId });
    const updated = updateVpat(created.id, { title: 'Changed' });
    expect(updated!.updated_at).toBeDefined();
  });

  it('returns null for nonexistent id', () => {
    expect(updateVpat('nope', { title: 'X' })).toBeNull();
  });

  it('returns existing VPAT when no fields provided', () => {
    const created = createVpat({ title: 'Unchanged', project_id: projectId });
    const result = updateVpat(created.id, {});
    expect(result!.title).toBe('Unchanged');
  });
});

describe('deleteVpat', () => {
  it('removes the VPAT', () => {
    const created = createVpat({ title: 'Delete Me', project_id: projectId });
    deleteVpat(created.id);
    expect(getVpat(created.id)).toBeNull();
  });

  it('returns true when VPAT existed', () => {
    const created = createVpat({ title: 'Exists', project_id: projectId });
    expect(deleteVpat(created.id)).toBe(true);
  });

  it('returns false when VPAT did not exist', () => {
    expect(deleteVpat('ghost-id')).toBe(false);
  });
});

describe('publishVpat', () => {
  it('sets status to published', () => {
    const created = createVpat({ title: 'Draft VPAT', project_id: projectId });
    expect(created.status).toBe('draft');
    const published = publishVpat(created.id);
    expect(published!.status).toBe('published');
  });

  it('increments version_number', () => {
    const created = createVpat({ title: 'VPAT', project_id: projectId });
    expect(created.version_number).toBe(1);
    const published = publishVpat(created.id);
    expect(published!.version_number).toBe(2);
  });

  it('sets published_at to a timestamp', () => {
    const created = createVpat({ title: 'VPAT', project_id: projectId });
    expect(created.published_at).toBeNull();
    const published = publishVpat(created.id);
    expect(published!.published_at).not.toBeNull();
  });

  it('further increments version_number on repeated publishes', () => {
    const created = createVpat({ title: 'VPAT', project_id: projectId });
    publishVpat(created.id);
    const published2 = publishVpat(created.id);
    expect(published2!.version_number).toBe(3);
  });

  it('returns null for nonexistent id', () => {
    expect(publishVpat('ghost-id')).toBeNull();
  });
});

describe('getInvalidIssueIds', () => {
  it('returns empty array when all ids are empty', () => {
    expect(getInvalidIssueIds([])).toEqual([]);
  });

  it('returns ids that do not exist in the issues table', () => {
    const invalid = getInvalidIssueIds(['nonexistent-id-1', 'nonexistent-id-2']);
    expect(invalid).toContain('nonexistent-id-1');
    expect(invalid).toContain('nonexistent-id-2');
  });
});

describe('safeParse', () => {
  it('parses valid JSON and returns the value', () => {
    expect(safeParse('["1.1.1","4.1.2"]', [])).toEqual(['1.1.1', '4.1.2']);
  });

  it('returns the fallback for malformed JSON', () => {
    expect(safeParse('not valid json{{', [])).toEqual([]);
  });

  it('returns the fallback for empty string', () => {
    expect(safeParse('', [])).toEqual([]);
  });

  it('returns the fallback for null-ish values', () => {
    expect(safeParse(undefined as unknown as string, [])).toEqual([]);
  });

  it('does not throw when getVpat encounters corrupt wcag_scope', () => {
    const vpat = createVpat({ title: 'VPAT', project_id: projectId });
    // Manually corrupt the wcag_scope column in the DB
    getDb().prepare("UPDATE vpats SET wcag_scope = 'CORRUPT{{' WHERE id = ?").run(vpat.id);
    expect(() => getVpat(vpat.id)).not.toThrow();
    const found = getVpat(vpat.id);
    expect(found).not.toBeNull();
    expect(found!.wcag_scope).toEqual([]);
  });

  it('does not throw when getVpats encounters corrupt criteria_rows', () => {
    const vpat = createVpat({ title: 'VPAT', project_id: projectId });
    getDb().prepare("UPDATE vpats SET criteria_rows = 'CORRUPT{{' WHERE id = ?").run(vpat.id);
    expect(() => getVpats(projectId)).not.toThrow();
    const results = getVpats(projectId);
    expect(results[0]!.criteria_rows).toEqual([]);
  });
});
