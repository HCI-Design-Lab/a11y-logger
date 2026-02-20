import type { AIProvider, AIAnalysisResult } from './types';

export class AnthropicProvider implements AIProvider {
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
          model: 'claude-haiku-4-5-20251001',
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system:
          'You are an accessibility expert. Analyze the issue and return JSON with fields: title (string), description (string), severity (critical|high|medium|low), wcag_codes (string[]), confidence (0-1 number). Return only JSON.',
        messages: [{ role: 'user', content: plainText }],
      }),
    });
    const data = await res.json();
    return JSON.parse(data.content[0].text) as AIAnalysisResult;
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Write the "${sectionTitle}" section for an accessibility audit report based on:\n\n${context}`,
          },
        ],
      }),
    });
    const data = await res.json();
    return data.content[0].text as string;
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `Write a VPAT remark for criterion ${criterion} based on: ${issueSummary}`,
          },
        ],
      }),
    });
    const data = await res.json();
    return data.content[0].text as string;
  }
}
