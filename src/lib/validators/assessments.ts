import { z } from 'zod';

const dateRangeRefine = (data: { test_date_start?: string; test_date_end?: string }) => {
  if (data.test_date_start && data.test_date_end) {
    return new Date(data.test_date_end) >= new Date(data.test_date_start);
  }
  return true;
};

const dateRangeRefineOptions = {
  message: 'test_date_end must be greater than or equal to test_date_start',
  path: ['test_date_end'],
};

const AssessmentBaseSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['planning', 'in_progress', 'completed']).optional(),
  test_date_start: z.string().datetime().optional(),
  test_date_end: z.string().datetime().optional(),
  assigned_to: z.string().optional(),
});

export const CreateAssessmentSchema = AssessmentBaseSchema.refine(
  dateRangeRefine,
  dateRangeRefineOptions
);

export const UpdateAssessmentSchema = AssessmentBaseSchema.partial()
  .extend({ project_id: z.string().uuid().optional() })
  .refine(dateRangeRefine, dateRangeRefineOptions);

export type CreateAssessmentInput = z.infer<typeof CreateAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof UpdateAssessmentSchema>;

// Form-local schema: accepts YYYY-MM-DD strings (HTML date input format).
// API-level date validation (ISO datetime) is handled server-side.
export const AssessmentFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(['planning', 'in_progress', 'completed']),
    test_date_start: z.string().optional(),
    test_date_end: z.string().optional(),
    project_id: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.test_date_start && d.test_date_end) {
        return new Date(d.test_date_end) >= new Date(d.test_date_start);
      }
      return true;
    },
    { message: 'End date must be on or after start date', path: ['test_date_end'] }
  );

export type AssessmentFormData = z.infer<typeof AssessmentFormSchema>;
