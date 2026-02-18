// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
import { createProject, getProject } from '../projects';

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
