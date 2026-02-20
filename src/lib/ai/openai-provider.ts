import type { AIProvider, AIAnalysisResult } from './types';

export class OpenAIProvider implements AIProvider {
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
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an accessibility expert. Analyze the issue and return JSON with fields: title (string), description (string), severity (critical|high|medium|low), wcag_codes (string[]), confidence (0-1 number).',
          },
          { role: 'user', content: plainText },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content) as AIAnalysisResult;
  }

  async generateReportSection(context: string, sectionTitle: string): Promise<string> {
    if (!this.apiKey) throw new Error('No API key configured');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
    const data = await res.json();
    return data.choices[0].message.content as string;
  }

  async generateVpatRemarks(issueSummary: string, criterion: string): Promise<string> {
    if (!this.apiKey) throw new Error('No API key configured');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
    const data = await res.json();
    return data.choices[0].message.content as string;
  }
}
