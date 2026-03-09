import type { AIProvider, AIAnalysisResult } from './types';

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
            content:
              'You are an accessibility expert. Analyze the issue description and return JSON with these fields:\n- title (string): Short summary of the issue\n- description (string): Detailed description of the accessibility problem\n- severity (string): One of "critical", "high", "medium", or "low" using these criteria:\n  * critical: Blocks an assistive tech user from completing a task\n  * high: Causes severe obstacles but user can still complete the task\n  * medium: Causes some difficulty; more of an annoyance\n  * low: An accessibility issue but easily ignored or circumvented\n- wcag_codes (string[]): Relevant WCAG 2.x criterion codes (e.g. ["1.1.1", "4.1.2"])\n- user_impact (string): How this issue affects users with disabilities, especially assistive tech users\n- suggested_fix (string): Concrete, actionable remediation steps\n- confidence (number): Your confidence score from 0 to 1',
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
            content:
              'You are an accessibility report writer. Write clear, professional content for accessibility audit reports.',
          },
          {
            role: 'user',
            content: `Write the "${sectionTitle}" section based on this context:\n\n${context}`,
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
            content:
              'You are an accessibility report writer. Return only valid HTML using <p>, <ul>, <ol>, <li>, <strong>, <em>, and <blockquote> tags. No markdown. No surrounding code blocks. No other HTML elements.',
          },
          {
            role: 'user',
            content: `Write the Executive Summary section for an accessibility audit report based on:\n\n${context}`,
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
            content:
              'You write VPAT remarks for accessibility conformance. Be concise and specific.',
          },
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
    return data.choices[0].message.content as string;
  }
}
