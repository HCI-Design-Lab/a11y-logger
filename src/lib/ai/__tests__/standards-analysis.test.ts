// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { OpenAIProvider } from '@/lib/ai/openai-provider';
import { AnthropicProvider } from '@/lib/ai/anthropic-provider';

const validResult = {
  title: 'Button not focusable',
  description: 'Keyboard users cannot reach button.',
  severity: 'high',
  wcag_codes: ['2.1.1'],
  section_508_codes: ['302.1'],
  eu_codes: ['4.2.1'],
  user_impact: 'Keyboard users are blocked.',
  suggested_fix: 'Add tabindex="0".',
  confidence: 0.9,
};

describe('OpenAIProvider.analyzeIssue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns section_508_codes and eu_codes from AI response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(validResult) } }],
      }),
    });

    const provider = new OpenAIProvider('fake-key');
    const result = await provider.analyzeIssue('button not focusable');
    expect(result.section_508_codes).toEqual(['302.1']);
    expect(result.eu_codes).toEqual(['4.2.1']);
  });

  it('throws if section_508_codes is missing from response', async () => {
    const withoutS508 = { ...validResult };
    delete (withoutS508 as Partial<typeof validResult>).section_508_codes;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(withoutS508) } }],
      }),
    });

    const provider = new OpenAIProvider('fake-key');
    await expect(provider.analyzeIssue('test')).rejects.toThrow(
      'AI response missing required fields'
    );
  });

  it('throws if eu_codes is missing from response', async () => {
    const withoutEu = { ...validResult };
    delete (withoutEu as Partial<typeof validResult>).eu_codes;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(withoutEu) } }],
      }),
    });

    const provider = new OpenAIProvider('fake-key');
    await expect(provider.analyzeIssue('test')).rejects.toThrow(
      'AI response missing required fields'
    );
  });
});

describe('AnthropicProvider.analyzeIssue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns section_508_codes and eu_codes from AI response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: JSON.stringify(validResult) }],
      }),
    });

    const provider = new AnthropicProvider('fake-key');
    const result = await provider.analyzeIssue('button not focusable');
    expect(result.section_508_codes).toEqual(['302.1']);
    expect(result.eu_codes).toEqual(['4.2.1']);
  });

  it('throws if section_508_codes is missing from Anthropic response', async () => {
    const withoutS508 = { ...validResult };
    delete (withoutS508 as Partial<typeof validResult>).section_508_codes;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: JSON.stringify(withoutS508) }],
      }),
    });

    const provider = new AnthropicProvider('fake-key');
    await expect(provider.analyzeIssue('test')).rejects.toThrow(
      'AI response missing required fields'
    );
  });
});
