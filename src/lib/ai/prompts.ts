import type { VpatGenerationContext, VpatRowGenerationResult } from './types';

// ─── System prompts ──────────────────────────────────────────────────────────

export const ANALYZE_ISSUE_SYSTEM =
  'You are an accessibility expert. Analyze the issue description and return JSON with these fields:\n- title (string): Short summary of the issue\n- description (string): Detailed description of the accessibility problem\n- severity (string): One of "critical", "high", "medium", or "low" using these criteria:\n  * critical: Blocks an assistive tech user from completing a task\n  * high: Causes severe obstacles but user can still complete the task\n  * medium: Causes some difficulty; more of an annoyance\n  * low: An accessibility issue but easily ignored or circumvented\n- wcag_codes (string[]): Relevant WCAG 2.x criterion codes (e.g. ["1.1.1", "4.1.2"])\n- section_508_codes (string[]): Relevant Section 508 criterion codes. Valid codes: 302.1, 302.2, 302.3, 302.4, 302.5, 302.6, 302.7, 302.8, 302.9, 502.2.1, 502.2.2, 502.3.1, 502.3.2, 502.3.3, 602.2, 602.3, 602.4, 603.2. Return [] if none apply.\n- eu_codes (string[]): Relevant EN 301 549 criterion codes. Valid codes: 4.2.1, 4.2.2, 4.2.3, 4.2.4, 4.2.5, 4.2.6, 4.2.7, 4.2.8, 4.2.9, 4.2.10, 5.2, 5.3, 5.4, 5.7, 5.8, 5.9, 12.1.1, 12.1.2, 12.2.2, 12.2.3, 12.2.4. Return [] if none apply.\n- user_impact (string): How this issue affects users with disabilities, especially assistive tech users\n- suggested_fix (string): Concrete, actionable remediation steps\n- confidence (number): Your confidence score from 0 to 1\n\nReturn only valid JSON, no markdown.';

export const EXECUTIVE_SUMMARY_SYSTEM =
  'You are an accessibility report writer. Return only valid HTML using <p>, <ul>, <li>, and <strong> tags. No markdown. No surrounding code blocks. No other HTML elements.';

export const REPORT_WRITER_SYSTEM =
  'You are an accessibility report writer. Write clear, professional content for accessibility audit reports.';

export const VPAT_REMARKS_SYSTEM =
  'You write VPAT remarks for accessibility conformance. Be concise and specific.';

// ─── Section title constants ──────────────────────────────────────────────────

export const QUICK_WINS_SECTION =
  'Quick Wins (respond with up to 5 items, one per line, no bullets or numbering, each item must be exactly one sentence, do not repeat the section title as an item)';

export const TOP_RISKS_SECTION =
  'Top Risks (respond with up to 5 items, one per line, no bullets or numbering, each item must be exactly one sentence, do not repeat the section title as an item)';

// ─── User message builders ────────────────────────────────────────────────────

/**
 * Builds the user-turn message for generating a named report section.
 *
 * Intended to be used with `REPORT_WRITER_SYSTEM` as the system prompt.
 *
 * @param context - A text summary of the audit data relevant to this section.
 * @param sectionTitle - The name of the section to generate (e.g. `"Top Risks"`).
 * @returns A formatted prompt string instructing the AI to write the requested section.
 */
export function buildReportSectionUser(context: string, sectionTitle: string): string {
  return `Write the "${sectionTitle}" section based on this context:\n\n${context}`;
}

/**
 * Builds the user-turn message for generating an executive summary in HTML.
 *
 * Instructs the AI to produce a three-part HTML executive summary: an opening paragraph,
 * a severity breakdown list, and a closing paragraph. Intended to be used with
 * `EXECUTIVE_SUMMARY_SYSTEM` as the system prompt. The AI response will contain only
 * `<p>`, `<ul>`, `<li>`, and `<strong>` tags — no markdown.
 *
 * @param context - A text summary of the audit data (issue counts, severity breakdown, etc.).
 * @returns A formatted prompt string instructing the AI to write the executive summary.
 */
export function buildExecutiveSummaryUser(context: string): string {
  return `Write an Executive Summary for an accessibility audit report using the data below. Follow this exact structure:\n\n1. A single opening <p> (max 300 words) describing what was audited, its purpose (WCAG compliance), and the total number of issues found.\n2. A <ul> listing only the count of issues per severity level that has at least one issue (e.g. <li><strong>High Severity Issues (6):</strong></li>). Do not list individual issues.\n3. A single closing <p> about the importance of addressing these issues for users with disabilities and WCAG compliance.\n\nData:\n${context}`;
}

/**
 * Builds the user-turn message for generating a VPAT conformance remark.
 *
 * Intended to be used with `VPAT_REMARKS_SYSTEM` as the system prompt.
 *
 * @param issueSummary - A text summary of issues relevant to the criterion.
 * @param criterion - The WCAG or Section 508 criterion code (e.g. `"1.1.1"`).
 * @returns A formatted prompt string instructing the AI to write the VPAT remark.
 */
export function buildVpatRemarksUser(issueSummary: string, criterion: string): string {
  return `Write a VPAT remark for criterion ${criterion} based on: ${issueSummary}`;
}

/**
 * Builds a prompt that asks the AI to generate a per-disability-type user impact analysis.
 *
 * The AI is instructed to respond with JSON only (no markdown), matching the shape:
 * `{ screen_reader, low_vision, color_vision, keyboard_only, cognitive, deaf_hard_of_hearing }`.
 * Each field should be a short plain-text description of how that user group is affected.
 *
 * @param context - A text summary of the audit findings to base the analysis on.
 * @returns A formatted prompt string instructing the AI to produce the user impact JSON.
 */
export function buildUserImpactPrompt(context: string): string {
  return `${context}\n\nGenerate a user impact analysis. Respond with JSON only, no markdown, matching exactly this shape:
{
  "screen_reader": "...",
  "low_vision": "...",
  "color_vision": "...",
  "keyboard_only": "...",
  "cognitive": "...",
  "deaf_hard_of_hearing": "..."
}`;
}

// ─── VPAT row (moved from vpat-prompt.ts) ────────────────────────────────────

const VALID_CONFIDENCE = ['high', 'medium', 'low'] as const;
const VALID_SUGGESTED_CONFORMANCE = ['supports', 'does_not_support', 'not_applicable'] as const;

/**
 * Builds a structured prompt for AI-assisted VPAT criterion row generation.
 *
 * The prompt asks the AI to reason step-by-step about the mapped issues before producing
 * a JSON response matching `VpatRowGenerationResult`:
 * `{ reasoning, remarks, confidence, referenced_issues, suggested_conformance }`.
 *
 * @param context - The generation context including the WCAG criterion metadata and an array of
 *   mapped issues (title, severity, url, description).
 * @returns A formatted prompt string ready to send directly to a language model (no system prompt needed).
 */
export function buildVpatRowPrompt(context: VpatGenerationContext): string {
  const { criterion, issues } = context;
  const issueList =
    issues.length > 0
      ? issues.map((i) => `- [${i.severity}] ${i.title} (${i.url || 'no URL'})`).join('\n')
      : 'No issues mapped to this criterion.';

  return `You are writing a conformance remark for a VPAT (Voluntary Product Accessibility Template).

Criterion: ${criterion.code} — ${criterion.name}
Description: ${criterion.description}

Mapped issues (${issues.length} total):
${issueList}

First, reason step-by-step about the evidence:
1. How many issues are present and what is their severity?
2. Are they isolated or systemic?
3. Do any block task completion for users with disabilities?
4. Is the evidence sufficient to make a confident determination?

Then provide your output as JSON:
{
  "reasoning": "your step-by-step analysis",
  "remarks": "2-4 sentence professional conformance statement suitable for a client-facing VPAT. Do not include the conformance level. Do not use bullet points.",
  "confidence": "high | medium | low",
  "referenced_issues": [{ "title": "issue title", "severity": "issue severity" }],
  "suggested_conformance": "supports | does_not_support | not_applicable"
}

Confidence guide:
- high: clear evidence (multiple issues, consistent severity, good coverage)
- medium: partial evidence or mixed signals
- low: no issues found or insufficient evidence

Suggested conformance guide:
- supports: no issues found, or only trivial issues that do not affect conformance
- does_not_support: one or more issues that prevent full conformance
- not_applicable: the criterion does not apply to this product

For referenced_issues: list only the issues from the input that directly informed your reasoning. Use the exact title and severity from the input. Return an empty array if no issues were relevant.

Return only valid JSON, no markdown.`;
}

/**
 * Builds a review prompt that asks the AI to critique and correct a first-pass VPAT row result.
 *
 * @param context - The original criterion metadata and mapped issues.
 * @param firstPass - The result produced by the first-pass `generateVpatRow` call.
 * @returns A formatted prompt string ready to send to a language model.
 */
export function buildVpatReviewPrompt(
  context: VpatGenerationContext,
  firstPass: VpatRowGenerationResult
): string {
  const { criterion, issues } = context;
  const issueList =
    issues.length > 0
      ? issues.map((i) => `- [${i.severity}] ${i.title}`).join('\n')
      : 'No issues mapped to this criterion.';

  return `You are reviewing a VPAT conformance remark written by another AI. Your job is to verify the conformance call and correct it if the evidence does not support it.

Criterion: ${criterion.code} — ${criterion.name}
Description: ${criterion.description}

Mapped issues (${issues.length} total):
${issueList}

First-pass result:
- Suggested conformance: ${firstPass.suggested_conformance}
- Confidence: ${firstPass.confidence}
- Remarks: ${firstPass.remarks}
- Reasoning: ${firstPass.reasoning}

Review the first-pass result:
1. Does the suggested_conformance match the evidence?
2. Is the confidence level appropriate given the number and severity of issues?
3. Are the remarks accurate and professional?

If the first pass is correct, return it unchanged. If not, return a corrected version.

Return only valid JSON, no markdown:
{
  "reasoning": "your review analysis",
  "remarks": "corrected or unchanged 2-4 sentence professional conformance statement",
  "confidence": "high | medium | low",
  "referenced_issues": [{ "title": "...", "severity": "..." }],
  "suggested_conformance": "supports | does_not_support | not_applicable"
}`;
}

/**
 * Parses and validates a raw JSON string returned by the AI for a VPAT row.
 *
 * Validates that the parsed object contains all required fields with the correct types,
 * including that `confidence` is one of `"high" | "medium" | "low"` and
 * `suggested_conformance` is one of `"supports" | "does_not_support" | "not_applicable"`.
 *
 * @param raw - The raw JSON string from the AI response (no surrounding markdown).
 * @returns A validated `VpatRowGenerationResult` object.
 * @throws {Error} If `raw` is not valid JSON or any required field is missing or invalid.
 */
export function parseVpatRowResponse(raw: string): VpatRowGenerationResult {
  let result: Record<string, unknown>;
  try {
    result = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid response from AI provider');
  }
  if (
    typeof result.remarks !== 'string' ||
    typeof result.confidence !== 'string' ||
    !(VALID_CONFIDENCE as readonly string[]).includes(result.confidence) ||
    typeof result.reasoning !== 'string' ||
    !Array.isArray(result.referenced_issues) ||
    !result.referenced_issues.every(
      (item) =>
        typeof (item as Record<string, unknown>).title === 'string' &&
        typeof (item as Record<string, unknown>).severity === 'string'
    ) ||
    typeof result.suggested_conformance !== 'string' ||
    !(VALID_SUGGESTED_CONFORMANCE as readonly string[]).includes(result.suggested_conformance)
  ) {
    throw new Error('AI response missing required fields');
  }
  return {
    remarks: result.remarks,
    confidence: result.confidence as VpatRowGenerationResult['confidence'],
    reasoning: result.reasoning,
    referenced_issues: result.referenced_issues as { title: string; severity: string }[],
    suggested_conformance:
      result.suggested_conformance as VpatRowGenerationResult['suggested_conformance'],
  };
}
