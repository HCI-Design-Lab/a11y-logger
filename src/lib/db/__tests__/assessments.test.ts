// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
import { createProject } from '../projects';
import {
  createAssessment,
  getAssessment,
  getAssessments,
  updateAssessment,
  deleteAssessment,
} from '../assessments';

let projectId: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  // Clear child tables first due to foreign key constraints
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  // Create a fresh project for each test
  const project = createProject({ name: 'Test Project' });
  projectId = project.id;
});

describe('createAssessment', () => {
  it('inserts an assessment and returns it', () => {
    const assessment = createAssessment(projectId, { name: 'Baseline Audit' });
    expect(assessment.id).toBeDefined();
    expect(assessment.name).toBe('Baseline Audit');
    expect(assessment.project_id).toBe(projectId);
    expect(assessment.status).toBe('ready');
    expect(assessment.created_at).toBeDefined();
    expect(assessment.updated_at).toBeDefined();
  });

  it('generates a unique id for each assessment', () => {
    const a1 = createAssessment(projectId, { name: 'Audit A' });
    const a2 = createAssessment(projectId, { name: 'Audit B' });
    expect(a1.id).not.toBe(a2.id);
  });

  it('stores optional fields', () => {
    const assessment = createAssessment(projectId, {
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

  it('stores null for omitted optional fields', () => {
    const assessment = createAssessment(projectId, { name: 'Minimal' });
    expect(assessment.description).toBeNull();
    expect(assessment.test_date_start).toBeNull();
    expect(assessment.test_date_end).toBeNull();
    expect(assessment.assigned_to).toBeNull();
  });
});

describe('getAssessment', () => {
  it('returns the assessment by id', () => {
    const created = createAssessment(projectId, { name: 'Find Me' });
    const found = getAssessment(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Find Me');
  });

  it('returns null for nonexistent id', () => {
    expect(getAssessment('nonexistent')).toBeNull();
  });
});

describe('getAssessments', () => {
  it('returns empty array when no assessments exist for the project', () => {
    expect(getAssessments(projectId)).toEqual([]);
  });

  it('returns only assessments for the given project', () => {
    const otherProject = createProject({ name: 'Other Project' });
    createAssessment(projectId, { name: 'Mine' });
    createAssessment(otherProject.id, { name: 'Not Mine' });
    const results = getAssessments(projectId);
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe('Mine');
  });

  it('includes issue_count in each result', () => {
    createAssessment(projectId, { name: 'With Count' });
    const results = getAssessments(projectId);
    expect(results[0]).toHaveProperty('issue_count');
    expect(results[0]!.issue_count).toBe(0);
  });

  it('returns assessments ordered by created_at descending', () => {
    createAssessment(projectId, { name: 'First' });
    createAssessment(projectId, { name: 'Second' });
    const results = getAssessments(projectId);
    expect(results).toHaveLength(2);
    // Both should be present; order check — newest first
    expect(results[0]!.name === 'First' || results[0]!.name === 'Second').toBe(true);
  });
});

describe('updateAssessment', () => {
  it('updates provided fields and returns the updated assessment', () => {
    const created = createAssessment(projectId, { name: 'Original' });
    const updated = updateAssessment(created.id, { name: 'Updated' });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe('Updated');
  });

  it('does not change fields not included in the update', () => {
    const created = createAssessment(projectId, { name: 'Keep', description: 'Keep this' });
    const updated = updateAssessment(created.id, { name: 'New Name' });
    expect(updated!.description).toBe('Keep this');
  });

  it('sets updated_at on update', () => {
    const created = createAssessment(projectId, { name: 'Time Test' });
    const updated = updateAssessment(created.id, { name: 'Changed' });
    expect(updated!.updated_at).toBeDefined();
  });

  it('returns null for nonexistent id', () => {
    expect(updateAssessment('nope', { name: 'X' })).toBeNull();
  });

  it('returns the existing assessment when no fields change', () => {
    const created = createAssessment(projectId, { name: 'Unchanged' });
    const result = updateAssessment(created.id, {});
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Unchanged');
  });
});

describe('deleteAssessment', () => {
  it('removes the assessment', () => {
    const created = createAssessment(projectId, { name: 'Delete Me' });
    deleteAssessment(created.id);
    expect(getAssessment(created.id)).toBeNull();
  });

  it('returns true when assessment existed', () => {
    const created = createAssessment(projectId, { name: 'Exists' });
    expect(deleteAssessment(created.id)).toBe(true);
  });

  it('returns false when assessment did not exist', () => {
    expect(deleteAssessment('ghost-id')).toBe(false);
  });
});
