// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDbClient } from '../client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '../schema';
import * as schema from '../schema';
import {
  createProject,
  getProject,
  getProjects,
  updateProject,
  deleteProject,
  archiveProject,
} from '../projects';

beforeAll(async () => {
  await initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  await (getDbClient() as BetterSQLite3Database<typeof sqliteSchema>).delete(schema.projects);
});

describe('createProject', () => {
  it('inserts a project and returns it', async () => {
    const project = await createProject({ name: 'Test Project' });
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Test Project');
    expect(project.status).toBe('active');
    expect(project.created_at).toBeDefined();
    expect(project.updated_at).toBeDefined();
  });

  it('generates a unique id for each project', async () => {
    const p1 = await createProject({ name: 'Project A' });
    const p2 = await createProject({ name: 'Project B' });
    expect(p1.id).not.toBe(p2.id);
  });

  it('stores optional fields', async () => {
    const project = await createProject({
      name: 'Full Project',
      description: 'A description',
      product_url: 'https://example.com',
      status: 'archived',
    });
    expect(project.description).toBe('A description');
    expect(project.product_url).toBe('https://example.com');
    expect(project.status).toBe('archived');
  });

  it('stores null for omitted optional fields', async () => {
    const project = await createProject({ name: 'Minimal' });
    expect(project.description).toBeNull();
    expect(project.product_url).toBeNull();
  });
});

describe('getProject', () => {
  it('returns the project by id', async () => {
    const created = await createProject({ name: 'Find Me' });
    const found = await getProject(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Find Me');
  });

  it('returns null for nonexistent id', async () => {
    expect(await getProject('nonexistent-id')).toBeNull();
  });
});

describe('getProjects', () => {
  it('returns an empty array when no projects exist', async () => {
    expect(await getProjects()).toEqual([]);
  });

  it('returns all projects with assessment and issue counts', async () => {
    await createProject({ name: 'Alpha' });
    await createProject({ name: 'Beta' });
    const projects = await getProjects();
    expect(projects).toHaveLength(2);
    expect(projects[0]).toHaveProperty('assessment_count');
    expect(projects[0]).toHaveProperty('issue_count');
  });

  it('counts zero assessments and issues for new projects', async () => {
    await createProject({ name: 'Empty' });
    const [project] = await getProjects();
    expect(project!.assessment_count).toBe(0);
    expect(project!.issue_count).toBe(0);
  });
});

describe('updateProject', () => {
  it('updates provided fields and returns the updated project', async () => {
    const created = await createProject({ name: 'Original' });
    const updated = await updateProject(created.id, { name: 'Updated' });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe('Updated');
  });

  it('does not change fields not included in the update', async () => {
    const created = await createProject({ name: 'Keep', description: 'Keep this' });
    const updated = await updateProject(created.id, { name: 'New Name' });
    expect(updated!.description).toBe('Keep this');
  });

  it('sets updated_at on update', async () => {
    const created = await createProject({ name: 'Time Test' });
    const updated = await updateProject(created.id, { name: 'Changed' });
    expect(updated!.updated_at).toBeDefined();
  });

  it('returns null for nonexistent id', async () => {
    expect(await updateProject('nope', { name: 'X' })).toBeNull();
  });
});

describe('deleteProject', () => {
  it('removes the project', async () => {
    const created = await createProject({ name: 'Delete Me' });
    await deleteProject(created.id);
    expect(await getProject(created.id)).toBeNull();
  });

  it('returns true when project existed', async () => {
    const created = await createProject({ name: 'Exists' });
    expect(await deleteProject(created.id)).toBe(true);
  });

  it('returns false when project did not exist', async () => {
    expect(await deleteProject('ghost-id')).toBe(false);
  });
});

describe('archiveProject', () => {
  it('sets status to archived', async () => {
    const created = await createProject({ name: 'Active Project' });
    const archived = await archiveProject(created.id);
    expect(archived!.status).toBe('archived');
  });

  it('returns null for nonexistent id', async () => {
    expect(await archiveProject('ghost')).toBeNull();
  });
});
