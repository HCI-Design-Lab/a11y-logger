// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ai', () => ({
  getAIProvider: vi.fn(),
}));

import { POST } from '../route';
import { getAIProvider } from '@/lib/ai';

const mockGetAIProvider = vi.mocked(getAIProvider);

const mockProvider = {
  analyzeIssue: vi.fn(),
  generateReportSection: vi.fn(),
  generateVpatRemarks: vi.fn(),
  generateVpatRow: vi.fn(),
  reviewVpatRow: vi.fn(),
  generateExecutiveSummaryHtml: vi.fn(),
  testConnection: vi.fn(),
};

const fullAiResult = {
  title: 'Search button not focusable',
  description: 'The search button cannot be reached via keyboard navigation.',
  severity: 'critical',
  wcag_codes: ['2.1.1'],
  section_508_codes: ['302.1'],
  eu_codes: ['4.2.1'],
  user_impact: 'Keyboard-only users cannot use the search feature.',
  suggested_fix: 'Add tabindex="0" and a keydown handler.',
  confidence: 0.9,
};

describe('POST /api/ai/generate-issue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 503 when AI is not configured', async () => {
    mockGetAIProvider.mockReturnValue(null);
    const req = new Request('http://localhost/api/ai/generate-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_description: 'Search button not focusable on homepage' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'AI not configured', code: 'AI_NOT_CONFIGURED' });
  });

  it('returns 400 when ai_description is missing', async () => {
    mockGetAIProvider.mockReturnValue(mockProvider);
    const req = new Request('http://localhost/api/ai/generate-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: {} }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns all generated fields when current fields are empty', async () => {
    mockGetAIProvider.mockReturnValue(mockProvider);
    mockProvider.analyzeIssue.mockResolvedValue(fullAiResult);

    const req = new Request('http://localhost/api/ai/generate-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ai_description: 'Search button not focusable on homepage',
        current: {},
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Search button not focusable');
    expect(body.data.severity).toBe('critical');
    expect(body.data.user_impact).toBe('Keyboard-only users cannot use the search feature.');
    expect(body.data.suggested_fix).toBe('Add tabindex="0" and a keydown handler.');
    expect(body.data.wcag_codes).toEqual(['2.1.1']);
  });

  it('does not overwrite fields already set in current', async () => {
    mockGetAIProvider.mockReturnValue(mockProvider);
    mockProvider.analyzeIssue.mockResolvedValue(fullAiResult);

    const req = new Request('http://localhost/api/ai/generate-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ai_description: 'Search button not focusable on homepage',
        current: {
          title: 'My custom title',
          severity: 'low',
          wcag_codes: ['1.1.1'],
        },
      }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.data.title).toBeNull();
    expect(body.data.severity).toBeNull();
    expect(body.data.wcag_codes).toBeNull();
    expect(body.data.description).toBe(
      'The search button cannot be reached via keyboard navigation.'
    );
    expect(body.data.user_impact).toBe('Keyboard-only users cannot use the search feature.');
  });

  it('returns section_508_codes and eu_codes when current arrays are empty', async () => {
    mockGetAIProvider.mockReturnValue(mockProvider);
    mockProvider.analyzeIssue.mockResolvedValue(fullAiResult);

    const req = new Request('http://localhost/api/ai/generate-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_description: 'button not focusable', current: {} }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.data.section_508_codes).toEqual(['302.1']);
    expect(body.data.eu_codes).toEqual(['4.2.1']);
  });

  it('does not overwrite section_508_codes or eu_codes when already set', async () => {
    mockGetAIProvider.mockReturnValue(mockProvider);
    mockProvider.analyzeIssue.mockResolvedValue(fullAiResult);

    const req = new Request('http://localhost/api/ai/generate-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ai_description: 'button not focusable',
        current: { section_508_codes: ['302.4'], eu_codes: ['5.2'] },
      }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.data.section_508_codes).toBeNull();
    expect(body.data.eu_codes).toBeNull();
  });

  it('returns 500 when AI provider throws', async () => {
    mockGetAIProvider.mockReturnValue(mockProvider);
    mockProvider.analyzeIssue.mockRejectedValue(new Error('quota exceeded'));
    const req = new Request('http://localhost/api/ai/generate-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_description: 'test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe('AI_ERROR');
  });
});
