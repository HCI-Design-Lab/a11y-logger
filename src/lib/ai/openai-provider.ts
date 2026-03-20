import type {
  AIProvider,
  AIAnalysisResult,
  VpatGenerationContext,
  VpatRowGenerationResult,
} from './types';
import {
  ANALYZE_ISSUE_SYSTEM,
  EXECUTIVE_SUMMARY_SYSTEM,
  REPORT_WRITER_SYSTEM,
  VPAT_REMARKS_SYSTEM,
  buildReportSectionUser,
  buildExecutiveSummaryUser,
  buildVpatRemarksUser,
  buildVpatRowPrompt,
  parseVpatRowResponse,
} from './prompts';

const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

export class OpenAIProvider implements AIProvider {
  private readonly model = 'gpt-4o-mini';

  constructor(private apiKey: string) {}

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    if (!this.apiKey) return { ok: false, error: 'No API key provided' };
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
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
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: ANALYZE_ISSUE_SYSTEM,
          },
          { role: 'user', content: plainText },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.error?.message ?? 'API request failed');
    }
    const data = await res.json();
    const content = data.choices[0].message.content;
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(content) as Record<string, unknown>;
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
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: REPORT_WRITER_SYSTEM,
          },
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
    return data.choices[0].message.content as string;
  }

  async generateExecutiveSummaryHtml(context: string): Promise<string> {
    if (!this.apiKey) throw new Error('No API key configured');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: EXECUTIVE_SUMMARY_SYSTEM,
          },
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
    return data.choices[0].message.content as string;
  }

  async generateVpatRow(context: VpatGenerationContext): Promise<VpatRowGenerationResult> {
    if (!this.apiKey) throw new Error('No API key configured');
    const prompt = buildVpatRowPrompt(context);
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.error?.message ?? 'API request failed');
    }
    const data = await res.json();
    return parseVpatRowResponse(data.choices[0].message.content as string);
  }

  async generateVpatRemarks(issueSummary: string, criterion: string): Promise<string> {
    if (!this.apiKey) throw new Error('No API key configured');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: VPAT_REMARKS_SYSTEM,
          },
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
    return data.choices[0].message.content as string;
  }
}
