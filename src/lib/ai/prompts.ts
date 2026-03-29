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
  'Quick Wins (respond with up to 5 items, one per line, no bullets or numbering)';

export const TOP_RISKS_SECTION =
  'Top Risks (respond with up to 5 items, one per line, no bullets or numbering)';

// ─── User message builders ────────────────────────────────────────────────────

export function buildReportSectionUser(context: string, sectionTitle: string): string {
  return `Write the "${sectionTitle}" section based on this context:\n\n${context}`;
}

export function buildExecutiveSummaryUser(context: string): string {
  return `Write an Executive Summary for an accessibility audit report using the data below. Follow this exact structure:\n\n1. A single opening <p> (max 300 words) describing what was audited, its purpose (WCAG compliance), and the total number of issues found.\n2. A <ul> listing only the count of issues per severity level that has at least one issue (e.g. <li><strong>High Severity Issues (6):</strong></li>). Do not list individual issues.\n3. A single closing <p> about the importance of addressing these issues for users with disabilities and WCAG compliance.\n\nData:\n${context}`;
}

export function buildVpatRemarksUser(issueSummary: string, criterion: string): string {
  return `Write a VPAT remark for criterion ${criterion} based on: ${issueSummary}`;
}

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
    suggested_conformance: result.suggested_conformance as VpatRowGenerationResult['suggested_conformance'],
  };
}
