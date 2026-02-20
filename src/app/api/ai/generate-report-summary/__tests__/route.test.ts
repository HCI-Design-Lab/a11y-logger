// @vitest-environment node
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createReport } from '@/lib/db/reports';

// Mock the AI lib before importing the route
vi.mock('@/lib/ai', () => ({
  getAIProvider: vi.fn(),
}));

import { POST } from '../route';
import { getAIProvider } from '@/lib/ai';

const mockGetAIProvider = vi.mocked(getAIProvider);

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  vi.clearAllMocks();
  getDb().prepare('DELETE FROM reports').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
});

describe('POST /api/ai/generate-report-summary', () => {
  it('returns 503 when AI is not configured', async () => {
    mockGetAIProvider.mockReturnValue(null);

    const req = new Request('http://localhost/api/ai/generate-report-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'p1', reportId: 'r1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: 'AI not configured',
      code: 'AI_NOT_CONFIGURED',
    });
  });

  it('returns 400 when required fields are missing', async () => {
    mockGetAIProvider.mockReturnValue({
      analyzeIssue: vi.fn(),
      generateReportSection: vi.fn(),
      generateVpatRemarks: vi.fn(),
      testConnection: vi.fn(),
    });

    const req = new Request('http://localhost/api/ai/generate-report-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'p1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when project does not exist', async () => {
    mockGetAIProvider.mockReturnValue({
      analyzeIssue: vi.fn(),
      generateReportSection: vi.fn(),
      generateVpatRemarks: vi.fn(),
      testConnection: vi.fn(),
    });

    const req = new Request('http://localhost/api/ai/generate-report-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'nonexistent', reportId: 'r1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });

  it('generates summary and returns it', async () => {
    const mockGenerate = vi.fn().mockResolvedValue('This is an AI-generated summary.');
    mockGetAIProvider.mockReturnValue({
      analyzeIssue: vi.fn(),
      generateReportSection: mockGenerate,
      generateVpatRemarks: vi.fn(),
      testConnection: vi.fn(),
    });

    const project = createProject({ name: 'Test Project' });
    const report = createReport({
      project_id: project.id,
      title: 'Test Report',
      type: 'detailed',
      content: [],
    });

    const req = new Request('http://localhost/api/ai/generate-report-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, reportId: report.id }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.summary).toBe('This is an AI-generated summary.');
    expect(mockGenerate).toHaveBeenCalledWith(expect.any(String), 'Executive Summary');
  });

  it('returns 500 when AI provider throws an error', async () => {
    const mockGenerate = vi.fn().mockRejectedValue(new Error('Rate limit exceeded'));
    mockGetAIProvider.mockReturnValue({
      analyzeIssue: vi.fn(),
      generateReportSection: mockGenerate,
      generateVpatRemarks: vi.fn(),
      testConnection: vi.fn(),
    });

    const project = createProject({ name: 'Test Project 2' });
    const report = createReport({
      project_id: project.id,
      title: 'Test Report 2',
      type: 'detailed',
      content: [],
    });

    const req = new Request('http://localhost/api/ai/generate-report-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, reportId: report.id }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('AI_ERROR');
  });
});
