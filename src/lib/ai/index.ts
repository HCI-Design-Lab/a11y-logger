import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import type { AIProvider } from './types';

export function getAIProvider(): AIProvider | null {
  const provider = process.env.AI_PROVIDER;
  const apiKey = process.env.AI_API_KEY;
  if (!provider || !apiKey) return null;
  if (provider === 'openai') return new OpenAIProvider(apiKey);
  if (provider === 'anthropic') return new AnthropicProvider(apiKey);
  return null;
}

export type {
  AIProvider,
  AIAnalysisResult,
  VpatGenerationContext,
  VpatRowGenerationResult,
} from './types';
export { OpenAIProvider } from './openai-provider';
export { AnthropicProvider } from './anthropic-provider';
