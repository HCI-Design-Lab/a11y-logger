import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../openai-provider';
import { AnthropicProvider } from '../anthropic-provider';

const mockOpenAIResponse = (json: object) => ({
  ok: true,
  json: async () => ({
    choices: [{ message: { content: JSON.stringify(json) } }],
  }),
});

const mockAnthropicResponse = (json: object) => ({
  ok: true,
  json: async () => ({
    content: [{ text: JSON.stringify(json) }],
  }),
});

const validResult = {
  reasoning: 'The product has issues with missing alt text.',
  remarks: 'The product partially supports this criterion. Some images lack alternative text.',
  confidence: 'medium',
};

describe('OpenAIProvider.generateVpatRow', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(mockOpenAIResponse(validResult) as unknown as Response);
  });

  it('returns remarks, confidence, and reasoning', async () => {
    const provider = new OpenAIProvider('test-key');
    const result = await provider.generateVpatRow({
      criterion: {
        code: '1.1.1',
        name: 'Non-text Content',
        description: 'All non-text content has a text alternative.',
      },
      issues: [
        {
          title: 'Image missing alt',
          severity: 'high',
          url: 'https://example.com',
          description: 'Logo has no alt text.',
        },
      ],
    });
    expect(result.remarks).toBe(validResult.remarks);
    expect(result.confidence).toBe('medium');
    expect(result.reasoning).toBe(validResult.reasoning);
  });

  it('throws on invalid response shape', async () => {
    fetchSpy.mockResolvedValue(mockOpenAIResponse({ remarks: 'ok' }) as unknown as Response);
    const provider = new OpenAIProvider('test-key');
    await expect(
      provider.generateVpatRow({
        criterion: { code: '1.1.1', name: 'Test', description: 'Test' },
        issues: [],
      })
    ).rejects.toThrow('AI response missing required fields');
  });
});

describe('AnthropicProvider.generateVpatRow', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      mockAnthropicResponse(validResult) as unknown as Response
    );
  });

  it('returns remarks, confidence, and reasoning', async () => {
    const provider = new AnthropicProvider('test-key');
    const result = await provider.generateVpatRow({
      criterion: {
        code: '1.1.1',
        name: 'Non-text Content',
        description: 'All non-text content has a text alternative.',
      },
      issues: [],
    });
    expect(result.remarks).toBe(validResult.remarks);
    expect(result.confidence).toBe('medium');
    expect(result.reasoning).toBe(validResult.reasoning);
  });
});
