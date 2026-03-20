import type {
  AIProvider,
  AIAnalysisResult,
  VpatGenerationContext,
  VpatRowGenerationResult,
} from './types';
import {
  ANALYZE_ISSUE_SYSTEM,
  EXECUTIVE_SUMMARY_SYSTEM,
  buildReportSectionUser,
  buildExecutiveSummaryUser,
  buildVpatRemarksUser,
  buildVpatRowPrompt,
  parseVpatRowResponse,
} from './prompts';

const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

export class AnthropicProvider implements AIProvider {
  private readonly model = 'claude-haiku-4-5-20251001';

  constructor(private apiKey: string) {}

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    if (!this.apiKey) return { ok: false, error: 'No API key provided' };
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        return { ok: false, error: data?.error?.message ?? 'API request failed' };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  }

  async analyzeIssue(plainText: string): Promise<AIAnalysisResult> {
    if (!this.apiKey) throw new Error('No API key configured');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system: ANALYZE_ISSUE_SYSTEM,
        messages: [{ role: 'user', content: plainText }],
      }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.error?.message ?? 'API request failed');
    }
    const data = await res.json();
    const text = data.content[0].text;
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error('Invalid response from AI provider');
    }
    if (
      typeof result.title !== 'string' ||
      typeof result.description !== 'string' ||
      !VALID_SEVERITIES.includes(result.severity as (typeof VALID_SEVERITIES)[number]) ||
      !Array.isArray(result.wcag_codes) ||
      !Array.isArray(result.section_508_codes) ||
      !Array.isArray(result.eu_codes) ||
      typeof result.user_impact !== 'string' ||
      typeof result.suggested_fix !== 'string' ||
      typeof result.confidence !== 'number'
    ) {
      throw new Error('AI response missing required fields');
    }
    return result as unknown as AIAnalysisResult;
  }

  async generateReportSection(context: string, sectionTitle: string): Promise<string> {
    if (!this.apiKey) throw new Error('No API key configured');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: buildReportSectionUser(context, sectionTitle),
          },
        ],
      }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.error?.message ?? 'API request failed');
    }
    const data = await res.json();
    return data.content[0].text as string;
  }

  async generateExecutiveSummaryHtml(context: string): Promise<string> {
    if (!this.apiKey) throw new Error('No API key configured');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        system: EXECUTIVE_SUMMARY_SYSTEM,
        messages: [
          {
            role: 'user',
            content: buildExecutiveSummaryUser(context),
          },
        ],
      }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.error?.message ?? 'API request failed');
    }
    const data = await res.json();
    return data.content[0].text as string;
  }

  async generateVpatRow(context: VpatGenerationContext): Promise<VpatRowGenerationResult> {
    if (!this.apiKey) throw new Error('No API key configured');
    const prompt = buildVpatRowPrompt(context);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.error?.message ?? 'API request failed');
    }
    const data = await res.json();
    return parseVpatRowResponse(data.content[0].text as string);
  }

  async generateVpatRemarks(issueSummary: string, criterion: string): Promise<string> {
    if (!this.apiKey) throw new Error('No API key configured');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: buildVpatRemarksUser(issueSummary, criterion),
          },
        ],
      }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.error?.message ?? 'API request failed');
    }
    const data = await res.json();
    return data.content[0].text as string;
  }
}
