import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAIProvider } from '../index';
import { getSetting } from '@/lib/db/settings';
import { VercelAIProvider } from '../vercel-provider';

vi.mock('@/lib/db/settings', () => ({
  getSetting: vi.fn(),
}));

describe('getAIProvider (updated)', () => {
  beforeEach(() => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
    delete process.env.AI_BASE_URL;
    vi.mocked(getSetting).mockReturnValue(null);
  });

  it('returns null when no provider configured', () => {
    expect(getAIProvider()).toBeNull();
  });

  it('returns null when provider is "none"', () => {
    vi.mocked(getSetting).mockImplementation((key) => (key === 'ai_provider' ? 'none' : null));
    expect(getAIProvider()).toBeNull();
  });

  it('returns VercelAIProvider for openai from DB settings', () => {
    vi.mocked(getSetting).mockImplementation((key) => {
      if (key === 'ai_provider') return 'openai';
      if (key === 'ai_api_key') return 'sk-test';
      return null;
    });
    expect(getAIProvider()).toBeInstanceOf(VercelAIProvider);
  });

  it('returns VercelAIProvider for openai from env vars', () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_API_KEY = 'sk-test';
    expect(getAIProvider()).toBeInstanceOf(VercelAIProvider);
  });

  it('env vars take priority over DB settings', () => {
    vi.mocked(getSetting).mockImplementation((key) => {
      if (key === 'ai_provider') return 'anthropic';
      if (key === 'ai_api_key') return 'sk-ant-db';
      return null;
    });
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_API_KEY = 'sk-env';
    const provider = getAIProvider();
    expect(provider).toBeInstanceOf(VercelAIProvider);
  });

  it('returns VercelAIProvider for anthropic', () => {
    vi.mocked(getSetting).mockImplementation((key) => {
      if (key === 'ai_provider') return 'anthropic';
      if (key === 'ai_api_key') return 'sk-ant-test';
      return null;
    });
    expect(getAIProvider()).toBeInstanceOf(VercelAIProvider);
  });

  it('returns VercelAIProvider for google', () => {
    vi.mocked(getSetting).mockImplementation((key) => {
      if (key === 'ai_provider') return 'google';
      if (key === 'ai_api_key') return 'goog-key';
      return null;
    });
    expect(getAIProvider()).toBeInstanceOf(VercelAIProvider);
  });

  it('returns VercelAIProvider for ollama without API key', () => {
    vi.mocked(getSetting).mockImplementation((key) => {
      if (key === 'ai_provider') return 'ollama';
      if (key === 'ai_model') return 'llama3.2';
      return null;
    });
    expect(getAIProvider()).toBeInstanceOf(VercelAIProvider);
  });

  it('returns null for ollama when no model configured', () => {
    vi.mocked(getSetting).mockImplementation((key) => (key === 'ai_provider' ? 'ollama' : null));
    expect(getAIProvider()).toBeNull();
  });

  it('returns VercelAIProvider for openai-compatible with base URL and model', () => {
    vi.mocked(getSetting).mockImplementation((key) => {
      if (key === 'ai_provider') return 'openai-compatible';
      if (key === 'ai_base_url') return 'https://api.groq.com/openai/v1';
      if (key === 'ai_model') return 'llama-3.1-8b-instant';
      return null;
    });
    expect(getAIProvider()).toBeInstanceOf(VercelAIProvider);
  });

  it('returns null for openai-compatible when base URL is missing', () => {
    vi.mocked(getSetting).mockImplementation((key) =>
      key === 'ai_provider' ? 'openai-compatible' : null
    );
    expect(getAIProvider()).toBeNull();
  });

  it('returns null for openai-compatible when model is missing', () => {
    vi.mocked(getSetting).mockImplementation((key) => {
      if (key === 'ai_provider') return 'openai-compatible';
      if (key === 'ai_base_url') return 'https://custom.api.com/v1';
      return null;
    });
    expect(getAIProvider()).toBeNull();
  });

  it('returns null for unknown provider', () => {
    vi.mocked(getSetting).mockImplementation((key) =>
      key === 'ai_provider' ? 'unknown-provider' : null
    );
    expect(getAIProvider()).toBeNull();
  });
});
