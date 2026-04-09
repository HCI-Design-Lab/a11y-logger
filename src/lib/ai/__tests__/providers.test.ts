import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAIProvider } from '../index';
import { getSetting } from '@/lib/db/settings';
import { VercelAIProvider } from '../vercel-provider';

vi.mock('@/lib/db/settings', () => ({
  getSetting: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn(() => 'openai-model')),
}));
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => vi.fn(() => 'anthropic-model')),
}));
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => 'google-model')),
}));

import { createOpenAI } from '@ai-sdk/openai';

const mockGetSetting = vi.mocked(getSetting);
const mockCreateOpenAI = vi.mocked(createOpenAI);

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

describe('getAIProvider — task-based model resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses task-specific model setting when set', () => {
    mockGetSetting.mockImplementation((key) => {
      if (key === 'ai_provider') return 'openai';
      if (key === 'ai_api_key') return 'sk-test';
      if (key === 'ai_model_vpat') return 'gpt-4o';
      if (key === 'ai_model') return '';
      return null;
    });
    const modelFn = vi.fn(() => 'resolved-model');
    mockCreateOpenAI.mockReturnValue(modelFn as never);

    getAIProvider('vpat');

    expect(modelFn).toHaveBeenCalledWith('gpt-4o');
  });

  it('falls back to ai_model when task model is empty', () => {
    mockGetSetting.mockImplementation((key) => {
      if (key === 'ai_provider') return 'openai';
      if (key === 'ai_api_key') return 'sk-test';
      if (key === 'ai_model_vpat') return '';
      if (key === 'ai_model') return 'gpt-4o-mini';
      return null;
    });
    const modelFn = vi.fn(() => 'resolved-model');
    mockCreateOpenAI.mockReturnValue(modelFn as never);

    getAIProvider('vpat');

    expect(modelFn).toHaveBeenCalledWith('gpt-4o-mini');
  });

  it('uses provider default when both task model and ai_model are empty', () => {
    mockGetSetting.mockImplementation((key) => {
      if (key === 'ai_provider') return 'openai';
      if (key === 'ai_api_key') return 'sk-test';
      return '';
    });
    const modelFn = vi.fn(() => 'resolved-model');
    mockCreateOpenAI.mockReturnValue(modelFn as never);

    getAIProvider('vpat');

    expect(modelFn).toHaveBeenCalledWith('gpt-4o-mini');
  });

  it('returns null when no provider is set', () => {
    mockGetSetting.mockReturnValue('none');
    expect(getAIProvider('vpat')).toBeNull();
  });

  it('behaves identically with no task argument (backward compat)', () => {
    mockGetSetting.mockImplementation((key) => {
      if (key === 'ai_provider') return 'openai';
      if (key === 'ai_api_key') return 'sk-test';
      if (key === 'ai_model') return 'gpt-4o-mini';
      return '';
    });
    const modelFn = vi.fn(() => 'resolved-model');
    mockCreateOpenAI.mockReturnValue(modelFn as never);

    getAIProvider();

    expect(modelFn).toHaveBeenCalledWith('gpt-4o-mini');
  });
});
