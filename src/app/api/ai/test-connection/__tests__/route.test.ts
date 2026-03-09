import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/ai', () => ({
  getAIProvider: vi.fn(),
}));

import { getAIProvider } from '@/lib/ai';
import { POST } from '../route';

describe('POST /api/ai/test-connection', () => {
  it('returns 503 when no provider configured', async () => {
    vi.mocked(getAIProvider).mockReturnValue(null);
    const res = await POST();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns success when connection test passes', async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      testConnection: vi.fn().mockResolvedValue({ ok: true }),
      analyzeIssue: vi.fn(),
      generateReportSection: vi.fn(),
      generateVpatRemarks: vi.fn(),
      generateExecutiveSummaryHtml: vi.fn(),
    });
    const res = await POST();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.ok).toBe(true);
  });

  it('returns success:true with ok:false when connection fails', async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      testConnection: vi.fn().mockResolvedValue({ ok: false, error: 'Invalid key' }),
      analyzeIssue: vi.fn(),
      generateReportSection: vi.fn(),
      generateVpatRemarks: vi.fn(),
      generateExecutiveSummaryHtml: vi.fn(),
    });
    const res = await POST();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.ok).toBe(false);
    expect(body.data.error).toBe('Invalid key');
  });
});
