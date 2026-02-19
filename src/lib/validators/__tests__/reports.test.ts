import { describe, it, expect } from 'vitest';
import { CreateReportSchema, UpdateReportSchema } from '../reports';

describe('CreateReportSchema', () => {
  it('accepts a valid minimal input', () => {
    const result = CreateReportSchema.safeParse({
      title: 'Quarterly Report',
      project_id: 'proj-123',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const result = CreateReportSchema.safeParse({
      title: 'Full Report',
      project_id: 'proj-123',
      type: 'executive',
      content: [{ title: 'Overview', body: '## Summary\n\nAll good.' }],
      template_id: 'tmpl-abc',
      ai_generated: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = CreateReportSchema.safeParse({ project_id: 'proj-123' });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = CreateReportSchema.safeParse({ title: '', project_id: 'proj-123' });
    expect(result.success).toBe(false);
  });

  it('rejects title over 200 chars', () => {
    const result = CreateReportSchema.safeParse({
      title: 'A'.repeat(201),
      project_id: 'proj-123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing project_id', () => {
    const result = CreateReportSchema.safeParse({ title: 'Report' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = CreateReportSchema.safeParse({
      title: 'Report',
      project_id: 'proj-123',
      type: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects content section missing body', () => {
    const result = CreateReportSchema.safeParse({
      title: 'Report',
      project_id: 'proj-123',
      content: [{ title: 'Overview' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateReportSchema', () => {
  it('accepts empty object (no-op update)', () => {
    const result = UpdateReportSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = UpdateReportSchema.safeParse({ title: 'New Title' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title in partial update', () => {
    const result = UpdateReportSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('does not include project_id in parsed output (not updatable)', () => {
    const result = UpdateReportSchema.safeParse({
      title: 'Updated Title',
      project_id: 'proj-should-be-ignored',
    });
    expect(result.success).toBe(true);
    expect((result.data as Record<string, unknown>).project_id).toBeUndefined();
  });
});
