// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { createIssue } from '@/lib/db/issues';
import { GET, PUT, DELETE } from '../route';

vi.mock('@/lib/auth/session', () => ({ getSession: vi.fn() }));
import { getSession } from '@/lib/auth/session';

let projectId: string;
let assessmentId: string;
let issueId: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  vi.mocked(getSession).mockResolvedValue(null);
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'Test Project' });
  projectId = project.id;
  const assessment = await createAssessment(projectId, { name: 'Baseline Audit' });
  assessmentId = assessment.id;
  const issue = await createIssue(assessmentId, { title: 'Test Issue', severity: 'medium' });
  issueId = issue.id;
});

function makeContext(pid: string, aid: string, iid: string) {
  return { params: Promise.resolve({ projectId: pid, assessmentId: aid, issueId: iid }) };
}

describe('GET /api/projects/[projectId]/assessments/[assessmentId]/issues/[issueId]', () => {
  it('returns the issue', async () => {
    const response = await GET(
      new Request(`http://localhost/.../issues/${issueId}`),
      makeContext(projectId, assessmentId, issueId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(issueId);
    expect(body.data.title).toBe('Test Issue');
  });

  it('returns JSON array fields as arrays', async () => {
    const issue = await createIssue(assessmentId, {
      title: 'With Arrays',
      wcag_codes: ['1.1.1'],
      tags: ['nav'],
    });
    const response = await GET(
      new Request(`http://localhost/.../issues/${issue.id}`),
      makeContext(projectId, assessmentId, issue.id)
    );
    const body = await response.json();
    expect(Array.isArray(body.data.wcag_codes)).toBe(true);
    expect(body.data.wcag_codes).toEqual(['1.1.1']);
    expect(body.data.tags).toEqual(['nav']);
  });

  it('returns 404 when project does not exist', async () => {
    const response = await GET(
      new Request(`http://localhost/.../issues/${issueId}`),
      makeContext('no-proj', assessmentId, issueId)
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 404 when assessment does not exist', async () => {
    const response = await GET(
      new Request(`http://localhost/.../issues/${issueId}`),
      makeContext(projectId, 'no-assessment', issueId)
    );
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe('NOT_FOUND');
  });

  it('returns 404 when assessment belongs to a different project', async () => {
    const otherProject = await createProject({ name: 'Other' });
    const response = await GET(
      new Request(`http://localhost/.../issues/${issueId}`),
      makeContext(otherProject.id, assessmentId, issueId)
    );
    expect(response.status).toBe(404);
  });

  it('returns 404 when issue does not exist', async () => {
    const response = await GET(
      new Request(`http://localhost/.../issues/no-issue`),
      makeContext(projectId, assessmentId, 'no-issue')
    );
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe('NOT_FOUND');
  });

  it('returns 404 when issue belongs to a different assessment', async () => {
    const otherAssessment = await createAssessment(projectId, { name: 'Other Audit' });
    const response = await GET(
      new Request(`http://localhost/.../issues/${issueId}`),
      makeContext(projectId, otherAssessment.id, issueId)
    );
    expect(response.status).toBe(404);
  });
});

describe('PUT /api/projects/[projectId]/assessments/[assessmentId]/issues/[issueId]', () => {
  it('updates the issue and returns it', async () => {
    const request = new Request(`http://localhost/.../issues/${issueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title', severity: 'critical' }),
    });
    const response = await PUT(request, makeContext(projectId, assessmentId, issueId));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Updated Title');
    expect(body.data.severity).toBe('critical');
  });

  it('preserves existing JSON array fields when not in update', async () => {
    const issue = await createIssue(assessmentId, {
      title: 'T',
      wcag_codes: ['1.1.1'],
      tags: ['nav'],
    });
    const request = new Request(`http://localhost/.../issues/${issue.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Changed' }),
    });
    const response = await PUT(request, makeContext(projectId, assessmentId, issue.id));
    const body = await response.json();
    expect(body.data.wcag_codes).toEqual(['1.1.1']);
    expect(body.data.tags).toEqual(['nav']);
  });

  it('returns 400 for invalid update data', async () => {
    const request = new Request(`http://localhost/.../issues/${issueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity: 'blocker' }),
    });
    const response = await PUT(request, makeContext(projectId, assessmentId, issueId));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when project does not exist', async () => {
    const request = new Request(`http://localhost/.../issues/${issueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'X' }),
    });
    const response = await PUT(request, makeContext('no-proj', assessmentId, issueId));
    expect(response.status).toBe(404);
  });

  it('returns 404 when assessment does not exist', async () => {
    const request = new Request(`http://localhost/.../issues/${issueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'X' }),
    });
    const response = await PUT(request, makeContext(projectId, 'no-assessment', issueId));
    expect(response.status).toBe(404);
  });

  it('returns 404 when issue does not exist', async () => {
    const request = new Request(`http://localhost/.../issues/no-issue`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'X' }),
    });
    const response = await PUT(request, makeContext(projectId, assessmentId, 'no-issue'));
    expect(response.status).toBe(404);
  });

  it('returns 404 when issue belongs to a different assessment', async () => {
    const otherAssessment = await createAssessment(projectId, { name: 'Other' });
    const request = new Request(`http://localhost/.../issues/${issueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'X' }),
    });
    const response = await PUT(request, makeContext(projectId, otherAssessment.id, issueId));
    expect(response.status).toBe(404);
  });

  it('passes the session user id to updateIssue when authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue('user-abc');
    const updateIssueSpy = vi.spyOn(await import('@/lib/db/issues'), 'updateIssue');

    const req = new Request('http://localhost/api/test', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    });
    const res = await PUT(req, makeContext(projectId, assessmentId, issueId));
    const body = await res.json();

    expect(updateIssueSpy).toHaveBeenCalledWith(
      issueId,
      expect.objectContaining({ status: 'resolved' }),
      'user-abc'
    );
    expect(body.data.resolved_by).toBe('user-abc');
    updateIssueSpy.mockRestore();
  });

  it('passes null as resolvedBy when no session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const updateIssueSpy = vi.spyOn(await import('@/lib/db/issues'), 'updateIssue');

    const req = new Request('http://localhost/api/test', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    });
    await PUT(req, makeContext(projectId, assessmentId, issueId));

    expect(updateIssueSpy).toHaveBeenCalledWith(issueId, expect.anything(), null);
    updateIssueSpy.mockRestore();
  });
});

describe('DELETE /api/projects/[projectId]/assessments/[assessmentId]/issues/[issueId]', () => {
  it('deletes the issue and returns success', async () => {
    const response = await DELETE(
      new Request(`http://localhost/.../issues/${issueId}`),
      makeContext(projectId, assessmentId, issueId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: null });
  });

  it('returns 404 when project does not exist', async () => {
    const response = await DELETE(
      new Request(`http://localhost/.../issues/${issueId}`),
      makeContext('no-proj', assessmentId, issueId)
    );
    expect(response.status).toBe(404);
  });

  it('returns 404 when assessment does not exist', async () => {
    const response = await DELETE(
      new Request(`http://localhost/.../issues/${issueId}`),
      makeContext(projectId, 'no-assessment', issueId)
    );
    expect(response.status).toBe(404);
  });

  it('returns 404 when issue does not exist', async () => {
    const response = await DELETE(
      new Request(`http://localhost/.../issues/no-issue`),
      makeContext(projectId, assessmentId, 'no-issue')
    );
    expect(response.status).toBe(404);
  });

  it('returns 404 when issue belongs to a different assessment', async () => {
    const otherAssessment = await createAssessment(projectId, { name: 'Other' });
    const response = await DELETE(
      new Request(`http://localhost/.../issues/${issueId}`),
      makeContext(projectId, otherAssessment.id, issueId)
    );
    expect(response.status).toBe(404);
  });
});
