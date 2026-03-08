import { describe, it, expect } from 'vitest';
import { CreateAssessmentSchema, UpdateAssessmentSchema } from '../assessments';

describe('CreateAssessmentSchema', () => {
  it('accepts a valid name-only input', () => {
    const result = CreateAssessmentSchema.safeParse({ name: 'Baseline Audit' });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = CreateAssessmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = CreateAssessmentSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 200 chars', () => {
    const result = CreateAssessmentSchema.safeParse({ name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects description longer than 2000 chars', () => {
    const result = CreateAssessmentSchema.safeParse({
      name: 'Audit',
      description: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid status values', () => {
    expect(CreateAssessmentSchema.safeParse({ name: 'A', status: 'planning' }).success).toBe(true);
    expect(CreateAssessmentSchema.safeParse({ name: 'A', status: 'in_progress' }).success).toBe(
      true
    );
    expect(CreateAssessmentSchema.safeParse({ name: 'A', status: 'completed' }).success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = CreateAssessmentSchema.safeParse({ name: 'A', status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('accepts valid ISO datetime strings for test dates', () => {
    const result = CreateAssessmentSchema.safeParse({
      name: 'Audit',
      test_date_start: '2024-01-15T00:00:00.000Z',
      test_date_end: '2024-01-20T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-datetime strings for test dates', () => {
    const result = CreateAssessmentSchema.safeParse({
      name: 'Audit',
      test_date_start: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects test_date_end before test_date_start', () => {
    const result = CreateAssessmentSchema.safeParse({
      name: 'Audit',
      test_date_start: '2024-01-20T00:00:00.000Z',
      test_date_end: '2024-01-15T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('accepts equal test_date_start and test_date_end', () => {
    const result = CreateAssessmentSchema.safeParse({
      name: 'Audit',
      test_date_start: '2024-01-15T00:00:00.000Z',
      test_date_end: '2024-01-15T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts test_date_end without test_date_start', () => {
    const result = CreateAssessmentSchema.safeParse({
      name: 'Audit',
      test_date_end: '2024-01-20T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional assigned_to string', () => {
    const result = CreateAssessmentSchema.safeParse({ name: 'Audit', assigned_to: 'Jane' });
    expect(result.success).toBe(true);
  });
});

describe('UpdateAssessmentSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(UpdateAssessmentSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial update', () => {
    expect(UpdateAssessmentSchema.safeParse({ name: 'New Name' }).success).toBe(true);
  });

  it('still rejects invalid values', () => {
    expect(UpdateAssessmentSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('still validates date range on partial updates', () => {
    const result = UpdateAssessmentSchema.safeParse({
      test_date_start: '2024-01-20T00:00:00.000Z',
      test_date_end: '2024-01-10T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('accepts project_id as a UUID', () => {
    const result = UpdateAssessmentSchema.safeParse({
      project_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });
    expect(result.success).toBe(true);
    expect(result.data?.project_id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  });

  it('rejects non-UUID project_id', () => {
    const result = UpdateAssessmentSchema.safeParse({ project_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});
