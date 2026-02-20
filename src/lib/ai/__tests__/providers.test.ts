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
});
