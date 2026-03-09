import { describe, it, expect } from 'vitest';
import { CreateReportSchema, UpdateReportSchema, ReportContentSchema } from '../reports';

describe('ReportContentSchema', () => {
  it('accepts empty object', () => {
    expect(ReportContentSchema.safeParse({}).success).toBe(true);
  });

  it('accepts executive_summary', () => {
    const result = ReportContentSchema.safeParse({ executive_summary: { body: 'Hello' } });
    expect(result.success).toBe(true);
  });

  it('accepts top_risks with items array', () => {
    const result = ReportContentSchema.safeParse({ top_risks: { items: ['Risk 1', 'Risk 2'] } });
    expect(result.success).toBe(true);
  });

  it('accepts quick_wins with items array', () => {
    const result = ReportContentSchema.safeParse({ quick_wins: { items: ['Win 1'] } });
    expect(result.success).toBe(true);
  });

  it('accepts user_impact with all sub-fields', () => {
    const result = ReportContentSchema.safeParse({
      user_impact: {
        screen_reader: 'a',
        low_vision: 'b',
        color_vision: 'c',
        keyboard_only: 'd',
        cognitive: 'e',
        deaf_hard_of_hearing: 'f',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown keys', () => {
    const result = ReportContentSchema.safeParse({ unknown_section: {} });
    expect(result.success).toBe(false);
  });
});

describe('CreateReportSchema', () => {
  it('requires title and assessment_ids', () => {
    const result = CreateReportSchema.safeParse({ title: 'R1', assessment_ids: ['abc'] });
    expect(result.success).toBe(true);
  });

  it('rejects missing assessment_ids', () => {
    const result = CreateReportSchema.safeParse({ title: 'R1' });
    expect(result.success).toBe(false);
  });

  it('rejects empty assessment_ids array', () => {
    const result = CreateReportSchema.safeParse({ title: 'R1', assessment_ids: [] });
    expect(result.success).toBe(false);
  });

  it('does not require project_id', () => {
    const result = CreateReportSchema.safeParse({ title: 'R1', assessment_ids: ['abc'] });
    expect(result.success).toBe(true);
    expect((result as { data: { project_id?: string } }).data?.project_id).toBeUndefined();
  });

  it('rejects empty title', () => {
    const result = CreateReportSchema.safeParse({ title: '', assessment_ids: ['a'] });
    expect(result.success).toBe(false);
  });

  it('rejects title over 200 characters', () => {
    const result = CreateReportSchema.safeParse({ title: 'x'.repeat(201), assessment_ids: ['a'] });
    expect(result.success).toBe(false);
  });
});

describe('UpdateReportSchema', () => {
  it('accepts partial content update', () => {
    const result = UpdateReportSchema.safeParse({
      content: { executive_summary: { body: 'Updated' } },
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no-op update)', () => {
    const result = UpdateReportSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects empty title string', () => {
    const result = UpdateReportSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty assessment_ids array', () => {
    const result = UpdateReportSchema.safeParse({ assessment_ids: [] });
    expect(result.success).toBe(false);
  });

  it('accepts valid assessment_ids', () => {
    const result = UpdateReportSchema.safeParse({ assessment_ids: ['a', 'b'] });
    expect(result.success).toBe(true);
  });
});
