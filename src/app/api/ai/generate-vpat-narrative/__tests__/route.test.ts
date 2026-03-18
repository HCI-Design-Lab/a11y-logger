// @vitest-environment node
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';

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
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
});

describe('POST /api/ai/generate-vpat-narrative', () => {
  it('returns 503 when AI is not configured', async () => {
    mockGetAIProvider.mockReturnValue(null);

    const req = new Request('http://localhost/api/ai/generate-vpat-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'p1', criterionCode: '1.1.1' }),
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
      generateVpatRow: vi.fn(),
      generateExecutiveSummaryHtml: vi.fn(),
      testConnection: vi.fn(),
    });

    const req = new Request('http://localhost/api/ai/generate-vpat-narrative', {
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
      generateVpatRow: vi.fn(),
      generateExecutiveSummaryHtml: vi.fn(),
      testConnection: vi.fn(),
    });

    const req = new Request('http://localhost/api/ai/generate-vpat-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'nonexistent', criterionCode: '1.1.1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });

  it('generates narrative and returns it', async () => {
    const mockRemarks = vi
      .fn()
      .mockResolvedValue('Supports criterion 1.1.1 with minor exceptions.');
    mockGetAIProvider.mockReturnValue({
      analyzeIssue: vi.fn(),
      generateReportSection: vi.fn(),
      generateVpatRemarks: mockRemarks,
      generateVpatRow: vi.fn(),
      generateExecutiveSummaryHtml: vi.fn(),
      testConnection: vi.fn(),
    });

    const project = createProject({ name: 'Test Project' });

    const req = new Request('http://localhost/api/ai/generate-vpat-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, criterionCode: '1.1.1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.narrative).toBe('Supports criterion 1.1.1 with minor exceptions.');
    expect(mockRemarks).toHaveBeenCalledWith(expect.any(String), '1.1.1');
  });

  it('returns 500 when AI provider throws an error', async () => {
    const mockRemarks = vi.fn().mockRejectedValue(new Error('API error'));
    mockGetAIProvider.mockReturnValue({
      analyzeIssue: vi.fn(),
      generateReportSection: vi.fn(),
      generateVpatRemarks: mockRemarks,
      generateVpatRow: vi.fn(),
      generateExecutiveSummaryHtml: vi.fn(),
      testConnection: vi.fn(),
    });

    const project = createProject({ name: 'Test Project 2' });

    const req = new Request('http://localhost/api/ai/generate-vpat-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, criterionCode: '1.1.1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('AI_ERROR');
  });
});
