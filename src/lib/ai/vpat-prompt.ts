import type { VpatGenerationContext, VpatRowGenerationResult } from './types';

const VALID_CONFIDENCE = ['high', 'medium', 'low'] as const;

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
  "confidence": "high | medium | low"
}

Confidence guide:
- high: clear evidence (multiple issues, consistent severity, good coverage)
- medium: partial evidence or mixed signals
- low: no issues found or insufficient evidence

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
    typeof result.reasoning !== 'string'
  ) {
    throw new Error('AI response missing required fields');
  }
  return {
    remarks: result.remarks,
    confidence: result.confidence as VpatRowGenerationResult['confidence'],
    reasoning: result.reasoning,
  };
}
