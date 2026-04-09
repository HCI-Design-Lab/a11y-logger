import { describe, it, expect } from 'vitest';
import {
  ANALYZE_ISSUE_SYSTEM,
  EXECUTIVE_SUMMARY_SYSTEM,
  REPORT_WRITER_SYSTEM,
  VPAT_REMARKS_SYSTEM,
  QUICK_WINS_SECTION,
  TOP_RISKS_SECTION,
  buildReportSectionUser,
  buildExecutiveSummaryUser,
  buildVpatRemarksUser,
  buildUserImpactPrompt,
  buildVpatRowPrompt,
  parseVpatRowResponse,
} from '../prompts';
import { buildVpatReviewPrompt } from '../prompts';
import type { VpatGenerationContext, VpatRowGenerationResult } from '../types';

describe('system prompt constants', () => {
  it('ANALYZE_ISSUE_SYSTEM contains key instructions', () => {
    expect(ANALYZE_ISSUE_SYSTEM).toContain('accessibility expert');
    expect(ANALYZE_ISSUE_SYSTEM).toContain('severity');
    expect(ANALYZE_ISSUE_SYSTEM).toContain('wcag_codes');
    expect(ANALYZE_ISSUE_SYSTEM).toContain('Return only valid JSON');
  });

  it('EXECUTIVE_SUMMARY_SYSTEM specifies HTML output', () => {
    expect(EXECUTIVE_SUMMARY_SYSTEM).toContain('HTML');
    expect(EXECUTIVE_SUMMARY_SYSTEM).toContain('No markdown');
  });

  it('REPORT_WRITER_SYSTEM identifies role', () => {
    expect(REPORT_WRITER_SYSTEM).toContain('accessibility report writer');
  });

  it('VPAT_REMARKS_SYSTEM identifies role', () => {
    expect(VPAT_REMARKS_SYSTEM).toContain('VPAT');
  });
});

describe('section title constants', () => {
  it('QUICK_WINS_SECTION contains section name', () => {
    expect(QUICK_WINS_SECTION).toContain('Quick Wins');
  });

  it('TOP_RISKS_SECTION contains section name', () => {
    expect(TOP_RISKS_SECTION).toContain('Top Risks');
  });
});

describe('buildReportSectionUser', () => {
  it('includes context and section title', () => {
    const result = buildReportSectionUser('audit data here', 'Executive Summary');
    expect(result).toContain('audit data here');
    expect(result).toContain('Executive Summary');
  });
});

describe('buildExecutiveSummaryUser', () => {
  it('includes context data', () => {
    const result = buildExecutiveSummaryUser('10 issues found');
    expect(result).toContain('10 issues found');
    expect(result).toContain('Executive Summary');
  });
});

describe('buildVpatRemarksUser', () => {
  it('includes criterion and issue summary', () => {
    const result = buildVpatRemarksUser('missing alt text', '1.1.1');
    expect(result).toContain('1.1.1');
    expect(result).toContain('missing alt text');
  });
});

describe('buildUserImpactPrompt', () => {
  it('includes context and JSON shape', () => {
    const result = buildUserImpactPrompt('audit context');
    expect(result).toContain('audit context');
    expect(result).toContain('screen_reader');
    expect(result).toContain('JSON');
  });
});

describe('buildVpatRowPrompt', () => {
  it('includes criterion code and issue list', () => {
    const result = buildVpatRowPrompt({
      criterion: {
        code: '1.1.1',
        name: 'Non-text Content',
        description: 'All images need alt text.',
      },
      issues: [
        {
          title: 'Missing alt',
          severity: 'high',
          url: 'https://example.com',
          description: 'Logo has no alt.',
        },
      ],
    });
    expect(result).toContain('1.1.1');
    expect(result).toContain('Missing alt');
    expect(result).toContain('high');
  });

  it('handles empty issues list', () => {
    const result = buildVpatRowPrompt({
      criterion: {
        code: '2.1.1',
        name: 'Keyboard',
        description: 'All functionality via keyboard.',
      },
      issues: [],
    });
    expect(result).toContain('No issues mapped');
  });

  it('includes referenced_issues and suggested_conformance in prompt JSON spec', () => {
    const result = buildVpatRowPrompt({
      criterion: { code: '1.1.1', name: 'Non-text Content', description: 'Alt text.' },
      issues: [{ title: 'Missing alt', severity: 'high', url: '', description: '' }],
    });
    expect(result).toContain('referenced_issues');
    expect(result).toContain('suggested_conformance');
  });
});

describe('parseVpatRowResponse', () => {
  it('parses valid JSON response', () => {
    const raw = JSON.stringify({
      reasoning: 'Step by step analysis.',
      remarks: 'Partially supports criterion.',
      confidence: 'medium',
      referenced_issues: [],
      suggested_conformance: 'supports',
    });
    const result = parseVpatRowResponse(raw);
    expect(result.remarks).toBe('Partially supports criterion.');
    expect(result.confidence).toBe('medium');
    expect(result.reasoning).toBe('Step by step analysis.');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseVpatRowResponse('not json')).toThrow('Invalid response from AI provider');
  });

  it('throws when required fields are missing', () => {
    expect(() => parseVpatRowResponse(JSON.stringify({ remarks: 'ok' }))).toThrow(
      'AI response missing required fields'
    );
  });

  it('throws when confidence is not a valid value', () => {
    expect(() =>
      parseVpatRowResponse(
        JSON.stringify({ remarks: 'ok', confidence: 'unknown', reasoning: 'ok' })
      )
    ).toThrow('AI response missing required fields');
  });

  it('parses referenced_issues and suggested_conformance', () => {
    const raw = JSON.stringify({
      reasoning: 'Analysis.',
      remarks: 'Does not support.',
      confidence: 'high',
      referenced_issues: [{ title: 'Missing alt', severity: 'high' }],
      suggested_conformance: 'does_not_support',
    });
    const result = parseVpatRowResponse(raw);
    expect(result.referenced_issues).toEqual([{ title: 'Missing alt', severity: 'high' }]);
    expect(result.suggested_conformance).toBe('does_not_support');
  });

  it('throws when referenced_issues is missing', () => {
    expect(() =>
      parseVpatRowResponse(
        JSON.stringify({
          reasoning: 'ok',
          remarks: 'ok',
          confidence: 'high',
          suggested_conformance: 'supports',
        })
      )
    ).toThrow('AI response missing required fields');
  });

  it('throws when suggested_conformance is invalid', () => {
    expect(() =>
      parseVpatRowResponse(
        JSON.stringify({
          reasoning: 'ok',
          remarks: 'ok',
          confidence: 'high',
          referenced_issues: [],
          suggested_conformance: 'partially_supports',
        })
      )
    ).toThrow('AI response missing required fields');
  });

  it('throws when referenced_issues items have wrong shape', () => {
    expect(() =>
      parseVpatRowResponse(
        JSON.stringify({
          reasoning: 'ok',
          remarks: 'ok',
          confidence: 'high',
          referenced_issues: [{ title: 'Missing alt' }], // missing severity
          suggested_conformance: 'supports',
        })
      )
    ).toThrow('AI response missing required fields');
  });
});

describe('buildVpatReviewPrompt', () => {
  const context: VpatGenerationContext = {
    criterion: {
      code: '1.1.1',
      name: 'Non-text Content',
      description: 'Provide text alternatives.',
    },
    issues: [
      {
        title: 'Missing alt',
        severity: 'high',
        url: 'https://example.com',
        description: 'No alt.',
      },
    ],
  };
  const firstPass: VpatRowGenerationResult = {
    remarks: 'Does not support 1.1.1.',
    confidence: 'high',
    reasoning: 'One high severity issue found.',
    referenced_issues: [{ title: 'Missing alt', severity: 'high' }],
    suggested_conformance: 'does_not_support',
  };

  it('includes the criterion code and name', () => {
    const prompt = buildVpatReviewPrompt(context, firstPass);
    expect(prompt).toContain('1.1.1');
    expect(prompt).toContain('Non-text Content');
  });

  it('includes the first-pass conformance and remarks', () => {
    const prompt = buildVpatReviewPrompt(context, firstPass);
    expect(prompt).toContain('does_not_support');
    expect(prompt).toContain('Does not support 1.1.1.');
  });

  it('instructs the model to return valid JSON', () => {
    const prompt = buildVpatReviewPrompt(context, firstPass);
    expect(prompt).toContain('Return only valid JSON');
  });

  it('includes issue count in the prompt', () => {
    const prompt = buildVpatReviewPrompt(context, firstPass);
    expect(prompt).toContain('1 total');
  });

  it('shows "No issues" text when issues array is empty', () => {
    const prompt = buildVpatReviewPrompt({ ...context, issues: [] }, firstPass);
    expect(prompt).toContain('No issues mapped');
  });
});
