// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AI lib before importing the route
vi.mock('@/lib/ai', () => ({
  getAIProvider: vi.fn(),
}));

import { POST } from '../route';
import { getAIProvider } from '@/lib/ai';

const mockGetAIProvider = vi.mocked(getAIProvider);

describe('POST /api/ai/suggest-wcag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 503 when AI is not configured', async () => {
    mockGetAIProvider.mockReturnValue(null);

    const req = new Request('http://localhost/api/ai/suggest-wcag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Missing alt text',
        description: 'Image has no alt attribute',
      }),
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

  it('returns 400 when title is missing', async () => {
    mockGetAIProvider.mockReturnValue({
      analyzeIssue: vi.fn(),
      generateReportSection: vi.fn(),
      generateVpatRemarks: vi.fn(),
      testConnection: vi.fn(),
    });

    const req = new Request('http://localhost/api/ai/suggest-wcag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'no title provided' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('calls analyzeIssue and returns suggested WCAG codes with confidence', async () => {
    const mockAnalyze = vi.fn().mockResolvedValue({
      title: 'Missing alt text',
      description: 'Image has no alt attribute',
      severity: 'high',
      wcag_codes: ['1.1.1', '4.1.2'],
      confidence: 0.87,
    });

    mockGetAIProvider.mockReturnValue({
      analyzeIssue: mockAnalyze,
      generateReportSection: vi.fn(),
      generateVpatRemarks: vi.fn(),
      testConnection: vi.fn(),
    });

    const req = new Request('http://localhost/api/ai/suggest-wcag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Missing alt text',
        description: 'Image has no alt attribute',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.codes).toEqual(['1.1.1', '4.1.2']);
    expect(body.data.confidence).toBe(0.87);
  });

  it('returns 500 when AI provider throws an error', async () => {
    const mockAnalyze = vi.fn().mockRejectedValue(new Error('API quota exceeded'));
    mockGetAIProvider.mockReturnValue({
      analyzeIssue: mockAnalyze,
      generateReportSection: vi.fn(),
      generateVpatRemarks: vi.fn(),
      testConnection: vi.fn(),
    });

    const req = new Request('http://localhost/api/ai/suggest-wcag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Missing alt text',
        description: 'Image has no alt attribute',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('AI_ERROR');
  });
});
