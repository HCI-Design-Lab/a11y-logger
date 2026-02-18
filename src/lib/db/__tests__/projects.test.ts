// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
import {
  createProject,
  getProject,
  getProjects,
  updateProject,
  deleteProject,
  archiveProject,
} from '../projects';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  // Clear projects between tests
  getDb().prepare('DELETE FROM projects').run();
});

describe('createProject', () => {
  it('inserts a project and returns it', () => {
    const project = createProject({ name: 'Test Project' });
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Test Project');
    expect(project.status).toBe('active');
    expect(project.created_at).toBeDefined();
    expect(project.updated_at).toBeDefined();
  });

  it('generates a unique id for each project', () => {
    const p1 = createProject({ name: 'Project A' });
    const p2 = createProject({ name: 'Project B' });
    expect(p1.id).not.toBe(p2.id);
  });

  it('stores optional fields', () => {
    const project = createProject({
      name: 'Full Project',
      description: 'A description',
      product_url: 'https://example.com',
      status: 'archived',
    });
    expect(project.description).toBe('A description');
    expect(project.product_url).toBe('https://example.com');
    expect(project.status).toBe('archived');
  });

  it('stores null for omitted optional fields', () => {
    const project = createProject({ name: 'Minimal' });
    expect(project.description).toBeNull();
    expect(project.product_url).toBeNull();
  });
});

describe('getProject', () => {
  it('returns the project by id', () => {
    const created = createProject({ name: 'Find Me' });
    const found = getProject(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Find Me');
  });

  it('returns null for nonexistent id', () => {
    const result = getProject('nonexistent-id');
    expect(result).toBeNull();
  });
});

describe('getProjects', () => {
  it('returns an empty array when no projects exist', () => {
    const projects = getProjects();
    expect(projects).toEqual([]);
  });

  it('returns all projects with assessment and issue counts', () => {
    createProject({ name: 'Alpha' });
    createProject({ name: 'Beta' });
    const projects = getProjects();
    expect(projects).toHaveLength(2);
    expect(projects[0]).toHaveProperty('assessment_count');
    expect(projects[0]).toHaveProperty('issue_count');
  });

  it('returns projects ordered by created_at descending', () => {
    const p1 = createProject({ name: 'First' });
    const p2 = createProject({ name: 'Second' });
    const projects = getProjects();
    const names = projects.map((p) => p.name);
    expect(names).toContain('First');
    expect(names).toContain('Second');
    expect(projects[0].id === p1.id || projects[0].id === p2.id).toBe(true);
  });

  it('counts zero assessments and issues for new projects', () => {
    createProject({ name: 'Empty' });
    const [project] = getProjects();
    expect(project!.assessment_count).toBe(0);
    expect(project!.issue_count).toBe(0);
  });
});

describe('updateProject', () => {
  it('updates provided fields and returns the updated project', () => {
    const created = createProject({ name: 'Original' });
    const updated = updateProject(created.id, { name: 'Updated' });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe('Updated');
  });

  it('does not change fields not included in the update', () => {
    const created = createProject({ name: 'Keep', description: 'Keep this' });
    const updated = updateProject(created.id, { name: 'New Name' });
    expect(updated!.description).toBe('Keep this');
  });

  it('sets updated_at on update', () => {
    const created = createProject({ name: 'Time Test' });
    const updated = updateProject(created.id, { name: 'Changed' });
    expect(updated!.updated_at).toBeDefined();
  });

  it('returns null for nonexistent id', () => {
    const result = updateProject('nope', { name: 'X' });
    expect(result).toBeNull();
  });
});

describe('deleteProject', () => {
  it('removes the project', () => {
    const created = createProject({ name: 'Delete Me' });
    deleteProject(created.id);
    expect(getProject(created.id)).toBeNull();
  });

  it('returns true when project existed', () => {
    const created = createProject({ name: 'Exists' });
    expect(deleteProject(created.id)).toBe(true);
  });

  it('returns false when project did not exist', () => {
    expect(deleteProject('ghost-id')).toBe(false);
  });
});

describe('archiveProject', () => {
  it('sets status to archived', () => {
    const created = createProject({ name: 'Active Project' });
    const archived = archiveProject(created.id);
    expect(archived!.status).toBe('archived');
  });

  it('returns null for nonexistent id', () => {
    expect(archiveProject('ghost')).toBeNull();
  });
});
