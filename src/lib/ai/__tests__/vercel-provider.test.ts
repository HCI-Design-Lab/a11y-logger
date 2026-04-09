import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateText } from 'ai';
import { VercelAIProvider } from '../vercel-provider';

vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

const mockGenerateText = vi.mocked(generateText);

// Minimal fake LanguageModel — VercelAIProvider only passes this to generateText
const fakeModel = {} as ConstructorParameters<typeof VercelAIProvider>[0];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('VercelAIProvider.testConnection', () => {
  it('returns ok:true when generateText succeeds', async () => {
    mockGenerateText.mockResolvedValue({ text: 'pong' } as never);
    const provider = new VercelAIProvider(fakeModel);
    const result = await provider.testConnection();
    expect(result.ok).toBe(true);
  });

  it('returns ok:false with error when generateText throws', async () => {
    mockGenerateText.mockRejectedValue(new Error('Network error'));
    const provider = new VercelAIProvider(fakeModel);
    const result = await provider.testConnection();
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Network error');
  });
});

describe('VercelAIProvider.analyzeIssue', () => {
  const validResult = {
    title: 'Missing alt text',
    description: 'Image has no alt attribute',
    severity: 'high',
    wcag_codes: ['1.1.1'],
    section_508_codes: ['302.1'],
    eu_codes: ['4.2.1'],
    user_impact: 'Screen reader users cannot access this element',
    suggested_fix: 'Add alt attribute',
    confidence: 0.9,
  };

  it('returns parsed result on valid JSON response', async () => {
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(validResult) } as never);
    const provider = new VercelAIProvider(fakeModel);
    const result = await provider.analyzeIssue('Image without alt text');
    expect(result.title).toBe('Missing alt text');
    expect(result.severity).toBe('high');
    expect(result.wcag_codes).toEqual(['1.1.1']);
  });

  it('throws when response JSON is malformed', async () => {
    mockGenerateText.mockResolvedValue({ text: 'not json' } as never);
    const provider = new VercelAIProvider(fakeModel);
    await expect(provider.analyzeIssue('test')).rejects.toThrow(
      'Invalid response from AI provider'
    );
  });

  it('throws when response is missing required fields', async () => {
    mockGenerateText.mockResolvedValue({ text: JSON.stringify({ title: 'Only title' }) } as never);
    const provider = new VercelAIProvider(fakeModel);
    await expect(provider.analyzeIssue('test')).rejects.toThrow(
      'AI response missing required fields'
    );
  });

  it('throws when severity is not a valid value', async () => {
    const bad = { ...validResult, severity: 'urgent' };
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(bad) } as never);
    const provider = new VercelAIProvider(fakeModel);
    await expect(provider.analyzeIssue('test')).rejects.toThrow(
      'AI response missing required fields'
    );
  });

  it('throws when generateText throws', async () => {
    mockGenerateText.mockRejectedValue(new Error('Rate limited'));
    const provider = new VercelAIProvider(fakeModel);
    await expect(provider.analyzeIssue('test')).rejects.toThrow('Rate limited');
  });
});

describe('VercelAIProvider.generateReportSection', () => {
  it('returns text string on success', async () => {
    mockGenerateText.mockResolvedValue({ text: 'Report section text.' } as never);
    const provider = new VercelAIProvider(fakeModel);
    const result = await provider.generateReportSection('context', 'Executive Summary');
    expect(result).toBe('Report section text.');
  });

  it('throws when generateText throws', async () => {
    mockGenerateText.mockRejectedValue(new Error('Quota exceeded'));
    const provider = new VercelAIProvider(fakeModel);
    await expect(provider.generateReportSection('ctx', 'Section')).rejects.toThrow();
  });
});

describe('VercelAIProvider.generateExecutiveSummaryHtml', () => {
  it('returns HTML string on success', async () => {
    mockGenerateText.mockResolvedValue({ text: '<p>Summary</p>' } as never);
    const provider = new VercelAIProvider(fakeModel);
    const result = await provider.generateExecutiveSummaryHtml('context');
    expect(result).toBe('<p>Summary</p>');
  });
});

describe('VercelAIProvider.generateVpatRemarks', () => {
  it('returns remarks string on success', async () => {
    mockGenerateText.mockResolvedValue({ text: 'Does not support 1.1.1.' } as never);
    const provider = new VercelAIProvider(fakeModel);
    const result = await provider.generateVpatRemarks('Missing alt on images', '1.1.1');
    expect(result).toBe('Does not support 1.1.1.');
  });
});

describe('VercelAIProvider.generateVpatRow', () => {
  it('returns parsed VpatRowGenerationResult on valid JSON', async () => {
    const row = {
      remarks: 'Partially supports.',
      confidence: 'medium',
      reasoning: 'Some issues found.',
      referenced_issues: [{ title: 'Missing alt', severity: 'high' }],
      suggested_conformance: 'does_not_support',
    };
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(row) } as never);
    const provider = new VercelAIProvider(fakeModel);
    const result = await provider.generateVpatRow({
      criterion: {
        code: '1.1.1',
        name: 'Non-text Content',
        description: 'Provide text alternatives.',
      },
      issues: [
        {
          title: 'Missing alt',
          severity: 'high',
          url: 'https://example.com',
          description: 'No alt text.',
        },
      ],
    });
    expect(result.remarks).toBe('Partially supports.');
    expect(result.confidence).toBe('medium');
  });
});

describe('VercelAIProvider.reviewVpatRow', () => {
  const context = {
    criterion: {
      code: '1.1.1',
      name: 'Non-text Content',
      description: 'Provide text alternatives.',
    },
    issues: [
      {
        title: 'Missing alt',
        severity: 'high',
        url: 'https://example.com',
        description: 'No alt.',
      },
    ],
  };
  const firstPass = {
    remarks: 'Does not support.',
    confidence: 'medium' as const,
    reasoning: 'One high issue.',
    referenced_issues: [{ title: 'Missing alt', severity: 'high' }],
    suggested_conformance: 'does_not_support' as const,
  };
  const reviewedResult = {
    remarks: 'Does not support 1.1.1 due to missing alt text.',
    confidence: 'high' as const,
    reasoning: 'First pass was correct.',
    referenced_issues: [{ title: 'Missing alt', severity: 'high' }],
    suggested_conformance: 'does_not_support' as const,
  };

  it('returns parsed VpatRowGenerationResult on valid JSON', async () => {
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(reviewedResult) } as never);
    const provider = new VercelAIProvider(fakeModel);
    const result = await provider.reviewVpatRow(context, firstPass);
    expect(result.remarks).toBe('Does not support 1.1.1 due to missing alt text.');
    expect(result.suggested_conformance).toBe('does_not_support');
  });

  it('throws on invalid JSON', async () => {
    mockGenerateText.mockResolvedValue({ text: 'not json' } as never);
    const provider = new VercelAIProvider(fakeModel);
    await expect(provider.reviewVpatRow(context, firstPass)).rejects.toThrow(
      'Invalid response from AI provider'
    );
  });

  it('throws when required fields are missing', async () => {
    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({ remarks: 'only remarks' }),
    } as never);
    const provider = new VercelAIProvider(fakeModel);
    await expect(provider.reviewVpatRow(context, firstPass)).rejects.toThrow(
      'AI response missing required fields'
    );
  });
});
