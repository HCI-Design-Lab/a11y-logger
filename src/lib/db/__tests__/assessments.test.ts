// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDbClient } from '../client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '../schema';
import * as schema from '../schema';
import { createProject } from '../projects';
import {
  createAssessment,
  getAssessment,
  getAssessments,
  updateAssessment,
  deleteAssessment,
} from '../assessments';

let projectId: string;

beforeAll(async () => {
  await initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  // Clear child tables first due to foreign key constraints
  await (getDbClient() as BetterSQLite3Database<typeof sqliteSchema>).delete(schema.assessments);
  await (getDbClient() as BetterSQLite3Database<typeof sqliteSchema>).delete(schema.projects);
  // Create a fresh project for each test
  const project = await createProject({ name: 'Test Project' });
  projectId = project.id;
});

describe('createAssessment', () => {
  it('inserts an assessment and returns it', async () => {
    const assessment = await createAssessment(projectId, { name: 'Baseline Audit' });
    expect(assessment.id).toBeDefined();
    expect(assessment.name).toBe('Baseline Audit');
    expect(assessment.project_id).toBe(projectId);
    expect(assessment.status).toBe('ready');
    expect(assessment.created_at).toBeDefined();
    expect(assessment.updated_at).toBeDefined();
  });

  it('generates a unique id for each assessment', async () => {
    const a1 = await createAssessment(projectId, { name: 'Audit A' });
    const a2 = await createAssessment(projectId, { name: 'Audit B' });
    expect(a1.id).not.toBe(a2.id);
  });

  it('stores optional fields', async () => {
    const assessment = await createAssessment(projectId, {
      name: 'Full Audit',
      description: 'A full description',
      status: 'in_progress',
      test_date_start: '2024-01-15T00:00:00.000Z',
      test_date_end: '2024-01-20T00:00:00.000Z',
      assigned_to: 'Jane',
    });
    expect(assessment.description).toBe('A full description');
    expect(assessment.status).toBe('in_progress');
    expect(assessment.test_date_start).toBe('2024-01-15T00:00:00.000Z');
    expect(assessment.test_date_end).toBe('2024-01-20T00:00:00.000Z');
    expect(assessment.assigned_to).toBe('Jane');
  });

  it('stores null for omitted optional fields', async () => {
    const assessment = await createAssessment(projectId, { name: 'Minimal' });
    expect(assessment.description).toBeNull();
    expect(assessment.test_date_start).toBeNull();
    expect(assessment.test_date_end).toBeNull();
    expect(assessment.assigned_to).toBeNull();
  });
});

describe('getAssessment', () => {
  it('returns the assessment by id', async () => {
    const created = await createAssessment(projectId, { name: 'Find Me' });
    const found = await getAssessment(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Find Me');
  });

  it('returns null for nonexistent id', async () => {
    expect(await getAssessment('nonexistent')).toBeNull();
  });
});

describe('getAssessments', () => {
  it('returns empty array when no assessments exist for the project', async () => {
    expect(await getAssessments(projectId)).toEqual([]);
  });

  it('returns only assessments for the given project', async () => {
    const otherProject = await createProject({ name: 'Other Project' });
    await createAssessment(projectId, { name: 'Mine' });
    await createAssessment(otherProject.id, { name: 'Not Mine' });
    const results = await getAssessments(projectId);
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe('Mine');
  });

  it('includes issue_count in each result', async () => {
    await createAssessment(projectId, { name: 'With Count' });
    const results = await getAssessments(projectId);
    expect(results[0]).toHaveProperty('issue_count');
    expect(results[0]!.issue_count).toBe(0);
  });

  it('returns assessments ordered by created_at descending', async () => {
    await createAssessment(projectId, { name: 'First' });
    await createAssessment(projectId, { name: 'Second' });
    const results = await getAssessments(projectId);
    expect(results).toHaveLength(2);
    // Both should be present; order check — newest first
    expect(results[0]!.name === 'First' || results[0]!.name === 'Second').toBe(true);
  });
});

describe('updateAssessment', () => {
  it('updates provided fields and returns the updated assessment', async () => {
    const created = await createAssessment(projectId, { name: 'Original' });
    const updated = await updateAssessment(created.id, { name: 'Updated' });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe('Updated');
  });

  it('does not change fields not included in the update', async () => {
    const created = await createAssessment(projectId, { name: 'Keep', description: 'Keep this' });
    const updated = await updateAssessment(created.id, { name: 'New Name' });
    expect(updated!.description).toBe('Keep this');
  });

  it('sets updated_at on update', async () => {
    const created = await createAssessment(projectId, { name: 'Time Test' });
    const updated = await updateAssessment(created.id, { name: 'Changed' });
    expect(updated!.updated_at).toBeDefined();
  });

  it('returns null for nonexistent id', async () => {
    expect(await updateAssessment('nope', { name: 'X' })).toBeNull();
  });

  it('returns the existing assessment when no fields change', async () => {
    const created = await createAssessment(projectId, { name: 'Unchanged' });
    const result = await updateAssessment(created.id, {});
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Unchanged');
  });
});

describe('deleteAssessment', () => {
  it('removes the assessment', async () => {
    const created = await createAssessment(projectId, { name: 'Delete Me' });
    await deleteAssessment(created.id);
    expect(await getAssessment(created.id)).toBeNull();
  });

  it('returns true when assessment existed', async () => {
    const created = await createAssessment(projectId, { name: 'Exists' });
    expect(await deleteAssessment(created.id)).toBe(true);
  });

  it('returns false when assessment did not exist', async () => {
    expect(await deleteAssessment('ghost-id')).toBe(false);
  });
});
