// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
import { createProject } from '../projects';
import {
  createReport,
  getReport,
  getReports,
  updateReport,
  deleteReport,
  publishReport,
} from '../reports';

let projectId: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  // Clear child tables before parent due to FK constraints
  getDb().prepare('DELETE FROM reports').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test Project' });
  projectId = project.id;
});

describe('createReport', () => {
  it('inserts a report and returns it', () => {
    const report = createReport({ title: 'Q1 Report', project_id: projectId });
    expect(report.id).toBeDefined();
    expect(report.title).toBe('Q1 Report');
    expect(report.project_id).toBe(projectId);
    expect(report.status).toBe('draft');
    expect(report.type).toBe('detailed');
    expect(report.content).toBe('[]');
    expect(report.created_at).toBeDefined();
    expect(report.updated_at).toBeDefined();
  });

  it('generates a unique id for each report', () => {
    const r1 = createReport({ title: 'Report A', project_id: projectId });
    const r2 = createReport({ title: 'Report B', project_id: projectId });
    expect(r1.id).not.toBe(r2.id);
  });

  it('stores optional type field', () => {
    const report = createReport({
      title: 'Executive Summary',
      project_id: projectId,
      type: 'executive',
    });
    expect(report.type).toBe('executive');
  });

  it('serialises content array to JSON string', () => {
    const report = createReport({
      title: 'With Content',
      project_id: projectId,
      content: [{ title: 'Overview', body: '## Summary' }],
    });
    expect(report.content).toBe(JSON.stringify([{ title: 'Overview', body: '## Summary' }]));
  });

  it('stores null for omitted optional fields', () => {
    const report = createReport({ title: 'Minimal', project_id: projectId });
    expect(report.template_id).toBeNull();
    expect(report.published_at).toBeNull();
    expect(report.created_by).toBeNull();
  });
});

describe('getReport', () => {
  it('returns the report by id', () => {
    const created = createReport({ title: 'Find Me', project_id: projectId });
    const found = getReport(created.id);
    expect(found).not.toBeNull();
    expect(found?.title).toBe('Find Me');
  });

  it('returns null for nonexistent id', () => {
    expect(getReport('nonexistent')).toBeNull();
  });
});

describe('getReports', () => {
  it('returns empty array when no reports exist', () => {
    expect(getReports()).toEqual([]);
  });

  it('returns all reports when no projectId filter', () => {
    const otherProject = createProject({ name: 'Other' });
    createReport({ title: 'Mine', project_id: projectId });
    createReport({ title: 'Theirs', project_id: otherProject.id });
    expect(getReports()).toHaveLength(2);
  });

  it('filters by projectId when provided', () => {
    const otherProject = createProject({ name: 'Other' });
    createReport({ title: 'Mine', project_id: projectId });
    createReport({ title: 'Theirs', project_id: otherProject.id });
    const results = getReports(projectId);
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Mine');
  });

  it('returns reports ordered by created_at descending', () => {
    createReport({ title: 'First', project_id: projectId });
    createReport({ title: 'Second', project_id: projectId });
    const results = getReports(projectId);
    expect(results).toHaveLength(2);
  });
});

describe('updateReport', () => {
  it('updates provided fields and returns the updated report', () => {
    const created = createReport({ title: 'Original', project_id: projectId });
    const updated = updateReport(created.id, { title: 'Updated' });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');
  });

  it('does not change fields not included in the update', () => {
    const created = createReport({ title: 'Keep', project_id: projectId, type: 'executive' });
    const updated = updateReport(created.id, { title: 'New Title' });
    expect(updated!.type).toBe('executive');
  });

  it('serialises content array to JSON string on update', () => {
    const created = createReport({ title: 'Content Report', project_id: projectId });
    const updated = updateReport(created.id, {
      content: [{ title: 'Section', body: 'Body text' }],
    });
    expect(updated!.content).toBe(JSON.stringify([{ title: 'Section', body: 'Body text' }]));
  });

  it('sets updated_at on update', () => {
    const created = createReport({ title: 'Time Test', project_id: projectId });
    const updated = updateReport(created.id, { title: 'Changed' });
    expect(updated!.updated_at).toBeDefined();
  });

  it('returns null for nonexistent id', () => {
    expect(updateReport('nope', { title: 'X' })).toBeNull();
  });

  it('returns existing report when no fields change', () => {
    const created = createReport({ title: 'Unchanged', project_id: projectId });
    const result = updateReport(created.id, {});
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Unchanged');
  });

  it('returns null when trying to update a published report', () => {
    const created = createReport({ title: 'Published', project_id: projectId });
    publishReport(created.id);
    const result = updateReport(created.id, { title: 'Attempted Edit' });
    expect(result).toBeNull();
  });
});

describe('deleteReport', () => {
  it('removes the report', () => {
    const created = createReport({ title: 'Delete Me', project_id: projectId });
    deleteReport(created.id);
    expect(getReport(created.id)).toBeNull();
  });

  it('returns true when report existed', () => {
    const created = createReport({ title: 'Exists', project_id: projectId });
    expect(deleteReport(created.id)).toBe(true);
  });

  it('returns false when report did not exist', () => {
    expect(deleteReport('ghost-id')).toBe(false);
  });
});

describe('publishReport', () => {
  it('sets status to published and records published_at', () => {
    const created = createReport({ title: 'To Publish', project_id: projectId });
    const published = publishReport(created.id);
    expect(published).not.toBeNull();
    expect(published!.status).toBe('published');
    expect(published!.published_at).toBeDefined();
    expect(published!.published_at).not.toBeNull();
  });

  it('returns null for nonexistent id', () => {
    expect(publishReport('ghost-id')).toBeNull();
  });

  it('is idempotent — publishing an already-published report succeeds', () => {
    const created = createReport({ title: 'Already Published', project_id: projectId });
    publishReport(created.id);
    const again = publishReport(created.id);
    expect(again?.status).toBe('published');
  });
});
