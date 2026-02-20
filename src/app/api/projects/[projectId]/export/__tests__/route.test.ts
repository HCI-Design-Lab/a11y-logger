// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { createIssue } from '@/lib/db/issues';
import { GET } from '../route';
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

type RouteParams = { params: Promise<{ projectId: string }> };

function makeParams(projectId: string): RouteParams {
  return { params: Promise.resolve({ projectId }) };
}

describe('GET /api/projects/[projectId]/export', () => {
  it('returns 404 for unknown project', async () => {
    const response = await GET(
      new Request('http://localhost'),
      makeParams('nonexistent-project-id')
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('returns a zip file with correct Content-Type', async () => {
    const project = createProject({ name: 'Zip Project' });

    const response = await GET(
      new Request('http://localhost'),
      makeParams(project.id)
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('Zip Project-export.zip');
  });

  it('zip contains manifest.json with required fields', async () => {
    const project = createProject({ name: 'Manifest Test' });

    const response = await GET(
      new Request('http://localhost'),
      makeParams(project.id)
    );

    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(Buffer.from(arrayBuffer));

    expect(zip.files['manifest.json']).toBeDefined();
    const manifestText = await zip.files['manifest.json']!.async('text');
    const manifest = JSON.parse(manifestText);

    expect(manifest.version).toBe('1.0');
    expect(manifest.exported_at).toBeDefined();
    expect(manifest.project_id).toBe(project.id);
  });

  it('zip contains project.json with project data', async () => {
    const project = createProject({ name: 'Project JSON Test' });
    const assessment = createAssessment(project.id, { name: 'Assessment 1' });
    createIssue(assessment.id, { title: 'Test Issue', severity: 'high', status: 'open' });

    const response = await GET(
      new Request('http://localhost'),
      makeParams(project.id)
    );

    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(Buffer.from(arrayBuffer));

    expect(zip.files['project.json']).toBeDefined();
    const projectText = await zip.files['project.json']!.async('text');
    const projectData = JSON.parse(projectText);

    expect(projectData.project.id).toBe(project.id);
    expect(projectData.project.name).toBe('Project JSON Test');
    expect(projectData.assessments).toHaveLength(1);
    expect(projectData.assessments[0].name).toBe('Assessment 1');
    expect(projectData.issues).toHaveLength(1);
    expect(projectData.issues[0].title).toBe('Test Issue');
  });
});
