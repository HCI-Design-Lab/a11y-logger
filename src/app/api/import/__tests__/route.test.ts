// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { POST } from '../route';
import JSZip from 'jszip';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
});

async function makeZipFile(files: Record<string, string>): Promise<File> {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content);
  }
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  return new File([buffer], 'export.zip', { type: 'application/zip' });
}

function makeValidExportData(projectName: string) {
  const project = {
    id: 'orig-project-id',
    name: projectName,
    description: 'A test project',
    product_url: null,
    status: 'active',
    settings: '{}',
    created_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };
  const assessments = [
    {
      id: 'orig-assessment-id',
      project_id: 'orig-project-id',
      name: 'Assessment 1',
      description: null,
      test_date_start: null,
      test_date_end: null,
      status: 'planning',
      assigned_to: null,
      created_by: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      issue_count: 1,
    },
  ];
  const issues = [
    {
      id: 'orig-issue-id',
      assessment_id: 'orig-assessment-id',
      title: 'Test Issue',
      description: null,
      url: null,
      severity: 'high',
      status: 'open',
      wcag_codes: ['1.1.1'],
      ai_suggested_codes: [],
      ai_confidence_score: null,
      device_type: null,
      browser: null,
      operating_system: null,
      assistive_technology: null,
      evidence_media: [],
      tags: ['test'],
      created_by: null,
      resolved_by: null,
      resolved_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];
  return { project, assessments, issues };
}

describe('POST /api/import', () => {
  it('returns 400 if no file provided', async () => {
    const formData = new FormData();
    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('No file');
  });

  it('returns 400 if file exceeds 50MB size limit', async () => {
    // Use a plain object to simulate a File with size > 50MB (Blob.size is read-only)
    const fakeFile = {
      size: 51 * 1024 * 1024,
      name: 'big.zip',
      type: 'application/zip',
      arrayBuffer: async () => new ArrayBuffer(0),
    };

    const mockRequest = {
      formData: async () => {
        return {
          get: (key: string) => (key === 'file' ? fakeFile : null),
        };
      },
    } as unknown as Request;

    const response = await POST(mockRequest as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('FILE_TOO_LARGE');
    expect(body.error).toContain('50MB');
  });

  it('returns 400 if zip has no manifest.json', async () => {
    const file = await makeZipFile({
      'project.json': JSON.stringify({ project: {}, assessments: [], issues: [] }),
    });

    const formData = new FormData();
    formData.append('file', file);
    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('returns 400 if zip has no project.json', async () => {
    const manifest = { version: '1.0', exported_at: new Date().toISOString(), project_id: 'x' };
    const file = await makeZipFile({
      'manifest.json': JSON.stringify(manifest),
    });

    const formData = new FormData();
    formData.append('file', file);
    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('imports project with correct name', async () => {
    const manifest = { version: '1.0', exported_at: new Date().toISOString(), project_id: 'orig-project-id' };
    const exportData = makeValidExportData('My Imported Project');

    const file = await makeZipFile({
      'manifest.json': JSON.stringify(manifest),
      'project.json': JSON.stringify(exportData),
    });

    const formData = new FormData();
    formData.append('file', file);
    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.projectId).toBeDefined();

    // Verify the project was created in the DB
    const projects = getDb().prepare('SELECT * FROM projects WHERE id = ?').get(body.data.projectId) as { name: string } | undefined;
    expect(projects).toBeDefined();
    expect(projects!.name).toBe('My Imported Project');
  });

  it('appends (imported) if project name already exists', async () => {
    // Create existing project with same name
    createProject({ name: 'Existing Project' });

    const manifest = { version: '1.0', exported_at: new Date().toISOString(), project_id: 'orig-project-id' };
    const exportData = makeValidExportData('Existing Project');

    const file = await makeZipFile({
      'manifest.json': JSON.stringify(manifest),
      'project.json': JSON.stringify(exportData),
    });

    const formData = new FormData();
    formData.append('file', file);
    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    const importedProject = getDb()
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(body.data.projectId) as { name: string } | undefined;
    expect(importedProject!.name).toBe('Existing Project (imported)');
  });

  it('imports assessments and issues linked to the new project', async () => {
    const manifest = { version: '1.0', exported_at: new Date().toISOString(), project_id: 'orig-project-id' };
    const exportData = makeValidExportData('Full Import Project');

    const file = await makeZipFile({
      'manifest.json': JSON.stringify(manifest),
      'project.json': JSON.stringify(exportData),
    });

    const formData = new FormData();
    formData.append('file', file);
    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    const body = await response.json();
    const newProjectId = body.data.projectId;

    const assessments = getDb()
      .prepare('SELECT * FROM assessments WHERE project_id = ?')
      .all(newProjectId) as Array<{ id: string; name: string }>;
    expect(assessments).toHaveLength(1);
    expect(assessments[0]!.name).toBe('Assessment 1');

    const issues = getDb()
      .prepare('SELECT * FROM issues WHERE assessment_id = ?')
      .all(assessments[0]!.id) as Array<{ title: string }>;
    expect(issues).toHaveLength(1);
    expect(issues[0]!.title).toBe('Test Issue');
  });
});
