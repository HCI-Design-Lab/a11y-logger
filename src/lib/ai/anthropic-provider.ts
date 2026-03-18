import type {
  AIProvider,
  AIAnalysisResult,
  VpatGenerationContext,
  VpatRowGenerationResult,
} from './types';
import { buildVpatRowPrompt, parseVpatRowResponse } from './vpat-prompt';

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
        system:
          'You are an accessibility expert. Analyze the issue description and return JSON with these fields:\n- title (string): Short summary of the issue\n- description (string): Detailed description of the accessibility problem\n- severity (string): One of "critical", "high", "medium", or "low" using these criteria:\n  * critical: Blocks an assistive tech user from completing a task\n  * high: Causes severe obstacles but user can still complete the task\n  * medium: Causes some difficulty; more of an annoyance\n  * low: An accessibility issue but easily ignored or circumvented\n- wcag_codes (string[]): Relevant WCAG 2.x criterion codes (e.g. ["1.1.1", "4.1.2"])\n- section_508_codes (string[]): Relevant Section 508 criterion codes. Valid codes: 302.1, 302.2, 302.3, 302.4, 302.5, 302.6, 302.7, 302.8, 302.9, 502.2.1, 502.2.2, 502.3.1, 502.3.2, 502.3.3, 602.2, 602.3, 602.4, 603.2. Return [] if none apply.\n- eu_codes (string[]): Relevant EN 301 549 criterion codes. Valid codes: 4.2.1, 4.2.2, 4.2.3, 4.2.4, 4.2.5, 4.2.6, 4.2.7, 4.2.8, 4.2.9, 4.2.10, 5.2, 5.3, 5.4, 5.7, 5.8, 5.9, 12.1.1, 12.1.2, 12.2.2, 12.2.3, 12.2.4. Return [] if none apply.\n- user_impact (string): How this issue affects users with disabilities, especially assistive tech users\n- suggested_fix (string): Concrete, actionable remediation steps\n- confidence (number): Your confidence score from 0 to 1\n\nReturn only valid JSON, no markdown.',
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
            content: `Write the "${sectionTitle}" section for an accessibility audit report based on:\n\n${context}`,
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
        system:
          'You are an accessibility report writer. Return only valid HTML using <p>, <ul>, <li>, and <strong> tags. No markdown. No surrounding code blocks. No other HTML elements.',
        messages: [
          {
            role: 'user',
            content: `Write an Executive Summary for an accessibility audit report using the data below. Follow this exact structure:\n\n1. A single opening <p> (max 300 words) describing what was audited, its purpose (WCAG compliance), and the total number of issues found.\n2. A <ul> listing only the count of issues per severity level that has at least one issue (e.g. <li><strong>High Severity Issues (6):</strong></li>). Do not list individual issues.\n3. A single closing <p> about the importance of addressing these issues for users with disabilities and WCAG compliance.\n\nData:\n${context}`,
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
            content: `Write a VPAT remark for criterion ${criterion} based on: ${issueSummary}`,
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
