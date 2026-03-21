import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
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

export class VercelAIProvider implements AIProvider {
  constructor(private model: LanguageModel) {}

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      await generateText({ model: this.model, prompt: 'ping', maxOutputTokens: 1 });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Connection failed' };
    }
  }

  async analyzeIssue(plainText: string): Promise<AIAnalysisResult> {
    const { text } = await generateText({
      model: this.model,
      system: ANALYZE_ISSUE_SYSTEM,
      prompt: plainText,
    });
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
    const { text } = await generateText({
      model: this.model,
      system: REPORT_WRITER_SYSTEM,
      prompt: buildReportSectionUser(context, sectionTitle),
    });
    return text;
  }

  async generateExecutiveSummaryHtml(context: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      system: EXECUTIVE_SUMMARY_SYSTEM,
      prompt: buildExecutiveSummaryUser(context),
    });
    return text;
  }

  async generateVpatRemarks(issueSummary: string, criterion: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      system: VPAT_REMARKS_SYSTEM,
      prompt: buildVpatRemarksUser(issueSummary, criterion),
    });
    return text;
  }

  async generateVpatRow(context: VpatGenerationContext): Promise<VpatRowGenerationResult> {
    const { text } = await generateText({
      model: this.model,
      prompt: buildVpatRowPrompt(context),
    });
    return parseVpatRowResponse(text);
  }
}
