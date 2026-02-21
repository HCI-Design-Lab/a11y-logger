import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../openai-provider';
import { AnthropicProvider } from '../anthropic-provider';
import { getAIProvider } from '../index';

describe('OpenAIProvider', () => {
  it('testConnection returns ok:false when API key is empty', async () => {
    const provider = new OpenAIProvider('');
    const result = await provider.testConnection();
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('testConnection returns ok:false when API call fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
    } as Response);
    const provider = new OpenAIProvider('sk-invalid');
    const result = await provider.testConnection();
    expect(result.ok).toBe(false);
  });

  it('testConnection returns ok:true on successful API call', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: 'gpt-4' }] }),
    } as Response);
    const provider = new OpenAIProvider('sk-valid');
    const result = await provider.testConnection();
    expect(result.ok).toBe(true);
  });
});

describe('OpenAIProvider.analyzeIssue', () => {
  it('returns parsed result on success', async () => {
    const mockResult = {
      title: 'Missing alt text',
      description: 'Image has no alt attribute',
      severity: 'high',
      wcag_codes: ['1.1.1'],
      confidence: 0.9,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: JSON.stringify(mockResult) } }],
        }),
    } as Response);
    const provider = new OpenAIProvider('sk-test');
    const result = await provider.analyzeIssue('Image without alt text');
    expect(result.title).toBe('Missing alt text');
    expect(result.severity).toBe('high');
    expect(result.wcag_codes).toEqual(['1.1.1']);
  });

  it('throws when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } }),
    } as Response);
    const provider = new OpenAIProvider('sk-test');
    await expect(provider.analyzeIssue('test')).rejects.toThrow();
  });

  it('throws when response JSON is malformed', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'not json' } }],
        }),
    } as Response);
    const provider = new OpenAIProvider('sk-test');
    await expect(provider.analyzeIssue('test')).rejects.toThrow();
  });

  it('throws when response is missing required fields', async () => {
    const incompleteResult = { title: 'Something', description: 'desc' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: JSON.stringify(incompleteResult) } }],
        }),
    } as Response);
    const provider = new OpenAIProvider('sk-test');
    await expect(provider.analyzeIssue('test')).rejects.toThrow(
      'AI response missing required fields'
    );
  });

  it('throws when severity is not a valid value', async () => {
    const badResult = {
      title: 'Title',
      description: 'desc',
      severity: 'urgent',
      wcag_codes: ['1.1.1'],
      confidence: 0.8,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: JSON.stringify(badResult) } }],
        }),
    } as Response);
    const provider = new OpenAIProvider('sk-test');
    await expect(provider.analyzeIssue('test')).rejects.toThrow(
      'AI response missing required fields'
    );
  });
});

describe('OpenAIProvider.generateReportSection', () => {
  it('returns report section string on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'This is the executive summary.' } }],
        }),
    } as Response);
    const provider = new OpenAIProvider('sk-test');
    const result = await provider.generateReportSection('Some audit context', 'Executive Summary');
    expect(result).toBe('This is the executive summary.');
  });

  it('throws when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Quota exceeded' } }),
    } as Response);
    const provider = new OpenAIProvider('sk-test');
    await expect(provider.generateReportSection('context', 'Section')).rejects.toThrow();
  });
});

describe('OpenAIProvider.generateVpatRemarks', () => {
  it('returns vpat remark string on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'Does not support criterion 1.1.1.' } }],
        }),
    } as Response);
    const provider = new OpenAIProvider('sk-test');
    const result = await provider.generateVpatRemarks('Missing alt text on images', '1.1.1');
    expect(result).toBe('Does not support criterion 1.1.1.');
  });

  it('throws when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
    } as Response);
    const provider = new OpenAIProvider('sk-test');
    await expect(provider.generateVpatRemarks('summary', '1.1.1')).rejects.toThrow();
  });
});

describe('AnthropicProvider', () => {
  it('testConnection returns ok:false when API key is empty', async () => {
    const provider = new AnthropicProvider('');
    const result = await provider.testConnection();
    expect(result.ok).toBe(false);
  });

  it('testConnection returns ok:false when API call fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
    } as Response);
    const provider = new AnthropicProvider('sk-ant-invalid');
    const result = await provider.testConnection();
    expect(result.ok).toBe(false);
  });

  it('testConnection returns ok:true on successful API call', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ text: 'pong' }] }),
    } as Response);
    const provider = new AnthropicProvider('sk-ant-valid');
    const result = await provider.testConnection();
    expect(result.ok).toBe(true);
  });
});

describe('AnthropicProvider.analyzeIssue', () => {
  it('returns parsed result on success', async () => {
    const mockResult = {
      title: 'Missing alt text',
      description: 'Image has no alt attribute',
      severity: 'high',
      wcag_codes: ['1.1.1'],
      confidence: 0.9,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: JSON.stringify(mockResult) }],
        }),
    } as Response);
    const provider = new AnthropicProvider('sk-ant-test');
    const result = await provider.analyzeIssue('Image without alt text');
    expect(result.title).toBe('Missing alt text');
    expect(result.severity).toBe('high');
    expect(result.wcag_codes).toEqual(['1.1.1']);
  });

  it('throws when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } }),
    } as Response);
    const provider = new AnthropicProvider('sk-ant-test');
    await expect(provider.analyzeIssue('test')).rejects.toThrow();
  });

  it('throws when response JSON is malformed', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: 'not json' }],
        }),
    } as Response);
    const provider = new AnthropicProvider('sk-ant-test');
    await expect(provider.analyzeIssue('test')).rejects.toThrow();
  });

  it('throws when response is missing required fields', async () => {
    const incompleteResult = { title: 'Something', description: 'desc' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: JSON.stringify(incompleteResult) }],
        }),
    } as Response);
    const provider = new AnthropicProvider('sk-ant-test');
    await expect(provider.analyzeIssue('test')).rejects.toThrow(
      'AI response missing required fields'
    );
  });

  it('throws when severity is not a valid value', async () => {
    const badResult = {
      title: 'Title',
      description: 'desc',
      severity: 'urgent',
      wcag_codes: ['1.1.1'],
      confidence: 0.8,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: JSON.stringify(badResult) }],
        }),
    } as Response);
    const provider = new AnthropicProvider('sk-ant-test');
    await expect(provider.analyzeIssue('test')).rejects.toThrow(
      'AI response missing required fields'
    );
  });
});

describe('AnthropicProvider.generateReportSection', () => {
  it('returns report section string on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: 'This is the executive summary.' }],
        }),
    } as Response);
    const provider = new AnthropicProvider('sk-ant-test');
    const result = await provider.generateReportSection('Some audit context', 'Executive Summary');
    expect(result).toBe('This is the executive summary.');
  });

  it('throws when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Quota exceeded' } }),
    } as Response);
    const provider = new AnthropicProvider('sk-ant-test');
    await expect(provider.generateReportSection('context', 'Section')).rejects.toThrow();
  });
});

describe('AnthropicProvider.generateVpatRemarks', () => {
  it('returns vpat remark string on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: 'Does not support criterion 1.1.1.' }],
        }),
    } as Response);
    const provider = new AnthropicProvider('sk-ant-test');
    const result = await provider.generateVpatRemarks('Missing alt text on images', '1.1.1');
    expect(result).toBe('Does not support criterion 1.1.1.');
  });

  it('throws when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
    } as Response);
    const provider = new AnthropicProvider('sk-ant-test');
    await expect(provider.generateVpatRemarks('summary', '1.1.1')).rejects.toThrow();
  });
});

describe('getAIProvider', () => {
  beforeEach(() => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
  });

  it('returns null when no provider configured', () => {
    expect(getAIProvider()).toBeNull();
  });

  it('returns OpenAIProvider when provider is openai', () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_API_KEY = 'sk-test';
    const provider = getAIProvider();
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('returns AnthropicProvider when provider is anthropic', () => {
    process.env.AI_PROVIDER = 'anthropic';
    process.env.AI_API_KEY = 'sk-ant-test';
    const provider = getAIProvider();
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it('returns null for unknown provider string', () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'some-key';
    const provider = getAIProvider();
    expect(provider).toBeNull();
  });
});
