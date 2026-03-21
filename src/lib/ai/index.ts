import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getSetting } from '@/lib/db/settings';
import { VercelAIProvider } from './vercel-provider';
import type { AIProvider } from './types';

export function getAIProvider(): AIProvider | null {
  // Env vars take priority over DB settings
  const provider = (
    process.env.AI_PROVIDER ??
    (getSetting('ai_provider') as string | null) ??
    ''
  ).toLowerCase();

  const apiKey = process.env.AI_API_KEY ?? (getSetting('ai_api_key') as string | null) ?? '';

  const model = process.env.AI_MODEL ?? (getSetting('ai_model') as string | null) ?? '';

  const baseUrl = process.env.AI_BASE_URL ?? (getSetting('ai_base_url') as string | null) ?? '';

  if (!provider || provider === 'none') return null;

  switch (provider) {
    case 'openai': {
      if (!apiKey) return null;
      const openai = createOpenAI({ apiKey });
      return new VercelAIProvider(openai(model || 'gpt-4o-mini'));
    }
    case 'anthropic': {
      if (!apiKey) return null;
      const anthropic = createAnthropic({ apiKey });
      return new VercelAIProvider(anthropic(model || 'claude-haiku-4-5-20251001'));
    }
    case 'google': {
      if (!apiKey) return null;
      const google = createGoogleGenerativeAI({ apiKey });
      return new VercelAIProvider(google(model || 'gemini-2.0-flash'));
    }
    case 'ollama': {
      if (!model) return null;
      const ollamaBase = baseUrl || 'http://localhost:11434/v1';
      const ollama = createOpenAI({ baseURL: ollamaBase, apiKey: 'ollama' });
      return new VercelAIProvider(ollama(model));
    }
    case 'openai-compatible': {
      if (!baseUrl || !model) return null;
      const custom = createOpenAI({ baseURL: baseUrl, apiKey: apiKey || '' });
      return new VercelAIProvider(custom(model));
    }
    default:
      return null;
  }
}

export type {
  AIProvider,
  AIAnalysisResult,
  VpatGenerationContext,
  VpatRowGenerationResult,
} from './types';
export { VercelAIProvider } from './vercel-provider';
