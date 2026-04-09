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
  buildVpatReviewPrompt,
  parseVpatRowResponse,
} from './prompts';

const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

/**
 * AI provider implementation backed by the Vercel AI SDK.
 *
 * Wraps any Vercel AI SDK `LanguageModel` (OpenAI, Anthropic, Google, Ollama, or
 * any OpenAI-compatible model) and adapts it to the `AIProvider` interface. All methods
 * call `generateText` from the `ai` package; streaming is not used.
 *
 * Instantiate via `getAIProvider()` in `src/lib/ai/index.ts`, which selects the correct
 * underlying model based on the application's BYOK configuration.
 */
export class VercelAIProvider implements AIProvider {
  constructor(private model: LanguageModel) {}

  /**
   * Sends a minimal ping to the configured model to verify the connection is working.
   *
   * @returns A Promise resolving to `{ ok: true }` on success, or
   *   `{ ok: false, error: string }` if the request fails.
   */
  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      await generateText({ model: this.model, prompt: 'ping', maxOutputTokens: 1 });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Connection failed' };
    }
  }

  /**
   * Analyzes a plain-text accessibility issue description using the configured AI model.
   *
   * Uses `ANALYZE_ISSUE_SYSTEM` as the system prompt. The AI is expected to return valid JSON
   * matching `AIAnalysisResult` (title, description, severity, WCAG codes, Section 508 codes,
   * EU codes, user impact, suggested fix, confidence score).
   *
   * @param plainText - A plain-text description of the accessibility issue to analyze.
   * @returns A Promise resolving to a validated `AIAnalysisResult` object.
   * @throws {Error} If the AI response is not valid JSON or is missing required fields.
   */
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

  /**
   * Generates plain-text content for a named report section.
   *
   * Uses `REPORT_WRITER_SYSTEM` as the system prompt and `buildReportSectionUser` to
   * construct the user message. The response is returned as-is (plain text).
   *
   * @param context - A text summary of the audit data relevant to this section.
   * @param sectionTitle - The name of the section to generate (e.g. `"Quick Wins"`).
   * @returns A Promise resolving to the generated section text.
   */
  async generateReportSection(context: string, sectionTitle: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      system: REPORT_WRITER_SYSTEM,
      prompt: buildReportSectionUser(context, sectionTitle),
    });
    return text;
  }

  /**
   * Generates an HTML executive summary for an accessibility audit report.
   *
   * Uses `EXECUTIVE_SUMMARY_SYSTEM` as the system prompt and `buildExecutiveSummaryUser` to
   * construct the user message. The AI returns HTML using only `<p>`, `<ul>`, `<li>`, and
   * `<strong>` tags — no markdown or other HTML elements.
   *
   * @param context - A text summary of the audit data (issue counts, severity breakdown, etc.).
   * @returns A Promise resolving to an HTML string suitable for sanitizing and rendering in the report.
   */
  async generateExecutiveSummaryHtml(context: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      system: EXECUTIVE_SUMMARY_SYSTEM,
      prompt: buildExecutiveSummaryUser(context),
    });
    return text;
  }

  /**
   * Generates a short VPAT conformance remark for a given criterion.
   *
   * Uses `VPAT_REMARKS_SYSTEM` as the system prompt and `buildVpatRemarksUser` to
   * construct the user message. The response is returned as plain text.
   *
   * @param issueSummary - A text summary of issues relevant to the criterion.
   * @param criterion - The criterion code (e.g. `"1.1.1"`) the remark is for.
   * @returns A Promise resolving to the generated conformance remark as plain text.
   */
  async generateVpatRemarks(issueSummary: string, criterion: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      system: VPAT_REMARKS_SYSTEM,
      prompt: buildVpatRemarksUser(issueSummary, criterion),
    });
    return text;
  }

  /**
   * Generates a full VPAT criterion row result using AI-assisted reasoning.
   *
   * Uses `buildVpatRowPrompt` to construct a detailed prompt (no separate system prompt).
   * The AI response is parsed and validated by `parseVpatRowResponse`.
   *
   * @param context - The criterion metadata and array of mapped issues for this row.
   * @returns A Promise resolving to a validated `VpatRowGenerationResult` containing
   *   remarks, confidence, reasoning, referenced issues, and a suggested conformance level.
   * @throws {Error} If the AI response is not valid JSON or is missing required fields.
   */
  async generateVpatRow(context: VpatGenerationContext): Promise<VpatRowGenerationResult> {
    const { text } = await generateText({
      model: this.model,
      prompt: buildVpatRowPrompt(context),
    });
    return parseVpatRowResponse(text);
  }

  /**
   * Critiques and optionally corrects a first-pass VPAT row result.
   *
   * @param context - The original criterion metadata and array of mapped issues.
   * @param firstPass - The result from the first `generateVpatRow` call.
   * @returns A Promise resolving to a validated `VpatRowGenerationResult`.
   * @throws {Error} If the AI response is not valid JSON or is missing required fields.
   */
  async reviewVpatRow(
    context: VpatGenerationContext,
    firstPass: VpatRowGenerationResult
  ): Promise<VpatRowGenerationResult> {
    const { text } = await generateText({
      model: this.model,
      prompt: buildVpatReviewPrompt(context, firstPass),
    });
    return parseVpatRowResponse(text);
  }
}
